<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Minecraft;

use Pterodactyl\Models\Permission;
use Pterodactyl\Contracts\Http\ClientPermissionsRequest;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class QueryMinecraftServerRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_READ_CONTENT;
    }
}
