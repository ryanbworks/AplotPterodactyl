<?php

namespace Pterodactyl\Services\Minecraft;

use Exception;
use GuzzleHttp\Client;
use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

class McJarsService
{
    private const BASE_URI = 'https://versions.mcjars.app/api/v1';

    public function __construct(
        private CacheRepository $cache,
        private Client $client,
    ) {
    }

    public function getTypes(): array
    {
        $types = Arr::get($this->request('types'), 'types', []);

        $results = [];
        foreach ($types as $key => $type) {
            $results[] = [
                'id' => $key,
                'name' => Arr::get($type, 'name', $key),
                'icon' => Arr::get($type, 'icon'),
                'color' => Arr::get($type, 'color'),
                'homepage' => Arr::get($type, 'homepage'),
                'deprecated' => (bool) Arr::get($type, 'deprecated', false),
                'experimental' => (bool) Arr::get($type, 'experimental', false),
                'description' => Arr::get($type, 'description'),
                'categories' => Arr::get($type, 'categories', []),
                'compatibility' => Arr::get($type, 'compatibility', []),
                'builds' => (int) Arr::get($type, 'builds', 0),
                'versions' => Arr::get($type, 'versions', []),
            ];
        }

        usort($results, fn (array $a, array $b) => strcmp($a['name'], $b['name']));

        return $results;
    }

    public function getVersions(string $type): array
    {
        $versions = Arr::get($this->request(sprintf('builds/%s', $this->normalizeType($type))), 'versions', []);
        $results = [];

        foreach ($versions as $version => $data) {
            $results[] = [
                'id' => $version,
                'type' => Arr::get($data, 'type'),
                'supported' => (bool) Arr::get($data, 'supported', false),
                'java' => Arr::get($data, 'java'),
                'builds' => (int) Arr::get($data, 'builds', 0),
                'created' => Arr::get($data, 'created'),
                'latest' => $this->transformBuild(Arr::get($data, 'latest')),
            ];
        }

        return array_reverse($results);
    }

    public function getBuilds(string $type, string $version): array
    {
        $builds = Arr::get($this->request(sprintf(
            'builds/%s/%s',
            $this->normalizeType($type),
            rawurlencode($version)
        )), 'builds', []);

        return array_map(fn (array $build) => $this->transformBuild($build), $builds);
    }

    public function findBuild(string $type, string $version, int $buildId): array
    {
        foreach ($this->getBuilds($type, $version) as $build) {
            if ((int) $build['id'] === $buildId) {
                return $build;
            }
        }

        throw new BadRequestHttpException('A build selecionada não foi encontrada no MCJars.');
    }

    private function request(string $endpoint): array
    {
        $cacheKey = sprintf('minecraft:mcjars:%s', str_replace(['/', '?', '&', '='], ':', $endpoint));

        return $this->cache->remember($cacheKey, CarbonImmutable::now()->addMinutes(10), function () use ($endpoint) {
            try {
                $response = $this->client->request('GET', sprintf('%s/%s', self::BASE_URI, ltrim($endpoint, '/')), [
                    'timeout' => 10,
                    'connect_timeout' => 5,
                    'headers' => [
                        'Accept' => 'application/json',
                    ],
                ]);

                $data = json_decode($response->getBody()->__toString(), true);
            } catch (Exception $exception) {
                throw new ServiceUnavailableHttpException(null, 'Não consegui consultar as versões no MCJars.', $exception);
            }

            if (!is_array($data) || Arr::get($data, 'success') !== true) {
                throw new BadRequestHttpException('O MCJars não retornou dados válidos para esta consulta.');
            }

            return $data;
        });
    }

    private function transformBuild(?array $build): ?array
    {
        if (!$build) {
            return null;
        }

        return [
            'id' => (int) Arr::get($build, 'id'),
            'uuid' => Arr::get($build, 'uuid'),
            'version' => Arr::get($build, 'versionId'),
            'project_version' => Arr::get($build, 'projectVersionId'),
            'type' => Arr::get($build, 'type'),
            'experimental' => (bool) Arr::get($build, 'experimental', false),
            'name' => Arr::get($build, 'name'),
            'build_number' => Arr::get($build, 'buildNumber'),
            'jar_url' => Arr::get($build, 'jarUrl'),
            'jar_size' => Arr::get($build, 'jarSize'),
            'zip_url' => Arr::get($build, 'zipUrl'),
            'zip_size' => Arr::get($build, 'zipSize'),
            'installation' => Arr::get($build, 'installation', []),
            'changes' => Arr::get($build, 'changes', []),
            'created' => Arr::get($build, 'created'),
        ];
    }

    private function normalizeType(string $type): string
    {
        $type = strtoupper(trim($type));

        if (!preg_match('/^[A-Z0-9_-]{2,40}$/', $type)) {
            throw new BadRequestHttpException('Tipo de servidor Minecraft inválido.');
        }

        return $type;
    }
}
