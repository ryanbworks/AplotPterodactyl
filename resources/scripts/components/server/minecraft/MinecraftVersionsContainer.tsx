import React, { useEffect, useMemo, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import Switch from '@/components/elements/Switch';
import { httpErrorToHuman } from '@/api/http';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import useFlash from '@/plugins/useFlash';
import { Dialog } from '@/components/elements/dialog';
import { useHistory } from 'react-router-dom';
import {
    getMinecraftVersionBuilds,
    getMinecraftVersions,
    getMinecraftVersionTypes,
    getInstalledMinecraftVersion,
    InstalledMinecraftVersion,
    installMinecraftVersion,
    MinecraftVersion,
    MinecraftVersionBuild,
    MinecraftVersionType,
    minecraftBuildDownloadSize,
    minecraftBuildLabel,
    minecraftBuildRequiresArchive,
} from '@/api/server/minecraft';
import {
    AlertCircle,
    Archive,
    CheckCircle2,
    DownloadCloud,
    Layers,
    PackageOpen,
    RefreshCw,
    ServerCog,
    Terminal,
} from 'lucide-react';

const formatBytes = (bytes?: number | null): string => {
    if (!bytes) {
        return 'Tamanho indisponível';
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export default () => {
    const history = useHistory();
    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const serverStatus = ServerContext.useStoreState((state) => state.status.value);
    const [canCreateFiles, canUpdateFiles, canDeleteFiles, canChangeDockerImage] = usePermissions([
        'file.create',
        'file.update',
        'file.delete',
        'startup.docker-image',
    ]);
    const { addFlash, clearFlashes } = useFlash();

    const [types, setTypes] = useState<MinecraftVersionType[]>([]);
    const [versions, setVersions] = useState<MinecraftVersion[]>([]);
    const [builds, setBuilds] = useState<MinecraftVersionBuild[]>([]);
    const [selectedType, setSelectedType] = useState('');
    const [selectedVersion, setSelectedVersion] = useState('');
    const [selectedBuildId, setSelectedBuildId] = useState<number | null>(null);
    const [acceptEula, setAcceptEula] = useState(false);
    const [loadingTypes, setLoadingTypes] = useState(false);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [loadingBuilds, setLoadingBuilds] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    const [installedVersion, setInstalledVersion] = useState<InstalledMinecraftVersion | null>(null);
    const [loadingInstalled, setLoadingInstalled] = useState(false);

    const selectedTypeData = useMemo(() => types.find((type) => type.id === selectedType), [types, selectedType]);
    const selectedVersionData = useMemo(
        () => versions.find((version) => version.id === selectedVersion) || null,
        [versions, selectedVersion]
    );
    const selectedBuild = useMemo(
        () => builds.find((build) => build.id === selectedBuildId) || null,
        [builds, selectedBuildId]
    );
    const canInstall = canCreateFiles && canUpdateFiles && canDeleteFiles && canChangeDockerImage;
    const isOffline = serverStatus === 'offline';

    useEffect(() => {
        setLoadingTypes(true);
        setLoadingInstalled(true);
        clearFlashes('minecraft');

        Promise.all([getMinecraftVersionTypes(uuid), getInstalledMinecraftVersion(uuid)])
            .then(([items, installed]) => {
                setInstalledVersion(installed);
                return items;
            })
            .then((items) => {
                setTypes(items);
                setSelectedType(items.find((item) => item.id === 'PAPER')?.id || items[0]?.id || '');
            })
            .catch((error) => addFlash({ key: 'minecraft', type: 'error', message: httpErrorToHuman(error) }))
            .then(() => {
                setLoadingTypes(false);
                setLoadingInstalled(false);
            });
    }, [uuid]);

    useEffect(() => {
        if (!selectedType) {
            return;
        }

        setLoadingVersions(true);
        setVersions([]);
        setBuilds([]);
        setSelectedVersion('');
        setSelectedBuildId(null);

        getMinecraftVersions(uuid, selectedType)
            .then((items) => {
                setVersions(items);
                setSelectedVersion(items[0]?.id || '');
            })
            .catch((error) => addFlash({ key: 'minecraft', type: 'error', message: httpErrorToHuman(error) }))
            .then(() => setLoadingVersions(false));
    }, [uuid, selectedType]);

    useEffect(() => {
        if (!selectedType || !selectedVersion) {
            return;
        }

        setLoadingBuilds(true);
        setBuilds([]);
        setSelectedBuildId(null);

        getMinecraftVersionBuilds(uuid, selectedType, selectedVersion)
            .then((items) => {
                setBuilds(items);
                setSelectedBuildId(items[0]?.id || null);
            })
            .catch((error) => addFlash({ key: 'minecraft', type: 'error', message: httpErrorToHuman(error) }))
            .then(() => setLoadingBuilds(false));
    }, [uuid, selectedType, selectedVersion]);

    const runInstall = () => {
        if (!selectedType || !selectedVersion || !selectedBuild) {
            return;
        }

        setInstalling(true);
        clearFlashes('minecraft');

        installMinecraftVersion(uuid, {
            type: selectedType,
            version: selectedVersion,
            buildId: selectedBuild.id,
            acceptEula,
        })
            .then((installed) => {
                setInstalledVersion(installed);
                setSuccessVisible(true);
            })
            .catch((error) => addFlash({ key: 'minecraft', type: 'error', message: httpErrorToHuman(error) }))
            .then(() => setInstalling(false));
    };

    if (loadingTypes) {
        return (
            <div className='py-20 flex justify-center'>
                <Spinner size='large' />
            </div>
        );
    }

    return (
        <div className='grid grid-cols-1 xl:grid-cols-4 gap-6'>
            <Dialog open={confirmVisible} onClose={() => setConfirmVisible(false)} title={'Confirmar Instalação'}>
                <div className={'bg-zinc-950/50 border border-zinc-800/50 p-4 rounded-xl flex gap-3 items-start'}>
                    <AlertCircle size={20} className={'text-amber-500 shrink-0 mt-0.5'} />
                    <p className={'text-sm text-zinc-400 leading-relaxed'}>
                        Instalar esta versão vai substituir o jar atual, salvar o jar antigo como .old e trocar a Docker
                        image para o Java recomendado.{' '}
                        <strong className={'text-amber-500 font-semibold'}>
                            Isso não cria backup completo do mundo.
                        </strong>
                    </p>
                </div>
                <Dialog.Footer>
                    <button
                        type={'button'}
                        onClick={() => setConfirmVisible(false)}
                        className={
                            'px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium'
                        }
                    >
                        Cancelar
                    </button>
                    <button
                        type={'button'}
                        onClick={() => {
                            setConfirmVisible(false);
                            runInstall();
                        }}
                        className={
                            'px-4 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2'
                        }
                    >
                        <DownloadCloud size={16} /> Confirmar Instalação
                    </button>
                </Dialog.Footer>
            </Dialog>
            <Dialog open={successVisible} onClose={() => setSuccessVisible(false)} title={'Versão Instalada'}>
                <div className={'bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex gap-3 items-start'}>
                    <CheckCircle2 size={20} className={'text-green-400 shrink-0 mt-0.5'} />
                    <div>
                        <p className={'text-sm text-zinc-200 font-semibold'}>
                            A nova versão foi instalada com sucesso.
                        </p>
                        <p className={'text-sm text-zinc-400 leading-relaxed mt-1'}>
                            A Docker image Java também foi ajustada. Vá ao console para iniciar o servidor e validar a
                            nova build.
                        </p>
                    </div>
                </div>

                {installedVersion && (
                    <div className={'grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4'}>
                        {[
                            ['Tipo', installedVersion.type || 'Desconhecido'],
                            ['Versão', installedVersion.version || 'Desconhecida'],
                            ['Build', installedVersion.build ? String(installedVersion.build) : 'Desconhecida'],
                            ['Java', installedVersion.java ? `Java ${installedVersion.java}` : 'Desconhecido'],
                        ].map(([label, value]) => (
                            <div key={label} className={'bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-3'}>
                                <p className={'text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1'}>
                                    {label}
                                </p>
                                <p className={'text-sm font-bold text-white truncate'}>{value}</p>
                            </div>
                        ))}
                    </div>
                )}

                <Dialog.Footer>
                    <button
                        type={'button'}
                        onClick={() => setSuccessVisible(false)}
                        className={
                            'px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium'
                        }
                    >
                        Ficar aqui
                    </button>
                    <button
                        type={'button'}
                        onClick={() => {
                            setSuccessVisible(false);
                            history.push(`/server/${serverId}`);
                        }}
                        className={
                            'px-4 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2'
                        }
                    >
                        <Terminal size={16} /> Ir para o Console
                    </button>
                </Dialog.Footer>
            </Dialog>
            <div className='xl:col-span-3 flex flex-col gap-6'>
                <div className='bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl'>
                    <div className='text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-6'>
                        <div className='p-2 rounded-lg bg-zinc-800/50 text-blue-400'>
                            <CheckCircle2 size={18} />
                        </div>
                        Versão Instalada
                    </div>

                    {loadingInstalled ? (
                        <div className='flex items-center gap-3 text-sm text-zinc-400'>
                            <RefreshCw size={16} className='animate-spin' />
                            Consultando versão instalada...
                        </div>
                    ) : installedVersion ? (
                        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                            {[
                                ['Tipo', installedVersion.type || 'Desconhecido'],
                                ['Versão', installedVersion.version || 'Desconhecida'],
                                ['Build', installedVersion.build ? String(installedVersion.build) : 'Desconhecida'],
                                ['Java', installedVersion.java ? `Java ${installedVersion.java}` : 'Desconhecido'],
                            ].map(([label, value]) => (
                                <div key={label} className='bg-[#050505] border border-zinc-800/60 rounded-xl p-4'>
                                    <p className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1'>
                                        {label}
                                    </p>
                                    <p className='text-sm font-bold text-white truncate'>{value}</p>
                                </div>
                            ))}
                            <div className='md:col-span-2 bg-[#050505] border border-zinc-800/60 rounded-xl p-4'>
                                <p className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1'>
                                    Docker Image
                                </p>
                                <p className='text-sm font-mono text-zinc-300 truncate'>
                                    {installedVersion.docker_image || 'Desconhecida'}
                                </p>
                            </div>
                            <div className='bg-[#050505] border border-zinc-800/60 rounded-xl p-4'>
                                <p className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1'>
                                    Jar
                                </p>
                                <p className='text-sm font-mono text-zinc-300 truncate'>
                                    {installedVersion.jar || 'server.jar'}
                                </p>
                            </div>
                            <div className='bg-[#050505] border border-zinc-800/60 rounded-xl p-4'>
                                <p className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1'>
                                    Instalado em
                                </p>
                                <p className='text-sm font-bold text-white truncate'>
                                    {installedVersion.installed_at
                                        ? new Date(installedVersion.installed_at).toLocaleString()
                                        : 'Desconhecido'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className='bg-[#050505] border border-zinc-800/60 rounded-xl p-5 flex items-start gap-3'>
                            <AlertCircle size={18} className='text-amber-400 shrink-0 mt-0.5' />
                            <p className='text-sm text-zinc-400 leading-relaxed'>
                                Nenhuma versão instalada pelo gerenciador foi registrada ainda.
                            </p>
                        </div>
                    )}
                </div>

                <div className='bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl'>
                    <div className='text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-6'>
                        <div className='p-2 rounded-lg bg-zinc-800/50 text-green-500'>
                            <ServerCog size={18} />
                        </div>
                        Version Changer
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                        <div>
                            <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block'>
                                Tipo
                            </label>
                            <select
                                value={selectedType}
                                onChange={(event) => setSelectedType(event.currentTarget.value)}
                                className='w-full bg-[#050505] border border-zinc-800 text-white text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all'
                            >
                                {types.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block'>
                                Versão Minecraft
                            </label>
                            <select
                                value={selectedVersion}
                                disabled={loadingVersions || versions.length === 0}
                                onChange={(event) => setSelectedVersion(event.currentTarget.value)}
                                className='w-full bg-[#050505] border border-zinc-800 text-white text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all disabled:opacity-50'
                            >
                                {versions.map((version) => (
                                    <option key={version.id} value={version.id}>
                                        {version.id}
                                        {version.java ? ` - Java ${version.java}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block'>
                                Build
                            </label>
                            <select
                                value={selectedBuildId || ''}
                                disabled={loadingBuilds || builds.length === 0}
                                onChange={(event) => setSelectedBuildId(Number(event.currentTarget.value))}
                                className='w-full bg-[#050505] border border-zinc-800 text-white text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all disabled:opacity-50'
                            >
                                {builds.map((build) => (
                                    <option key={build.id} value={build.id}>
                                        {minecraftBuildLabel(build)}
                                        {build.created ? ` - ${new Date(build.created).toLocaleDateString()}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {(loadingVersions || loadingBuilds) && (
                        <div className='mt-8 flex items-center gap-3 text-sm text-zinc-400'>
                            <RefreshCw size={16} className='animate-spin' />
                            Carregando versões disponíveis...
                        </div>
                    )}
                </div>

                {selectedBuild && (
                    <div className='bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl'>
                        <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6'>
                            <div>
                                <div className='flex flex-wrap items-center gap-2 mb-4'>
                                    <span className='inline-flex items-center gap-2 px-3 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest'>
                                        <PackageOpen size={13} />
                                        {selectedBuild.type}
                                    </span>
                                    <span className='inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest'>
                                        <Layers size={13} />
                                        {minecraftBuildLabel(selectedBuild)}
                                    </span>
                                    {selectedBuild.experimental && (
                                        <span className='inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest'>
                                            Experimental
                                        </span>
                                    )}
                                    {minecraftBuildRequiresArchive(selectedBuild) && (
                                        <span className='inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-widest'>
                                            <Archive size={13} />
                                            Zip
                                        </span>
                                    )}
                                </div>

                                <h2 className='text-2xl font-bold text-white tracking-tight'>
                                    {selectedTypeData?.name || selectedBuild.type} {selectedBuild.version}
                                </h2>
                                <p className='text-sm text-zinc-500 mt-2'>
                                    Download: {formatBytes(minecraftBuildDownloadSize(selectedBuild))}
                                    {selectedVersionData?.java ? ` | Docker Java ${selectedVersionData.java}` : ''}
                                </p>
                            </div>

                            <div className='bg-[#050505] border border-zinc-800/60 rounded-xl p-4 min-w-[260px]'>
                                <div className='flex items-start gap-3 text-amber-400 mb-4'>
                                    <AlertCircle size={16} className='shrink-0 mt-0.5' />
                                    <p className='text-[10px] font-bold uppercase tracking-widest leading-tight'>
                                        O jar atual será salvo como .old e a Docker image será trocada para o Java
                                        recomendado.
                                    </p>
                                </div>

                                <div className='flex items-center justify-between mb-4'>
                                    <span className='text-xs font-medium text-zinc-300'>Aceitar EULA</span>
                                    <Switch
                                        name='accept-eula'
                                        defaultChecked={acceptEula}
                                        onChange={(event) => setAcceptEula(event.currentTarget.checked)}
                                    />
                                </div>

                                <button
                                    type='button'
                                    disabled={!canInstall || !isOffline || installing || !selectedBuild}
                                    onClick={() => setConfirmVisible(true)}
                                    className='w-full px-4 py-3 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50'
                                >
                                    {installing ? (
                                        <RefreshCw size={16} className='animate-spin' />
                                    ) : (
                                        <DownloadCloud size={16} />
                                    )}
                                    Instalar versão
                                </button>

                                {!isOffline && (
                                    <p className='text-[10px] text-red-400 font-bold uppercase tracking-widest leading-tight mt-3'>
                                        Desligue o servidor para instalar.
                                    </p>
                                )}
                                {!canInstall && (
                                    <p className='text-[10px] text-red-400 font-bold uppercase tracking-widest leading-tight mt-3'>
                                        Você precisa de permissões de arquivos e alteração da Docker image.
                                    </p>
                                )}
                            </div>
                        </div>

                        {selectedBuild.changes.length > 0 && (
                            <div className='mt-6 pt-6 border-t border-zinc-800/60'>
                                <div className='text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-4'>
                                    <CheckCircle2 size={16} className='text-green-500' />
                                    Changelog
                                </div>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                    {selectedBuild.changes.slice(0, 8).map((change, index) => (
                                        <div
                                            key={`${selectedBuild.id}-${index}`}
                                            className='bg-[#050505] border border-zinc-800/60 rounded-xl px-4 py-3'
                                        >
                                            <p className='text-xs text-zinc-400 leading-relaxed'>{change}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className='xl:col-span-1 flex flex-col gap-6'>
                <div className='bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl'>
                    <div className='text-sm font-semibold text-white uppercase tracking-wider mb-4'>Fonte</div>
                    <p className='text-xs text-zinc-500 leading-relaxed'>
                        As versões são consultadas no MCJars, revalidadas pelo backend e instalam a Docker image Java
                        recomendada.
                    </p>
                    {selectedTypeData && (
                        <div className='mt-5 space-y-3'>
                            <div className='bg-[#050505] border border-zinc-800/60 rounded-xl p-4'>
                                <p className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1'>
                                    Tipo
                                </p>
                                <p className='text-sm font-bold text-white'>{selectedTypeData.name}</p>
                            </div>
                            <div className='bg-[#050505] border border-zinc-800/60 rounded-xl p-4'>
                                <p className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1'>
                                    Builds
                                </p>
                                <p className='text-sm font-bold text-white'>{selectedTypeData.builds}</p>
                            </div>
                            {selectedVersionData?.java && (
                                <div className='bg-[#050505] border border-zinc-800/60 rounded-xl p-4'>
                                    <p className='text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1'>
                                        Java
                                    </p>
                                    <p className='text-sm font-bold text-white'>Java {selectedVersionData.java}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
