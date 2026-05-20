<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Minecraft;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\Permission;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class InstallMinecraftVersionRequest extends ClientApiRequest
{
    public function authorize(): bool
    {
        $server = $this->route()->parameter('server');

        if (!$server instanceof Server) {
            return false;
        }

        return $this->user()->can(Permission::ACTION_FILE_CREATE, $server)
            && $this->user()->can(Permission::ACTION_FILE_UPDATE, $server)
            && $this->user()->can(Permission::ACTION_FILE_DELETE, $server)
            && $this->user()->can(Permission::ACTION_STARTUP_DOCKER_IMAGE, $server);
    }

    public function rules(): array
    {
        return [
            'type' => 'required|string|max:40|regex:/^[A-Za-z0-9_-]+$/',
            'version' => 'required|string|max:80',
            'buildId' => 'required|integer|min:1',
            'acceptEula' => 'boolean',
        ];
    }
}
