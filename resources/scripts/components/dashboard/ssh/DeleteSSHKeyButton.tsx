import tw from 'twin.macro';
import React, { useState } from 'react';
import { useFlashKey } from '@/plugins/useFlash';
import { deleteSSHKey, useSSHKeys } from '@/api/account/ssh-keys';
import { Dialog } from '@/components/elements/dialog';
import Code from '@/components/elements/Code';
import { Trash2, ShieldAlert } from 'lucide-react';

export default ({ name, fingerprint }: { name: string; fingerprint: string }) => {
    const { clearAndAddHttpError } = useFlashKey('account');
    const [visible, setVisible] = useState(false);
    const { mutate } = useSSHKeys();

    const onClick = () => {
        clearAndAddHttpError();

        Promise.all([
            mutate((data) => data?.filter((value) => value.fingerprint !== fingerprint), false),
            deleteSSHKey(fingerprint),
        ]).catch((error) => {
            mutate(undefined, true).catch(console.error);
            clearAndAddHttpError(error);
        });
    };

    return (
        <>
            <Dialog.Confirm
                open={visible}
                title={'Deletar Chave SSH'}
                confirm={'Deletar Chave'}
                onConfirmed={onClick}
                onClose={() => setVisible(false)}
            >
                <div className={'bg-zinc-950/50 border border-zinc-800/50 p-4 rounded-xl flex gap-3 items-start'}>
                    <ShieldAlert size={20} className={'text-red-500 shrink-0 mt-0.5'} />
                    <p className={'text-sm text-zinc-400 leading-relaxed'}>
                        Remover a chave SSH <Code>{name}</Code> invalidará o seu uso em todo o painel imediatamente.
                    </p>
                </div>
            </Dialog.Confirm>
            <button 
                className={'ml-4 p-2 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all'}
                onClick={() => setVisible(true)}
            >
                <Trash2 size={18} />
            </button>
        </>
    );
};
