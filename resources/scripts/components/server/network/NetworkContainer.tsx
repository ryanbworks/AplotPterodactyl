import React, { useEffect, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import { useFlashKey } from '@/plugins/useFlash';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { ServerContext } from '@/state/server';
import AllocationRow from '@/components/server/network/AllocationRow';
import createServerAllocation from '@/api/server/network/createServerAllocation';
import { Allocation } from '@/api/server/getServer';
import tw from 'twin.macro';
import Can from '@/components/elements/Can';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import getServerAllocations from '@/api/swr/getServerAllocations';
import isEqual from 'react-fast-compare';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import { Network as NetworkIcon, Plus, Info, Globe } from 'lucide-react';

const NetworkContainer = () => {
    const [loading, setLoading] = useState(false);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const allocationLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.allocations);
    const allocations = ServerContext.useStoreState((state) => state.server.data!.allocations, isEqual);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const { data, error, mutate } = getServerAllocations();

    useEffect(() => {
        mutate(allocations);
    }, []);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    useDeepCompareEffect(() => {
        if (!data) return;

        setServerFromState((state) => ({ ...state, allocations: data as unknown as Allocation[] }));
    }, [data]);

    const onCreateAllocation = () => {
        clearFlashes();

        setLoading(true);
        createServerAllocation(uuid)
            .then((allocation) => {
                setServerFromState((s) => ({ ...s, allocations: s.allocations.concat(allocation) }));
                return mutate(data?.concat(allocation), false);
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    };

    return (
        <ServerContentBlock showFlashKey={'server:network'} title={'Gestão de Rede'}>
            <div className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col">
                {/* Ambient Glows */}
                <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none" />
                <div className="fixed bottom-[-10%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

                <div css={tw`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10`}>
                    <div>
                        <h1 css={tw`text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-3`}>
                            <NetworkIcon size={32} className="text-cyan-400" />
                            Rede
                        </h1>
                        <p css={tw`text-sm sm:text-base text-zinc-500 mt-2 flex items-center gap-1.5`}>
                            <Info size={16} />
                            Gerencie as alocações de rede e portas do seu servidor.
                        </p>
                    </div>

                    <div css={tw`flex flex-col items-end gap-2`}>
                        {data && allocationLimit > data.length && (
                            <Can action={'allocation.create'}>
                                <button
                                    onClick={onCreateAllocation}
                                    className="px-4 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> Criar Alocação
                                </button>
                            </Can>
                        )}
                        {allocationLimit > 0 && data && (
                            <div css={tw`flex items-center gap-2 bg-zinc-950/50 border border-zinc-800/50 rounded-lg px-3 py-1.5 shadow-inner`}>
                                <Globe size={14} className="text-zinc-500" />
                                <p css={tw`text-xs font-bold text-zinc-400 uppercase tracking-widest`}>
                                    <span className="text-cyan-400 font-mono">{data.length}</span> de <span className="font-mono">{allocationLimit}</span> utilizados
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {!data ? (
                    <Spinner size={'large'} centered />
                ) : (
                    <div css={tw`relative z-10`}>
                        <div css={tw`grid grid-cols-1 gap-4`}>
                            {data.map((allocation) => (
                                <AllocationRow key={`${allocation.id}`} allocation={allocation} />
                            ))}
                        </div>
                        
                        {data.length === 0 && (
                            <div css={tw`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-16 shadow-xl flex flex-col items-center justify-center text-center`}>
                                <div css={tw`w-20 h-20 rounded-full bg-zinc-950 flex items-center justify-center mb-6 border border-zinc-800`}>
                                    <NetworkIcon size={40} className="text-zinc-700" />
                                </div>
                                <h3 css={tw`text-xl font-bold text-white mb-2`}>Nenhuma alocação encontrada</h3>
                                <p css={tw`text-zinc-500 max-w-xs mx-auto mb-8`}>
                                    Parece que este servidor ainda não tem alocações de rede configuradas.
                                </p>
                            </div>
                        )}
                        
                        <SpinnerOverlay visible={loading} />
                    </div>
                )}
            </div>
        </ServerContentBlock>
    );
};

export default NetworkContainer;
