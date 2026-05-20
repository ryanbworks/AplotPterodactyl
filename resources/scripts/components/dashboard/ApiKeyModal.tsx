import React, { useContext } from 'react';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import asModal from '@/hoc/asModal';
import ModalContext from '@/context/ModalContext';
import CopyOnClick from '@/components/elements/CopyOnClick';

interface Props {
    apiKey: string;
}

const ApiKeyModal = ({ apiKey }: Props) => {
    const { dismiss } = useContext(ModalContext);

    return (
        <>
            <h3 className={'text-2xl font-bold text-white mb-6'}>Sua Chave de API</h3>
            <div className={'bg-zinc-950/50 border border-zinc-800/50 p-4 rounded-xl mb-6'}>
                <p className={'text-sm text-zinc-400 leading-relaxed'}>
                    A chave de API solicitada é mostrada abaixo. Por favor, guarde-a em um local seguro; ela <strong className={'text-white font-semibold'}>não será exibida novamente</strong>.
                </p>
            </div>
            <div className={'bg-[#050505] border border-zinc-800 rounded-xl p-4 font-mono group'}>
                <CopyOnClick text={apiKey}>
                    <code className={'text-sm text-blue-400 break-all cursor-pointer'}>{apiKey}</code>
                </CopyOnClick>
            </div>
            <div className={'flex justify-end mt-6'}>
                <button
                    type={'button'}
                    onClick={() => dismiss()}
                    className={'px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium'}
                >
                    Fechar
                </button>
            </div>
        </>
    );
};

ApiKeyModal.displayName = 'ApiKeyModal';

export default asModal<Props>({
    closeOnEscape: false,
    closeOnBackground: false,
})(ApiKeyModal);
