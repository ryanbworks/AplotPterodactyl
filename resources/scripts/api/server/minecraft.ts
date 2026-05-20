import { FractalResponseData } from '@/api/http';
import http from '@/api/http';

export interface MinecraftEgg {
    uuid: string;
    name: string;
}

export interface MinecraftPropertyLine {
    type: 'property' | 'comment' | 'blank' | 'raw';
    key?: string;
    value?: string;
    raw: string;
}

export interface ParsedMinecraftProperties {
    lines: MinecraftPropertyLine[];
    values: Record<string, string>;
}

export interface MinecraftPlayerList {
    online: number;
    max: number | null;
    players: string[];
}

export interface MinecraftQueryResponse {
    enabled: boolean;
    online: boolean;
    host: string;
    port: number;
    players: string[];
    max_players: number | null;
    version?: string | null;
    motd?: string | null;
    map?: string | null;
    software?: string | null;
    message?: string;
}

export interface MinecraftListEntry {
    uuid?: string;
    name: string;
    level?: number;
    bypassesPlayerLimit?: boolean;
    reason?: string;
    source?: string;
    created?: string;
    expires?: string;
}

export interface MinecraftProfile {
    uuid: string | null;
    name: string;
}

export interface MinecraftVersionType {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
    homepage?: string | null;
    deprecated: boolean;
    experimental: boolean;
    description?: string | null;
    categories: string[];
    compatibility: string[];
    builds: number;
    versions: {
        minecraft?: number;
        project?: number;
    };
}

export interface MinecraftVersionBuild {
    id: number;
    uuid?: string | null;
    version: string;
    project_version?: string | null;
    type: string;
    experimental: boolean;
    name?: string | null;
    build_number?: number | string | null;
    jar_url?: string | null;
    jar_size?: number | null;
    zip_url?: string | null;
    zip_size?: number | null;
    installation: MinecraftVersionInstallStep[][];
    changes: string[];
    created?: string | null;
}

export interface MinecraftVersion {
    id: string;
    type?: string | null;
    supported: boolean;
    java?: number | null;
    builds: number;
    created?: string | null;
    latest?: MinecraftVersionBuild | null;
}

export interface MinecraftVersionInstallStep {
    type: 'download' | 'remove' | 'unzip' | string;
    url?: string;
    file?: string;
    location?: string;
    size?: number;
}

export interface InstallMinecraftVersionPayload {
    type: string;
    version: string;
    buildId: number;
    acceptEula: boolean;
}

export interface InstalledMinecraftVersion {
    type?: string | null;
    version?: string | null;
    build?: string | number | null;
    build_id?: number | null;
    java?: number | null;
    docker_image?: string | null;
    jar?: string | null;
    installed_at?: string | null;
}

const MINECRAFT_EGG_MATCHERS = ['minecraft', 'vanilla', 'paper', 'spigot', 'forge', 'fabric', 'sponge', 'bukkit'];

const cleanMinecraftConsoleLine = (line: string): string =>
    line
        // eslint-disable-next-line no-control-regex
        .replace(/\u001b\[[0-9;]*m/g, '')
        .replace(/^\[[^\]]+\]\s*(?:\[[^\]]+\]\s*)?:?\s*/, '')
        .trim();

export const rawDataToMinecraftEgg = (data?: FractalResponseData): MinecraftEgg | null => {
    if (!data?.attributes) {
        return null;
    }

    return {
        uuid: data.attributes.uuid,
        name: data.attributes.name,
    };
};

export const isMinecraftJavaEgg = (eggName?: string | null): boolean => {
    if (!eggName) {
        return false;
    }

    const normalized = eggName.toLowerCase();

    return MINECRAFT_EGG_MATCHERS.some((matcher) => normalized.includes(matcher));
};

export const isMinecraftJavaServer = (server?: {
    egg?: MinecraftEgg | null;
    dockerImage?: string | null;
    invocation?: string | null;
    eggFeatures?: string[] | null;
}): boolean => {
    if (!server) {
        return false;
    }

    if (isMinecraftJavaEgg(server.egg?.name)) {
        return true;
    }

    const dockerImage = server.dockerImage?.toLowerCase() || '';
    const invocation = server.invocation?.toLowerCase() || '';
    const features = server.eggFeatures || [];

    return (
        dockerImage.includes('java') ||
        invocation.includes('java') ||
        features.some((feature) => feature.toLowerCase().includes('eula'))
    );
};

export const parseMinecraftProperties = (content: string): ParsedMinecraftProperties => {
    const values: Record<string, string> = {};
    const lines = content.split(/\r?\n/).map((line): MinecraftPropertyLine => {
        if (line.trim().length === 0) {
            return { type: 'blank', raw: line };
        }

        if (line.trim().startsWith('#')) {
            return { type: 'comment', raw: line };
        }

        const separator = line.indexOf('=');

        if (separator < 0) {
            return { type: 'raw', raw: line };
        }

        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1);
        values[key] = value;

        return { type: 'property', key, value, raw: line };
    });

    return { lines, values };
};

