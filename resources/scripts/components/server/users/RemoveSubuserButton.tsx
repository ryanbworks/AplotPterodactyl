import React, { useState } from 'react';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import { ServerContext } from '@/state/server';
import { Subuser } from '@/state/server/subusers';
import deleteSubuser from '@/api/server/users/deleteSubuser';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import tw from 'twin.macro';
import { Trash2 } from 'lucide-react';

export default ({ subuser }: { subuser: Subuser }) => {
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const removeSubuser = ServerContext.useStoreActions((actions) => actions.subusers.removeSubuser);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const doDeletion = () => {
        setLoading(true);
        clearFlashes('users');
        deleteSubuser(uuid, subuser.uuid)
            .then(() => {
                setLoading(false);
                removeSubuser(subuser.uuid);
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'users', message: httpErrorToHuman(error) });
                setShowConfirmation(false);
            });
    };

    return (
        <>
            <ConfirmationModal
                title={'Remover este utilizador?'}
                buttonText={'Sim, remover utilizador'}
                visible={showConfirmation}
                showSpinnerOverlay={loading}
                onConfirmed={() => doDeletion()}
                onModalDismissed={() => setShowConfirmation(false)}
            >
                Tem a certeza que deseja remover este subutilizador? Todos os acessos a este servidor serão revogados imediatamente.
            </ConfirmationModal>
            <button
                type={'button'}
                aria-label={'Remover utilizador'}
                css={tw`p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20 transition-all shadow-sm`}
                onClick={() => setShowConfirmation(true)}
            >
                <Trash2 size={18} />
            </button>
        </>
    );
};
