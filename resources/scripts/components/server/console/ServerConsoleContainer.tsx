import React, { memo } from 'react';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Features from '@feature/Features';
import Console from '@/components/server/console/Console';
import StatGraphs from '@/components/server/console/StatGraphs';
import PowerButtons from '@/components/server/console/PowerButtons';
import ServerDetailsBlock from '@/components/server/console/ServerDetailsBlock';
import { Alert } from '@/components/elements/alert';
import Spinner from '@/components/elements/Spinner';
import { Terminal as TerminalIcon } from 'lucide-react';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

const ServerConsoleContainer = () => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const description = ServerContext.useStoreState((state) => state.server.data!.description);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);

    return (
        <ServerContentBlock title={'Console'} className="!max-w-[1600px] mx-auto">
            <div className="flex-1 w-full flex flex-col gap-6">
                {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                        <Alert type={'warning'} className={'relative z-10 mb-0 border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl'}>
                            {isNodeUnderMaintenance
                                ? 'The node of this server is currently under maintenance and all actions are unavailable.'
                                : isInstalling
                                ? 'This server is currently running its installation process and most actions are unavailable.'
                                : 'This server is currently being transferred to another node and all actions are unavailable.'}
                        </Alert>
                    )}

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                                    {name}
                                </h1>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${
                                    status === 'running' 
                                        ? 'text-green-500 bg-green-500/10 border-green-500/20' 
                                        : status === 'offline' 
                                            ? 'text-red-500 bg-red-500/10 border-red-500/20'
                                            : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                                }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                        status === 'running' ? 'bg-green-500 animate-pulse' : status === 'offline' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
                                    }`} />
                                    {status || 'Offline'}
                                </span>
                            </div>
                            <p className="text-sm sm:text-base text-zinc-500 mt-2 max-w-2xl line-clamp-2">
                                {description || 'Real-time console, power control and server metrics.'}
                            </p>
                        </div>

                        <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                            <PowerButtons className="flex gap-3 sm:justify-end" />
                        </Can>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 flex flex-col gap-6">
                            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 shadow-xl flex flex-col min-h-[500px]">
                                <div className="flex items-center gap-2 mb-4 text-zinc-400">
                                    <TerminalIcon size={18} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Server Console</span>
                                </div>
                                <div className="flex-1 relative">
                                    <Spinner.Suspense>
                                        <Console />
                                    </Spinner.Suspense>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1 flex flex-col gap-6">
                            <ServerDetailsBlock />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <Spinner.Suspense>
                            <StatGraphs />
                        </Spinner.Suspense>
                    </div>

                    <Features enabled={eggFeatures} />
                </div>
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
