import React, { useEffect, useState } from 'react';
import Can from '@/components/elements/Can';
import { ServerContext } from '@/state/server';
import { PowerAction } from '@/components/server/console/ServerConsoleContainer';
import { Dialog } from '@/components/elements/dialog';
import { Play, RotateCw, Square, Zap } from 'lucide-react';

interface PowerButtonProps {
    className?: string;
}

export default ({ className }: PowerButtonProps) => {
    const [open, setOpen] = useState(false);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    const killable = status === 'stopping';
    const onButtonClick = (
        action: PowerAction | 'kill-confirmed',
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ): void => {
        e.preventDefault();
        if (action === 'kill') {
            return setOpen(true);
        }

        if (instance) {
            setOpen(false);
            instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
        }
    };

    useEffect(() => {
        if (status === 'offline') {
            setOpen(false);
        }
    }, [status]);

    return (
        <div className={className}>
            <Dialog.Confirm
                open={open}
                hideCloseIcon
                onClose={() => setOpen(false)}
                title={'Forcibly Stop Process'}
                confirm={'Continue'}
                onConfirmed={onButtonClick.bind(this, 'kill-confirmed')}
            >
                Forcibly stopping a server can lead to data corruption.
            </Dialog.Confirm>

            <Can action={'control.start'}>
                <button
                    disabled={status !== 'offline'}
                    onClick={onButtonClick.bind(this, 'start')}
                    className="px-4 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    <Play size={16} /> Start
                </button>
            </Can>

            <Can action={'control.restart'}>
                <button
                    disabled={!status}
                    onClick={onButtonClick.bind(this, 'restart')}
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RotateCw size={16} /> Restart
                </button>
            </Can>

            <Can action={'control.stop'}>
                <button
                    disabled={status === 'offline'}
                    onClick={onButtonClick.bind(this, killable ? 'kill' : 'stop')}
                    className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {killable ? <Zap size={16} /> : <Square size={16} />}
                    {killable ? 'Kill' : 'Stop'}
                </button>
            </Can>
        </div>
    );
};
