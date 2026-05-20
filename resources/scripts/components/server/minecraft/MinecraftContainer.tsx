import React, { useEffect, useMemo, useState } from 'react';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import Button from '@/components/elements/Button';
import Input, { Textarea } from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';
import { NotFound } from '@/components/elements/ScreenBlock';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { httpErrorToHuman } from '@/api/http';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import useFlash from '@/plugins/useFlash';
import Switch from '@/components/elements/Switch';
import MinecraftVersionsContainer from '@/components/server/minecraft/MinecraftVersionsContainer';
import {
    MinecraftListEntry,
    parseMinecraftJsonList,
    ParsedMinecraftProperties,
    parseMinecraftProperties,
    serializeMinecraftProperties,
    isMinecraftJavaServer,
    getMinecraftQuery,
    getMinecraftProfile,
} from '@/api/server/minecraft';
import tw from 'twin.macro';
import {
    AlertCircle,
    Ban,
    ChevronDown,
    FileCog,
    ListChecks,
    LogOut,
    Pickaxe,
    RefreshCw,
    Save,
    ServerCog,
    Shield,
    Trash2,
    UserCheck,
    Users,
} from 'lucide-react';

type Tab = 'players' | 'lists' | 'properties' | 'versions';

interface PropertyDefinition {
    key: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    options?: string[];
}

const PROPERTY_FIELDS: PropertyDefinition[] = [
    { key: 'motd', label: 'MOTD', type: 'text' },
    { key: 'max-players', label: 'Máximo de players', type: 'number' },
    { key: 'difficulty', label: 'Dificuldade', type: 'select', options: ['peaceful', 'easy', 'normal', 'hard'] },
    { key: 'gamemode', label: 'Modo de jogo', type: 'select', options: ['survival', 'creative', 'adventure', 'spectator'] },
    { key: 'online-mode', label: 'Online mode', type: 'boolean' },
    { key: 'white-list', label: 'Whitelist ativa', type: 'boolean' },
    { key: 'enable-query', label: 'Query ativo', type: 'boolean' },
    { key: 'query.port', label: 'Porta Query', type: 'number' },
    { key: 'pvp', label: 'PVP', type: 'boolean' },
    { key: 'spawn-protection', label: 'Proteção do spawn', type: 'number' },
    { key: 'view-distance', label: 'View distance', type: 'number' },
    { key: 'simulation-distance', label: 'Simulation distance', type: 'number' },
    { key: 'enable-command-block', label: 'Command block', type: 'boolean' },
    { key: 'allow-flight', label: 'Permitir voo', type: 'boolean' },
    { key: 'allow-nether', label: 'Nether', type: 'boolean' },
    { key: 'level-name', label: 'Nome do mundo', type: 'text' },
];

const PROPERTY_KEYS = PROPERTY_FIELDS.map((field) => field.key);
const PLAYER_NAME_REGEX = /^[A-Za-z0-9_]{1,16}$/;

const listFileForAction = (action: string): string | null => {
    switch (action) {
        case 'whitelist-add':
        case 'whitelist-remove':
            return 'whitelist.json';
        case 'op':
        case 'deop':
            return 'ops.json';
        case 'ban':
        case 'pardon':
            return 'banned-players.json';
        default:
            return null;
    }
};

