<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Exception;
use GuzzleHttp\Client;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\Minecraft\McJarsService;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\Minecraft\QueryMinecraftServerRequest;
use Pterodactyl\Services\Minecraft\MinecraftVersionInstallService;
use Pterodactyl\Http\Requests\Api\Client\Servers\Minecraft\ListMinecraftVersionsRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Minecraft\InstallMinecraftVersionRequest;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class MinecraftController extends ClientApiController
{
    public function __construct(
        private DaemonFileRepository $fileRepository,
        private McJarsService $mcJarsService,
        private MinecraftVersionInstallService $versionInstallService,
        private Client $httpClient,
    ) {
        parent::__construct();
    }

    public function query(QueryMinecraftServerRequest $request, Server $server): JsonResponse
    {
        $properties = $this->readServerProperties($server);
        $allocation = $server->allocation;
        $queryEnabled = strtolower($properties['enable-query'] ?? 'true') === 'true';
        $queryPort = (int) ($properties['query.port'] ?? $allocation?->port ?? 25565);

        if (!$queryEnabled) {
            return new JsonResponse([
                'enabled' => false,
                'online' => false,
                'host' => $this->hostForServer($server),
                'port' => $queryPort,
                'players' => [],
                'max_players' => null,
                'message' => 'Minecraft Query is disabled. Set enable-query=true in server.properties and restart the server.',
            ]);
        }

        try {
            $details = $this->queryServer($this->hostForServer($server), $queryPort);

            return new JsonResponse([
                'enabled' => true,
                'online' => true,
                'host' => $this->hostForServer($server),
                'port' => $queryPort,
                'players' => $details['players'],
                'max_players' => $details['max_players'],
                'version' => $details['version'],
                'motd' => $details['motd'],
                'map' => $details['map'],
                'software' => $details['software'],
            ]);
        } catch (Exception $exception) {
            return new JsonResponse([
                'enabled' => true,
                'online' => false,
                'host' => $this->hostForServer($server),
                'port' => $queryPort,
                'players' => [],
                'max_players' => null,
                'message' => 'Servidor sem resposta no Minecraft Query. Se ele estiver desligado ou iniciando, tente novamente quando estiver online.',
                'detail' => $exception->getMessage(),
            ], JsonResponse::HTTP_OK);
        }
    }

    public function profile(ListMinecraftVersionsRequest $request, Server $server): JsonResponse
    {
        $name = (string) $request->query('name', '');

        if (!preg_match('/^[A-Za-z0-9_]{1,16}$/', $name)) {
            throw new BadRequestHttpException('Informe um nick Minecraft válido.');
        }

        try {
            $response = $this->httpClient->request(
                'GET',
                sprintf('https://api.mojang.com/users/profiles/minecraft/%s', rawurlencode($name)),
                [
                    'timeout' => 8,
                    'connect_timeout' => 4,
                    'headers' => ['Accept' => 'application/json'],
                ]
            );

            $profile = json_decode($response->getBody()->__toString(), true);
        } catch (Exception) {
            $profile = null;
        }

        return new JsonResponse([
            'name' => $profile['name'] ?? $name,
            'uuid' => isset($profile['id']) ? $this->formatUuid($profile['id']) : null,
        ]);
    }

    public function versionTypes(ListMinecraftVersionsRequest $request, Server $server): JsonResponse
    {
        return new JsonResponse([
            'types' => $this->mcJarsService->getTypes(),
        ]);
    }

    public function installedVersion(ListMinecraftVersionsRequest $request, Server $server): JsonResponse
    {
        try {
            $content = $this->fileRepository
                ->setServer($server)
                ->getContent('.pterodactyl/minecraft-version.json', 1024 * 1024);
            $installed = json_decode($content, true);
        } catch (Exception) {
            $installed = null;
        }

        return new JsonResponse([
            'installed' => is_array($installed) ? $installed : null,
        ]);
    }

    public function versions(ListMinecraftVersionsRequest $request, Server $server): JsonResponse
    {
        $type = $request->query('type');

        if (!is_string($type) || trim($type) === '') {
            throw new BadRequestHttpException('Informe o tipo de servidor Minecraft.');
        }

        return new JsonResponse([
            'versions' => $this->mcJarsService->getVersions($type),
        ]);
    }

    public function versionBuilds(ListMinecraftVersionsRequest $request, Server $server): JsonResponse
    {
        $type = $request->query('type');
        $version = $request->query('version');

        if (!is_string($type) || trim($type) === '' || !is_string($version) || trim($version) === '') {
            throw new BadRequestHttpException('Informe o tipo e a versão do Minecraft.');
        }

        return new JsonResponse([
            'builds' => $this->mcJarsService->getBuilds($type, $version),
        ]);
    }

    public function installVersion(InstallMinecraftVersionRequest $request, Server $server): JsonResponse
    {
        $build = $this->mcJarsService->findBuild(
            $request->input('type'),
            $request->input('version'),
            (int) $request->input('buildId')
        );

        $version = collect($this->mcJarsService->getVersions($request->input('type')))
            ->first(fn (array $version) => $version['id'] === $request->input('version'));

        return new JsonResponse([
            'installed' => $this->versionInstallService->handle(
                $server,
                $build,
                $request->boolean('acceptEula'),
                $version['java'] ?? null
            ),
        ]);
    }

    private function readServerProperties(Server $server): array
    {
        try {
            $content = $this->fileRepository->setServer($server)->getContent('server.properties', 1024 * 1024);
        } catch (Exception) {
            return [];
        }

        $properties = [];

        foreach (preg_split('/\r?\n/', $content) ?: [] as $line) {
            $line = trim($line);

            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }

            [$key, $value] = explode('=', $line, 2);
            $properties[trim($key)] = trim($value);
        }

        return $properties;
    }

    private function formatUuid(string $uuid): string
    {
        if (str_contains($uuid, '-')) {
            return $uuid;
        }

        return sprintf(
            '%s-%s-%s-%s-%s',
            substr($uuid, 0, 8),
            substr($uuid, 8, 4),
            substr($uuid, 12, 4),
            substr($uuid, 16, 4),
            substr($uuid, 20)
        );
    }

    private function hostForServer(Server $server): string
    {
        $allocation = $server->allocation;

        if (!$allocation?->ip || $allocation->ip === '0.0.0.0' || $allocation->ip === '::') {
            return $server->node->fqdn;
        }

        return $allocation->ip_alias ?: $allocation->ip;
    }

    private function queryServer(string $host, int $port): array
    {
        $lastException = null;

        for ($attempt = 0; $attempt < 3; $attempt++) {
            try {
                return $this->queryServerOnce($host, $port);
            } catch (Exception $exception) {
                $lastException = $exception;
            }
        }

        throw $lastException ?? new Exception('Minecraft Query did not return server details.');
    }

    private function queryServerOnce(string $host, int $port): array
    {
        $socket = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);

        if (!$socket) {
            throw new Exception('Could not create a UDP socket for Minecraft Query.');
        }

        socket_set_option($socket, SOL_SOCKET, SO_RCVTIMEO, ['sec' => 3, 'usec' => 0]);

        $sessionId = random_int(1, 0x7f);
        $packet = "\xFE\xFD\x09" . pack('N', $sessionId);
        socket_sendto($socket, $packet, strlen($packet), 0, $host, $port);

        $handshake = '';
        $from = '';
        $fromPort = 0;
        $bytes = @socket_recvfrom($socket, $handshake, 2048, 0, $from, $fromPort);

        if ($bytes === false || strlen($handshake) < 6) {
            socket_close($socket);
            throw new Exception('Minecraft Query did not answer the handshake.');
        }

        $challenge = (int) trim(substr($handshake, 5));
        $packet = "\xFE\xFD\x00" . pack('N', $sessionId) . pack('N', $challenge) . "\x00\x00\x00\x00";
        socket_sendto($socket, $packet, strlen($packet), 0, $host, $port);

        $response = '';
        $bytes = @socket_recvfrom($socket, $response, 8192, 0, $from, $fromPort);
        socket_close($socket);

        if ($bytes === false || strlen($response) < 16) {
            throw new Exception('Minecraft Query did not return server details.');
        }

        return $this->parseFullStatResponse($response);
    }

    private function parseFullStatResponse(string $response): array
    {
        $payload = substr($response, 5);
        $playerMarker = "\x00\x01player_\x00\x00";
        $markerPosition = strpos($payload, $playerMarker);
        $detailsPayload = $markerPosition === false ? $payload : substr($payload, 0, $markerPosition);
        $playersPayload = $markerPosition === false ? '' : substr($payload, $markerPosition + strlen($playerMarker));
        $parts = explode("\x00", trim($detailsPayload, "\x00"));
        $details = [];

        for ($i = 0; $i + 1 < count($parts); $i += 2) {
            $details[$parts[$i]] = $parts[$i + 1];
        }

        $players = array_values(array_filter(explode("\x00", trim($playersPayload, "\x00")), function ($player) {
            return preg_match('/^[A-Za-z0-9_]{1,16}$/', $player) === 1;
        }));

        return [
            'players' => $players,
            'max_players' => isset($details['maxplayers']) ? (int) $details['maxplayers'] : null,
            'version' => $details['version'] ?? null,
            'motd' => $details['hostname'] ?? null,
            'map' => $details['map'] ?? null,
            'software' => $details['plugins'] ?? ($details['gametype'] ?? null),
        ];
    }
}
