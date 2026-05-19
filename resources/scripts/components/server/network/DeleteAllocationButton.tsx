import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ServerContext } from '@/state/server';
import deleteServerAllocation from '@/api/server/network/deleteServerAllocation';
import getServerAllocations from '@/api/swr/getServerAllocations';
import { useFlashKey } from '@/plugins/useFlash';
import { Dialog } from '@/components/elements/dialog';

interface Props {
    allocation: number;
}

const DeleteAllocationButton = ({ allocation }: Props) => {
    const [confirm, setConfirm] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    const { mutate } = getServerAllocations();
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');

    const deleteAllocation = () => {
        clearFlashes();

        mutate((data) => data?.filter((a) => a.id !== allocation), false);
        setServerFromState((s) => ({ ...s, allocations: s.allocations.filter((a) => a.id !== allocation) }));

        deleteServerAllocation(uuid, allocation).catch((error) => {
            clearAndAddHttpError(error);
            mutate();
        });
    };

    return (
        <>
            <Dialog.Confirm
                open={confirm}
                onClose={() => setConfirm(false)}
                title={'Remove Allocation'}
                confirm={'Delete'}
                onConfirmed={deleteAllocation}
            >
                This allocation will be immediately removed from your server.
            </Dialog.Confirm>
            <button
                type={'button'}
                onClick={() => setConfirm(true)}
                className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2"
            >
                <Trash2 size={16} />
            </button>
        </>
    );
};

export default DeleteAllocationButton;