export const serializeMinecraftProperties = (
    parsed: ParsedMinecraftProperties,
    values: Record<string, string>,
    orderedKeys: string[]
): string => {
    const written = new Set<string>();
    const lines = parsed.lines.map((line) => {
        if (line.type !== 'property' || !line.key) {
            return line.raw;
        }

        written.add(line.key);

        return `${line.key}=${values[line.key] ?? line.value ?? ''}`;
    });

    orderedKeys.forEach((key) => {
        if (!written.has(key) && Object.prototype.hasOwnProperty.call(values, key)) {
            lines.push(`${key}=${values[key] ?? ''}`);
        }
    });

    return lines.join('\n');
};

export const parseMinecraftListOutput = (line: string): MinecraftPlayerList | null => {
    const clean = cleanMinecraftConsoleLine(line);

    const match = clean.match(/There are\s+(\d+)(?:\s+of(?: a max of)?\s+|\/)(\d+)\s+players online(?::\s*(.*))?/i);

    if (!match) {
        return null;
    }

    const online = Number(match[1]);
    const max = Number(match[2]);
    const players = (match[3] || '')
        .split(',')
        .map((player) => player.trim())
        .filter((player) => player.length > 0);

    return {
        online,
        max: Number.isNaN(max) ? null : max,
        players,
    };
};

export const parseMinecraftPlayerNamesLine = (line: string): string[] => {
    const clean = cleanMinecraftConsoleLine(line);

    if (!clean || /^There are\s+/i.test(clean)) {
        return [];
    }

    return clean
        .split(',')
        .map((player) => player.trim())
        .filter((player) => /^[A-Za-z0-9_]{1,16}$/.test(player));
};

export const parseMinecraftJsonList = (content: string): MinecraftListEntry[] => {
    if (!content.trim()) {
        return [];
    }

    const data = JSON.parse(content);

    if (!Array.isArray(data)) {
        return [];
    }

    return data
        .map((entry) => ({
            uuid: typeof entry.uuid === 'string' ? entry.uuid : undefined,
            name: typeof entry.name === 'string' ? entry.name : '',
            level: typeof entry.level === 'number' ? entry.level : undefined,
            bypassesPlayerLimit: typeof entry.bypassesPlayerLimit === 'boolean' ? entry.bypassesPlayerLimit : undefined,
            reason: typeof entry.reason === 'string' ? entry.reason : undefined,
            source: typeof entry.source === 'string' ? entry.source : undefined,
            created: typeof entry.created === 'string' ? entry.created : undefined,
            expires: typeof entry.expires === 'string' ? entry.expires : undefined,
        }))
        .filter((entry) => entry.name.length > 0);
};

export const getMinecraftQuery = async (uuid: string): Promise<MinecraftQueryResponse> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/minecraft/query`);

    return data;
};

export const getMinecraftProfile = async (uuid: string, name: string): Promise<MinecraftProfile> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/minecraft/profile`, { params: { name } });

    return data;
};

export const minecraftBuildRequiresArchive = (build?: MinecraftVersionBuild | null): boolean =>
    !!build?.installation?.some((stage) => stage.some((step) => step.type === 'unzip'));

export const minecraftBuildDownloadSize = (build?: MinecraftVersionBuild | null): number | null => {
    if (!build) {
        return null;
    }

    return build.jar_size || build.zip_size || null;
};

export const minecraftBuildLabel = (build?: MinecraftVersionBuild | null): string => {
    if (!build) {
        return 'Build indisponível';
    }

    return build.name || (build.build_number ? `#${build.build_number}` : `Build ${build.id}`);
};

export const getMinecraftVersionTypes = async (uuid: string): Promise<MinecraftVersionType[]> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/minecraft/versions/types`);

    return data.types || [];
};

export const getInstalledMinecraftVersion = async (uuid: string): Promise<InstalledMinecraftVersion | null> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/minecraft/versions/installed`);

    return data.installed || null;
};

export const getMinecraftVersions = async (uuid: string, type: string): Promise<MinecraftVersion[]> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/minecraft/versions`, { params: { type } });

    return data.versions || [];
};

export const getMinecraftVersionBuilds = async (
    uuid: string,
    type: string,
    version: string
): Promise<MinecraftVersionBuild[]> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/minecraft/versions/builds`, {
        params: { type, version },
    });

    return data.builds || [];
};

export const installMinecraftVersion = async (
    uuid: string,
    payload: InstallMinecraftVersionPayload
): Promise<InstalledMinecraftVersion> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/minecraft/versions/install`, payload);

    return data.installed || {};
};
