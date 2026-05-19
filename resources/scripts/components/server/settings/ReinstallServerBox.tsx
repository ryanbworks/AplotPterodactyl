import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import reinstallServer from '@/api/server/reinstallServer';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import tw from 'twin.macro';
import { Dialog } from '@/components/elements/dialog';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [modalVisible, setModalVisible] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const reinstall = () => {
        clearFlashes('settings');
        reinstallServer(uuid)
            .then(() => {
                addFlash({
                    key: 'settings',
                    type: 'success',
                    message: 'O seu servidor iniciou o processo de reinstalação.',
                });
            })
            .catch((error) => {
                console.error(error);

                addFlash({ key: 'settings', type: 'error', message: httpErrorToHuman(error) });
            })
            .then(() => setModalVisible(false));
    };

    useEffect(() => {
        clearFlashes();
    }, []);

    return (
        <div css={tw`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl relative`}>
            <Dialog.Confirm
                open={modalVisible}
                title={'Confirmar reinstalação do servidor'}
                confirm={'Sim, reinstalar servidor'}
                onClose={() => setModalVisible(false)}
                onConfirmed={reinstall}
            >
                O seu servidor será interrompido e alguns ficheiros poderão ser eliminados ou modificados durante este processo. Tem a certeza que deseja continuar?
            </Dialog.Confirm>

            <div css={tw`flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-wider mb-6 pb-4 border-b border-zinc-800/50`}>
                <RefreshCcw size={18} className="text-red-500" />
                Reinstalar Servidor
            </div>

            <div css={tw`bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex gap-3 items-start mb-6`}>
                <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <p css={tw`text-sm text-zinc-400 leading-relaxed`}>
                    Reinstalar o seu servidor irá interrompê-lo e, em seguida, executar novamente o script de instalação inicial.&nbsp;
                    <strong css={tw`font-semibold text-red-500`}>
                        Alguns ficheiros podem ser apagados ou alterados. Por favor, faça um backup dos seus dados antes de continuar.
                    </strong>
                </p>
            </div>

            <div css={tw`flex justify-end`}>
                <button
                    onClick={() => setModalVisible(true)}
                    className="px-5 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2"
                >
                    <RefreshCcw size={18} /> Reinstalar Servidor
                </button>
            </div>
        </div>
    );
};
