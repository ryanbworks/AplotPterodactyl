<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Minecraft;

use Pterodactyl\Models\Permission;
use Pterodactyl\Contracts\Http\ClientPermissionsRequest;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class ListMinecraftVersionsRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_READ;
    }

    public function rules(): array
    {
        return [
            'type' => 'sometimes|string|max:40|regex:/^[A-Za-z0-9_-]+$/',
            'version' => 'sometimes|string|max:80',
        ];
    }
}