const commandFor = (action: string, player: string): string => {
    switch (action) {
        case 'whitelist-add':
            return `whitelist add ${player}`;
        case 'whitelist-remove':
            return `whitelist remove ${player}`;
        case 'op':
            return `op ${player}`;
        case 'deop':
            return `deop ${player}`;
        case 'ban':
            return `ban ${player}`;
        case 'pardon':
            return `pardon ${player}`;
        case 'kick':
            return `kick ${player}`;
        default:
            return '';
    }
};

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const serverStatus = ServerContext.useStoreState((state) => state.status.value);
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const [canConsole, canUpdateFiles, canCreateFiles] = usePermissions(['control.console', 'file.update', 'file.create']);
    const { addFlash, clearFlashes } = useFlash();

    const [tab, setTab] = useState<Tab>('players');
    const [refreshingPlayers, setRefreshingPlayers] = useState(false);
    const [playerStatus, setPlayerStatus] = useState('Clique em atualizar para consultar os players online.');
    const [onlinePlayers, setOnlinePlayers] = useState<string[]>([]);
    const [maxPlayers, setMaxPlayers] = useState<number | null>(null);
    const [commandPlayer, setCommandPlayer] = useState('');
    const [commandLoading, setCommandLoading] = useState('');

    const [loadingLists, setLoadingLists] = useState(false);
    const [whitelist, setWhitelist] = useState<MinecraftListEntry[]>([]);
    const [operators, setOperators] = useState<MinecraftListEntry[]>([]);
    const [bans, setBans] = useState<MinecraftListEntry[]>([]);

    const [loadingProperties, setLoadingProperties] = useState(false);
    const [savingProperties, setSavingProperties] = useState(false);
    const [parsedProperties, setParsedProperties] = useState<ParsedMinecraftProperties | null>(null);
    const [propertyValues, setPropertyValues] = useState<Record<string, string>>({});
    const [advancedProperties, setAdvancedProperties] = useState('');

    const isMinecraft = useMemo(() => isMinecraftJavaServer(server), [server]);
    const canSendCommand = canConsole && !!instance && connected;

    const canRunPlayerAction = (action: string) => canSendCommand || (canCreateFiles && !!listFileForAction(action));

    const refreshPlayers = () => {
        if (serverStatus === 'offline') {
            setOnlinePlayers([]);
            setMaxPlayers(null);
            setPlayerStatus('Servidor desligado. Ligue o servidor para consultar os players online.');
            return;
        }

        if (serverStatus === 'starting' || serverStatus === 'stopping') {
            setOnlinePlayers([]);
            setMaxPlayers(null);
            setPlayerStatus(
                serverStatus === 'starting'
                    ? 'Servidor iniciando. A lista de players aparece quando ele ficar online.'
                    : 'Servidor desligando. A consulta de players está indisponível no momento.'
            );
            return;
        }

        setRefreshingPlayers(true);
        setPlayerStatus('Consultando players online...');

        getMinecraftQuery(uuid)
            .then((response) => {
                setOnlinePlayers(response.players);
                setMaxPlayers(response.max_players);

                if (!response.enabled) {
                    setPlayerStatus(
                        `Query está desativado. Ative enable-query=true em server.properties e reinicie o servidor. Porta: ${response.port}.`
                    );
                    return;
                }

                if (!response.online) {
                    setPlayerStatus(
                        response.message ||
                            'Servidor sem resposta no Query. Se ele estiver desligado ou iniciando, tente novamente quando estiver online.'
                    );
                    return;
                }

                setPlayerStatus(
                    response.players.length > 0
                        ? `${response.players.length} player(s) online.`
                        : `Nenhum player online${response.max_players ? ` de ${response.max_players} slots` : ''}.`
                );
            })
            .catch((error) => {
                addFlash({ key: 'minecraft', type: 'error', message: httpErrorToHuman(error) });
                setPlayerStatus('Não consegui consultar o Minecraft Query deste servidor.');
            })
            .then(() => setRefreshingPlayers(false));
    };

    const updateListFile = (action: string, player: string) => {
        const trimmed = player.trim();
        const file = listFileForAction(action);

        if (!file) {
            addFlash({ key: 'minecraft', type: 'error', message: 'Esta ação exige o servidor online.' });
            return;
        }

        setCommandLoading(`${action}:${trimmed}`);
        clearFlashes('minecraft');

        Promise.all([getFileContents(uuid, file).catch(() => '[]'), getMinecraftProfile(uuid, trimmed)])
            .then(([content, profile]) => {
                const entries = parseMinecraftJsonList(content);
                const normalizedName = trimmed.toLowerCase();
                const normalizedUuid = profile.uuid?.toLowerCase() || '';
                const next = entries.filter((entry) => {
                    if (entry.name.toLowerCase() === normalizedName) {
                        return false;
                    }

                    return !normalizedUuid || entry.uuid?.toLowerCase() !== normalizedUuid;
                });

                if (action === 'whitelist-add') {
                    next.unshift({ uuid: profile.uuid || undefined, name: profile.name || trimmed });
                }

                if (action === 'op') {
                    next.unshift({
                        uuid: profile.uuid || undefined,
                        name: profile.name || trimmed,
                        level: 4,
                        bypassesPlayerLimit: false,
                    });
                }

                if (action === 'ban') {
                    next.unshift({
                        uuid: profile.uuid || undefined,
                        name: profile.name || trimmed,
                        created: new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' +0000'),
                        source: 'Panel',
                        expires: 'forever',
                        reason: 'Banned by an operator.',
                    });
                }

                return saveFileContents(uuid, file, `${JSON.stringify(next, null, 2)}\n`);
            })
            .then(() => {
                let message = 'Lista atualizada pelo arquivo. Reinicie o servidor para garantir que a mudança seja carregada.';

                if (action === 'whitelist-add') message = `O jogador ${trimmed} foi adicionado à whitelist pelo arquivo.`;
                if (action === 'whitelist-remove') message = `O jogador ${trimmed} foi removido da whitelist pelo arquivo.`;
                if (action === 'op') message = `O jogador ${trimmed} foi adicionado aos operadores pelo arquivo.`;
                if (action === 'deop') message = `O jogador ${trimmed} foi removido dos operadores pelo arquivo.`;
                if (action === 'ban') message = `O jogador ${trimmed} foi adicionado aos banidos pelo arquivo.`;
                if (action === 'pardon') message = `O jogador ${trimmed} foi removido dos banidos pelo arquivo.`;

                addFlash({ key: 'minecraft', type: 'success', message });
                loadLists();
            })
            .catch((error) => addFlash({ key: 'minecraft', type: 'error', message: httpErrorToHuman(error) }))
            .then(() => setCommandLoading(''));
    };

    const sendPlayerCommand = (action: string, player: string) => {
        const trimmed = player.trim();

        if (!PLAYER_NAME_REGEX.test(trimmed)) {
            addFlash({ key: 'minecraft', type: 'error', message: 'Informe um nick Minecraft válido.' });
            return;
        }

        if (!canSendCommand) {
            updateListFile(action, trimmed);
            return;
        }

        const command = commandFor(action, trimmed);

        if (!command) {
            return;
        }

        let successMessage = `Comando enviado: ${command}`;
        if (action === 'whitelist-add') successMessage = `O jogador ${trimmed} foi adicionado à whitelist.`;
        if (action === 'whitelist-remove') successMessage = `O jogador ${trimmed} foi removido da whitelist.`;
        if (action === 'op') successMessage = `O jogador ${trimmed} recebeu privilégios de operador.`;
        if (action === 'deop') successMessage = `Privilégios de operador removidos do jogador ${trimmed}.`;
        if (action === 'ban') successMessage = `O jogador ${trimmed} foi banido do servidor.`;
        if (action === 'pardon') successMessage = `O jogador ${trimmed} foi desbanido.`;
        if (action === 'kick') successMessage = `O jogador ${trimmed} foi expulso do servidor.`;

        setCommandLoading(`${action}:${trimmed}`);
        clearFlashes('minecraft');
        instance.send('send command', command);

        addFlash({ key: 'minecraft', type: 'success', message: successMessage });
        window.setTimeout(() => {
            setCommandLoading('');
            refreshPlayers();
            loadLists();
        }, 900);

        if (action === 'whitelist-add' || action === 'whitelist-remove') {
            window.setTimeout(loadLists, 2000);
        }
    };

    const loadLists = () => {
        setLoadingLists(true);

        Promise.all([
            getFileContents(uuid, 'whitelist.json').catch(() => '[]'),
            getFileContents(uuid, 'ops.json').catch(() => '[]'),
            getFileContents(uuid, 'banned-players.json').catch(() => '[]'),
        ])
            .then(([whitelistContent, operatorsContent, bansContent]) => {
                setWhitelist(parseMinecraftJsonList(whitelistContent));
                setOperators(parseMinecraftJsonList(operatorsContent));
                setBans(parseMinecraftJsonList(bansContent));
            })
            .catch((error) => {
                addFlash({ key: 'minecraft', type: 'error', message: httpErrorToHuman(error) });
            })
            .then(() => setLoadingLists(false));
    };

    const loadProperties = () => {
        setLoadingProperties(true);

        getFileContents(uuid, 'server.properties')
            .then((content) => {
                const parsed = parseMinecraftProperties(content);
                const values: Record<string, string> = {
                    'enable-query': 'true',
                    'query.port': server.allocations.find((allocation) => allocation.isDefault)?.port?.toString() || '',
                    ...parsed.values,
                };

                setParsedProperties(parsed);
                setPropertyValues(values);
                setAdvancedProperties(
                    Object.keys(values)
                        .filter((key) => !PROPERTY_KEYS.includes(key))
                        .sort((a, b) => a.localeCompare(b))
                        .map((key) => `${key}=${values[key]}`)
                        .join('\n')
                );
            })
            .catch((error) => {
                addFlash({ key: 'minecraft', type: 'error', message: httpErrorToHuman(error) });
            })
            .then(() => setLoadingProperties(false));
    };

    const saveProperties = () => {
        if (!parsedProperties) {
            return;
        }

        const nextValues = { ...parsedProperties.values };

        PROPERTY_FIELDS.forEach((field) => {
            const value = propertyValues[field.key];

            if (typeof value === 'string' && (value.length > 0 || Object.prototype.hasOwnProperty.call(nextValues, field.key))) {
                nextValues[field.key] = value;
            }
        });

        advancedProperties
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0 && !line.startsWith('#') && line.includes('='))
            .forEach((line) => {
                const separator = line.indexOf('=');
                nextValues[line.slice(0, separator).trim()] = line.slice(separator + 1);
            });

        setSavingProperties(true);
        clearFlashes('minecraft');

        saveFileContents(uuid, 'server.properties', serializeMinecraftProperties(parsedProperties, nextValues, PROPERTY_KEYS))
            .then(() => {
                addFlash({
                    key: 'minecraft',
                    type: 'success',
                    message: 'server.properties salvo. Reinicie o servidor para aplicar opções que exigem restart.',
                });
                loadProperties();
            })
            .catch((error) => {
                addFlash({ key: 'minecraft', type: 'error', message: httpErrorToHuman(error) });
            })
            .then(() => setSavingProperties(false));
    };

    useEffect(() => {
        clearFlashes('minecraft');
        loadLists();
        loadProperties();
    }, [uuid]);

    useEffect(() => {
        if (tab === 'players') {
            refreshPlayers();
        }
    }, [tab, uuid, serverStatus]);

    if (!isMinecraft) {
        return <NotFound />;
    }

    const renderPlayerActions = (player: string) => (
        <div className="flex flex-wrap gap-2">
            <button 
                disabled={!canRunPlayerAction('whitelist-add')} 
                onClick={() => sendPlayerCommand('whitelist-add', player)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-xs font-medium flex items-center gap-2 disabled:opacity-50"
            >
                Whitelist
            </button>
            <button 
                disabled={!canRunPlayerAction('op')} 
                onClick={() => sendPlayerCommand('op', player)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-xs font-medium flex items-center gap-2 disabled:opacity-50"
            >
                OP
            </button>
            <button 
                disabled={!canRunPlayerAction('kick')} 
                onClick={() => sendPlayerCommand('kick', player)}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-medium flex items-center gap-2 disabled:opacity-50"
            >
                Kick
            </button>
            <button 
                disabled={!canRunPlayerAction('ban')} 
                onClick={() => sendPlayerCommand('ban', player)}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-medium flex items-center gap-2 disabled:opacity-50"
            >
                Ban
            </button>
        </div>
    );

    return (
        <ServerContentBlock title={'Minecraft'} className="!max-w-[1600px] mx-auto">
            {/* Ambient Glows */}
            <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-green-500/10 blur-[150px] pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none z-0" />

            <div className="relative z-10 flex-1 w-full flex flex-col gap-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-4">
                            <div className="p-3 bg-green-500 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                                <Pickaxe size={32} className="text-white" />
                            </div>
                            Minecraft
                        </h1>
                        <p className="text-sm sm:text-base text-zinc-500 mt-3 max-w-2xl">
                            Gerencie players, listas de permissões e configurações técnicas do seu servidor Java com ferramentas otimizadas.
                        </p>
                    </div>

                    <div className="p-1 bg-zinc-950/50 rounded-xl border border-zinc-800/50 flex items-center self-start lg:self-center">
                        {[
                            ['players', 'Players', <Users size={16} key="players" />],
                            ['lists', 'Listas', <ListChecks size={16} key="lists" />],
                            ['properties', 'Properties', <FileCog size={16} key="properties" />],
                            ['versions', 'Versões', <ServerCog size={16} key="versions" />],
                        ].map(([key, label, icon]) => (
                            <button
                                key={key as string}
                                type="button"
                                onClick={() => setTab(key as Tab)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                                    tab === key 
                                        ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/50' 
                                        : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                {icon}
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <FlashMessageRender byKey={'minecraft'} />

                {tab === 'players' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 flex flex-col gap-6">
                            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col">
                                <div className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-6">
                                    <div className="p-2 rounded-lg bg-zinc-800/50 text-green-500">
                                        <Users size={18} />
                                    </div>
                                    Players Online
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 border-blue-400/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                            Query Status
                                        </span>
                                        <p className="text-xs text-zinc-400 italic">
                                            {playerStatus}
                                        </p>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={refreshPlayers}
                                        className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                        disabled={refreshingPlayers}
                                    >
                                        <RefreshCw size={16} className={`${refreshingPlayers ? 'animate-spin' : ''}`} /> 
                                        Atualizar
                                    </button>
                                </div>

                                {onlinePlayers.length === 0 ? (
                                    <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
                                        <Users size={48} className="text-zinc-700" />
                                        <p className="text-sm text-zinc-500">Nenhum jogador online no momento.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {onlinePlayers.map((player) => (
                                            <div key={player} className="flex items-center justify-between gap-4 bg-[#050505] border border-zinc-800/60 rounded-xl px-5 py-4 hover:border-zinc-700 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-400 font-mono text-xs">
                                                        {player.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-mono text-sm font-medium text-white tracking-wide">{player}</span>
                                                </div>
                                                {renderPlayerActions(player)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-1 flex flex-col gap-6">
                            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col">
                                <div className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-6">
                                    <div className="p-2 rounded-lg bg-zinc-800/50 text-blue-400">
                                        <Shield size={18} />
                                    </div>
                                    Comando Rápido
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Nick do Jogador</label>
                                        <div className="relative">
                                            <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                            <input
                                                type="text"
                                                className="w-full bg-[#050505] border border-zinc-800 text-white text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-zinc-600"
                                                value={commandPlayer}
                                                onChange={(e) => setCommandPlayer(e.currentTarget.value)}
                                                placeholder="Ex: Steve"
                                                disabled={!canConsole && !canCreateFiles}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {[
                                            ['whitelist-add', 'Adicionar WL', <UserCheck size={14} key="wl" />],
                                            ['whitelist-remove', 'Remover WL', <Ban size={14} key="wl-r" />],
                                            ['op', 'Dar OP', <Shield size={14} key="op" />],
                                            ['deop', 'Remover OP', <Shield size={14} key="deop" />],
                                            ['ban', 'Banir Jogador', <Ban size={14} key="ban" />],
                                            ['pardon', 'Desbanir', <UserCheck size={14} key="pardon" />],
                                            ['kick', 'Expulsar (Kick)', <LogOut size={14} key="kick" />],
                                        ].map(([action, label, icon]) => (
                                            <button
                                                key={action as string}
                                                type="button"
                                                disabled={!canRunPlayerAction(action as string) || commandLoading !== ''}
                                                onClick={() => sendPlayerCommand(action as string, commandPlayer)}
                                                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 disabled:opacity-50 ${
                                                    ['ban', 'kick'].includes(action as string)
                                                        ? 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'
                                                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                                                }`}
                                            >
                                                {commandLoading === `${action}:${commandPlayer.trim()}` ? <RefreshCw size={14} className="animate-spin" /> : icon}
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'lists' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {loadingLists ? (
                            <div className="lg:col-span-3 py-20 flex justify-center"><Spinner size="large" /></div>
                        ) : (
                            [
                                ['Whitelist', whitelist, <UserCheck size={18} key="wl" />, 'whitelist-remove', 'text-green-500'],
                                ['Operadores', operators, <Shield size={18} key="op" />, 'deop', 'text-blue-400'],
                                ['Banidos', bans, <Ban size={18} key="ban" />, 'pardon', 'text-red-500'],
                            ].map(([title, entries, icon, action, iconColor]) => (
                                <div key={title as string} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col">
                                    <div className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-6">
                                        <div className={`p-2 rounded-lg bg-zinc-800/50 ${iconColor}`}>
                                            {icon as React.ReactNode}
                                        </div>
                                        {title as string}
                                    </div>

                                    {(entries as MinecraftListEntry[]).length === 0 ? (
                                        <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
                                            <Users size={32} className="text-zinc-700" />
                                            <p className="text-sm text-zinc-500">Nenhum registo encontrado.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {(entries as MinecraftListEntry[]).map((entry) => (
                                                <div key={`${title}-${entry.uuid || entry.name}`} className="bg-[#050505] border border-zinc-800/60 rounded-xl p-4 hover:border-zinc-700 transition-colors group">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <p className="font-mono text-sm font-bold text-white truncate">{entry.name}</p>
                                                            {entry.uuid && <p className="font-mono text-[10px] text-zinc-500 mt-1 truncate tracking-tight">{entry.uuid}</p>}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            disabled={!canCreateFiles}
                                                            onClick={() => updateListFile(action as string, entry.name)}
                                                            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all disabled:opacity-50"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    {entry.reason && (
                                                        <div className="mt-3 pt-3 border-t border-zinc-800/50">
                                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Motivo</p>
                                                            <p className="text-xs text-zinc-400 line-clamp-2 italic">"{entry.reason}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {tab === 'properties' && (
                    <div className="flex-1 w-full max-w-[1600px] mx-auto relative z-10 flex flex-col gap-6">
                        {loadingProperties ? (
                            <div className="py-20 flex justify-center"><Spinner size="large" /></div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                    {/* Coluna Principal: Configurações Técnicas */}
                                    <div className="lg:col-span-3 flex flex-col gap-6">
                                        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col">
                                            <div className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-6">
                                                <div className="p-2 rounded-lg bg-zinc-800/50 text-blue-400">
                                                    <FileCog size={18} />
                                                </div>
                                                Configurações do Servidor (server.properties)
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                {[
                                                    { key: 'motd', label: 'MOTD (Mensagem do Dia)', type: 'text', placeholder: 'A Minecraft Server' },
                                                    { key: 'level-name', label: 'Nome do Mundo', type: 'text', placeholder: 'world' },
                                                    { key: 'max-players', label: 'Máximo de Jogadores', type: 'number', placeholder: '20' },
                                                    { key: 'spawn-protection', label: 'Proteção do Spawn', type: 'number', placeholder: '16' },
                                                    { key: 'view-distance', label: 'Distância de Visão', type: 'number', placeholder: '10' },
                                                    { key: 'simulation-distance', label: 'Distância de Simulação', type: 'number', placeholder: '10' },
                                                ].map((field) => (
                                                    <div key={field.key} className="flex flex-col">
                                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{field.label}</label>
                                                        <div className="relative">
                                                            <input 
                                                                type={field.type === 'number' ? 'number' : 'text'} 
                                                                className="w-full bg-[#050505] border border-zinc-800 text-white text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-zinc-600"
                                                                placeholder={field.placeholder}
                                                                value={propertyValues[field.key] ?? ''}
                                                                readOnly={!canUpdateFiles}
                                                                onChange={(e) =>
                                                                    setPropertyValues((values) => ({ ...values, [field.key]: e.currentTarget.value }))
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col">
                                            <div className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-6">
                                                <div className="p-2 rounded-lg bg-zinc-800/50 text-green-500">
                                                    <Shield size={18} />
                                                </div>
                                                Segurança e Acesso
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {[
                                                    { key: 'online-mode', label: 'Online Mode', description: 'Validar contas originais.' },
                                                    { key: 'white-list', label: 'Whitelist', description: 'Apenas players permitidos.' },
                                                    { key: 'enable-query', label: 'Query Port', description: 'Informações externas.' },
                                                ].map((field) => (
                                                    <div key={field.key} className="bg-[#050505] border border-zinc-800/50 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-all group">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{field.label}</span>
                                                            <Switch
                                                                name={field.key}
                                                                defaultChecked={propertyValues[field.key] === 'true'}
                                                                readOnly={!canUpdateFiles}
                                                                onChange={() =>
                                                                    setPropertyValues((values) => ({
                                                                        ...values,
                                                                        [field.key]: values[field.key] === 'true' ? 'false' : 'true',
                                                                    }))
                                                                }
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest leading-tight">{field.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Coluna Lateral: Gameplay e Ações */}
                                    <div className="lg:col-span-1 flex flex-col gap-6">
                                        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col">
                                            <div className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-6">
                                                <div className="p-2 rounded-lg bg-zinc-800/50 text-amber-500">
                                                    <Pickaxe size={18} />
                                                </div>
                                                Mecânicas
                                            </div>
                                            <div className="space-y-4">
                                                {[
                                                    { key: 'difficulty', label: 'Dificuldade', type: 'select', options: ['peaceful', 'easy', 'normal', 'hard'] },
                                                    { key: 'gamemode', label: 'Modo de Jogo', type: 'select', options: ['survival', 'creative', 'adventure', 'spectator'] },
                                                ].map((field) => (
                                                    <div key={field.key}>
                                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">{field.label}</label>
                                                        <div className="relative">
                                                            <select
                                                                value={propertyValues[field.key] ?? ''}
                                                                disabled={!canUpdateFiles}
                                                                onChange={(e) =>
                                                                    setPropertyValues((values) => ({ ...values, [field.key]: e.currentTarget.value }))
                                                                }
                                                                className="w-full bg-[#050505] border border-zinc-800 text-white text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all appearance-none cursor-pointer"
                                                            >
                                                                {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                                                            </select>
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                                                <ChevronDown size={14} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="pt-2 flex flex-col gap-3">
                                                    {[
                                                        { key: 'pvp', label: 'Habilitar PVP' },
                                                        { key: 'allow-flight', label: 'Permitir Voo' },
                                                        { key: 'allow-nether', label: 'Nether' },
                                                        { key: 'enable-command-block', label: 'CMD Blocks' },
                                                    ].map((field) => (
                                                        <div key={field.key} className="flex items-center justify-between bg-[#050505] border border-zinc-800/50 rounded-xl px-4 py-2.5">
                                                            <span className="text-xs font-medium text-zinc-300">{field.label}</span>
                                                            <Switch
                                                                name={field.key}
                                                                defaultChecked={propertyValues[field.key] === 'true'}
                                                                readOnly={!canUpdateFiles}
                                                                onChange={() =>
                                                                    setPropertyValues((values) => ({
                                                                        ...values,
                                                                        [field.key]: values[field.key] === 'true' ? 'false' : 'true',
                                                                    }))
                                                                }
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-start gap-2 text-amber-500">
                                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">
                                                        Alterações exigem reinício para aplicar.
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={saveProperties}
                                                    disabled={!canUpdateFiles || !parsedProperties || savingProperties}
                                                    className="w-full px-4 py-3 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2"
                                                >
                                                    {savingProperties ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                                    Salvar Alterações
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {tab === 'versions' && <MinecraftVersionsContainer />}
            </div>
        </ServerContentBlock>
    );
};
