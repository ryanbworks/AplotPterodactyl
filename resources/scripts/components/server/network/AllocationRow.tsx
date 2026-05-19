import React, { memo, useCallback, useState } from 'react';
import isEqual from 'react-fast-compare';
import { Globe, Hash, StickyNote, Star, StarOff } from 'lucide-react';
import InputSpinner from '@/components/elements/InputSpinner';
import { debounce } from 'debounce';
import setServerAllocationNotes from '@/api/server/network/setServerAllocationNotes';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import CopyOnClick from '@/components/elements/CopyOnClick';
import DeleteAllocationButton from '@/components/server/network/DeleteAllocationButton';
import setPrimaryServerAllocation from '@/api/server/network/setPrimaryServerAllocation';
import getServerAllocations from '@/api/swr/getServerAllocations';
import { ip } from '@/lib/formatters';
import { Allocation } from '@/api/server/getServer';
import tw from 'twin.macro';

interface Props {
    allocation: Allocation;
}

const AllocationRow = ({ allocation }: Props) => {
    const [loading, setLoading] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = getServerAllocations();

    const onNotesChanged = useCallback((id: number, notes: string) => {
        mutate((data) => data?.map((a) => (a.id === id ? { ...a, notes } : a)), false);
    }, []);

    const setAllocationNotes = debounce((notes: string) => {
        setLoading(true);
        clearFlashes();

        setServerAllocationNotes(uuid, allocation.id, notes)
            .then(() => onNotesChanged(allocation.id, notes))
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    }, 750);

    const setPrimaryAllocation = () => {
        clearFlashes();
        mutate((data) => data?.map((a) => ({ ...a, isDefault: a.id === allocation.id })), false);

        setPrimaryServerAllocation(uuid, allocation.id).catch((error) => {
            clearAndAddHttpError(error);
            mutate();
        });
    };

    return (
        <div className="group" css={tw`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700/50`}>
            <div css={tw`flex flex-wrap md:flex-nowrap items-center gap-6`}>
                <div css={tw`flex items-center gap-4 flex-1 min-w-[200px]`}>
                    <div css={tw`p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all`}>
                        <Globe size={20} />
                    </div>
                    <div css={tw`flex flex-col`}>
                        <p css={tw`text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1`}>
                            {allocation.alias ? 'Hostname' : 'Endereço IP'}
                        </p>
                        <CopyOnClick text={allocation.alias || ip(allocation.ip)}>
                            <span css={tw`text-sm font-mono tracking-wider text-white font-semibold truncate max-w-[200px] block`}>
                                {allocation.alias || ip(allocation.ip)}
                            </span>
                        </CopyOnClick>
                    </div>
                </div>

                <div css={tw`flex flex-col w-24`}>
                    <p css={tw`text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1`}>Porta</p>
                    <div css={tw`flex items-center gap-2`}>
                        <Hash size={14} className="text-zinc-500" />
                        <span css={tw`text-sm font-mono tracking-wider text-white font-semibold`}>{allocation.port}</span>
                    </div>
                </div>

                <div css={tw`flex-1 min-w-[200px]`}>
                    <p css={tw`text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1`}>Notas</p>
                    <div css={tw`relative`}>
                        <StickyNote size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <InputSpinner visible={loading}>
                            <input
                                type="text"
                                css={tw`w-full bg-[#050505] border border-zinc-800 text-white text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-zinc-600`}
                                placeholder="Adicionar notas..."
                                defaultValue={allocation.notes || undefined}
                                onChange={(e) => setAllocationNotes(e.currentTarget.value)}
                            />
                        </InputSpinner>
                    </div>
                </div>

                <div css={tw`flex items-center gap-3 ml-auto`}>
                    {allocation.isDefault ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                            <Star size={12} fill="currentColor" /> Principal
                        </span>
                    ) : (
                        <div css={tw`flex items-center gap-2`}>
                            <button
                                onClick={setPrimaryAllocation}
                                className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium flex items-center gap-2 shadow-sm"
                            >
                                <StarOff size={16} /> Tornar Principal
                            </button>
                            <DeleteAllocationButton allocation={allocation.id} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(AllocationRow, isEqual);
