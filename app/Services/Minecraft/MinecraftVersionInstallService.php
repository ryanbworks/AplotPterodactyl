<?php

namespace Pterodactyl\Services\Minecraft;

use Exception;
use Illuminate\Support\Arr;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Eloquent\ServerRepository;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class MinecraftVersionInstallService
{
    public function __construct(
        private DaemonFileRepository $fileRepository,
        private DaemonServerRepository $serverRepository,
        private ServerRepository $serverModelRepository,
    ) {
    }

    public function handle(Server $server, array $build, bool $acceptEula, ?int $javaVersion = null): array
    {
        $state = Arr::get($this->serverRepository->setServer($server)->getDetails(), 'state', 'offline');

        if (!in_array($state, ['offline', 'stopped'], true)) {
            throw new BadRequestHttpException('Desligue o servidor antes de instalar outra versão.');
        }

        $fileRepository = $this->fileRepository->setServer($server);
        $jarFile = $this->serverJarFile($server);
        $dockerImage = $this->updateDockerImage($server, $javaVersion);

        $this->backupCurrentJar($fileRepository, $jarFile);

        foreach (Arr::get($build, 'installation', []) as $stage) {
            foreach ($stage as $step) {
                $this->runStep($fileRepository, $step, $jarFile);
            }
        }

        if ($acceptEula) {
            $fileRepository->putContent('eula.txt', "eula=true\n");
        }

        $this->ensureDirectory($fileRepository, '.pterodactyl');
        $metadata = [
            'type' => Arr::get($build, 'type'),
            'version' => Arr::get($build, 'version'),
            'build' => Arr::get($build, 'name') ?: Arr::get($build, 'build_number'),
            'build_id' => Arr::get($build, 'id'),
            'java' => $javaVersion,
            'docker_image' => $dockerImage,
            'jar' => $jarFile,
            'installed_at' => now()->toIso8601String(),
        ];

        $fileRepository->putContent(
            '.pterodactyl/minecraft-version.json',
            json_encode($metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n"
        );

        Activity::event('server:minecraft.version-install')
            ->property('type', $metadata['type'])
            ->property('version', $metadata['version'])
            ->property('build', $metadata['build'])
            ->property('java', $metadata['java'])
            ->property('docker_image', $metadata['docker_image'])
            ->property('jar', $metadata['jar'])
            ->log();

        return $metadata;
    }

    private function updateDockerImage(Server $server, ?int $javaVersion): string
    {
        if (!$javaVersion) {
            return $server->image;
        }

        if (!in_array($server->image, array_values($server->egg->docker_images), true)) {
            throw new BadRequestHttpException('A imagem Docker deste servidor foi definida manualmente e não pode ser atualizada automaticamente.');
        }

        $image = $this->dockerImageForJava($server, $javaVersion);

        if (!$image) {
            throw new BadRequestHttpException(sprintf('Nenhuma imagem Docker Java %d está disponível neste egg.', $javaVersion));
        }

        if ($server->image === $image) {
            return $image;
        }

        $original = $server->image;
        $this->serverModelRepository->update($server->id, ['image' => $image]);

        Activity::event('server:startup.image')
            ->property(['old' => $original, 'new' => $image, 'java' => $javaVersion])
            ->log();

        return $image;
    }

    private function dockerImageForJava(Server $server, int $javaVersion): ?string
    {
        $expected = sprintf('java_%d', $javaVersion);

        foreach ($server->egg->docker_images as $label => $image) {
            if (str_contains(strtolower($label), sprintf('java %d', $javaVersion))) {
                return $image;
            }

            if (str_contains(strtolower($image), $expected)) {
                return $image;
            }
        }

        return null;
    }

    private function runStep(DaemonFileRepository $repository, array $step, string $jarFile): void
    {
        switch (Arr::get($step, 'type')) {
            case 'download':
                $url = Arr::get($step, 'url');
                $file = $this->safePath(Arr::get($step, 'file', 'server.jar'));
                $target = $file === 'server.jar' ? $jarFile : $file;

                [$directory, $filename] = $this->splitPath($target);
                if ($directory !== '/') {
                    $this->ensureDirectory($repository, trim($directory, '/'));
                }

                $repository->pull($url, $directory, [
                    'filename' => $filename,
                    'foreground' => true,
                ]);
                break;

            case 'remove':
                $location = $this->safePath(Arr::get($step, 'location'));
                $repository->deleteFiles('/', [$location]);
                break;

            case 'unzip':
                $file = $this->safePath(Arr::get($step, 'file'));
                $location = Arr::get($step, 'location', '.');

                if (!in_array($location, ['.', '/', ''], true)) {
                    throw new BadRequestHttpException('Esta build usa uma extração em pasta ainda não suportada.');
                }

                [$directory, $filename] = $this->splitPath($file);
                $repository->decompressFile($directory, $filename);
                break;

            default:
                throw new BadRequestHttpException('Esta build usa uma etapa de instalação ainda não suportada.');
        }
    }

    private function backupCurrentJar(DaemonFileRepository $repository, string $jarFile): void
    {
        $files = collect($repository->getDirectory('/'))->pluck('name')->all();

        if (!in_array($jarFile, $files, true)) {
            return;
        }

        if (in_array($jarFile . '.old', $files, true)) {
            $repository->deleteFiles('/', [$jarFile . '.old']);
        }

        $repository->renameFiles('/', [
            [
                'from' => $jarFile,
                'to' => $jarFile . '.old',
            ],
        ]);
    }

    private function serverJarFile(Server $server): string
    {
        $variable = $server->variables()->where('env_variable', 'SERVER_JARFILE')->first();
        $jarFile = $variable?->server_value ?: $variable?->default_value ?: 'server.jar';

        return preg_match('/^[\w\d._-]+\.jar$/', $jarFile) === 1 ? $jarFile : 'server.jar';
    }

    private function ensureDirectory(DaemonFileRepository $repository, string $path): void
    {
        $current = '/';

        foreach (array_filter(explode('/', $this->safePath($path))) as $part) {
            try {
                $repository->createDirectory($part, $current);
            } catch (Exception) {
                // Wings returns an error when the directory already exists, which is fine here.
            }

            $current = rtrim($current, '/') . '/' . $part;
        }
    }

    private function splitPath(string $path): array
    {
        $path = $this->safePath($path);
        $directory = trim(dirname($path), '.');

        return [
            $directory === '' ? '/' : '/' . trim($directory, '/'),
            basename($path),
        ];
    }

    private function safePath(?string $path): string
    {
        $path = trim((string) $path);

        if ($path === '' || str_starts_with($path, '/') || str_contains($path, '..') || str_contains($path, '\\')) {
            throw new BadRequestHttpException('O MCJars retornou uma instrução de arquivo inválida.');
        }

        return $path;
    }
}
