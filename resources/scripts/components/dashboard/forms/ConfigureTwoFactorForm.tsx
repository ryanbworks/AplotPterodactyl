import React, { useEffect, useState } from 'react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import SetupTOTPDialog from '@/components/dashboard/forms/SetupTOTPDialog';
import RecoveryTokensDialog from '@/components/dashboard/forms/RecoveryTokensDialog';
import DisableTOTPDialog from '@/components/dashboard/forms/DisableTOTPDialog';
import { useFlashKey } from '@/plugins/useFlash';

export default () => {
    const [tokens, setTokens] = useState<string[]>([]);
    const [visible, setVisible] = useState<'enable' | 'disable' | null>(null);
    const isEnabled = useStoreState((state: ApplicationStore) => state.user.data!.useTotp);
    const { clearAndAddHttpError } = useFlashKey('account:two-step');

    useEffect(() => {
        return () => {
            clearAndAddHttpError();
        };
    }, [visible]);

    const onTokens = (tokens: string[]) => {
        setTokens(tokens);
        setVisible(null);
    };

    return (
        <div>
            <SetupTOTPDialog open={visible === 'enable'} onClose={() => setVisible(null)} onTokens={onTokens} />
            <RecoveryTokensDialog tokens={tokens} open={tokens.length > 0} onClose={() => setTokens([])} />
            <DisableTOTPDialog open={visible === 'disable'} onClose={() => setVisible(null)} />
            <p css={tw`text-sm text-zinc-400`}>
                {isEnabled
                    ? 'A autenticação de dois fatores está atualmente ativada na sua conta.'
                    : 'Você não tem a autenticação de dois fatores ativada na sua conta. Clique no botão abaixo para começar a configurá-la.'}
            </p>
            <div css={tw`mt-6`}>
                {isEnabled ? (
                    <button 
                        className={'px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all text-sm font-bold flex items-center justify-center gap-2'}
                        onClick={() => setVisible('disable')}
                    >
                        Desativar 2FA
                    </button>
                ) : (
                    <button 
                        className={'px-4 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2'}
                        onClick={() => setVisible('enable')}
                    >
                        Ativar 2FA
                    </button>
                )}
            </div>
        </div>
    );
};
