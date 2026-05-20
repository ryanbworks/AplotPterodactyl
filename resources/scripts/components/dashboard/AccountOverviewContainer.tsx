import * as React from 'react';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import PageContentBlock from '@/components/elements/PageContentBlock';
import tw from 'twin.macro';
import MessageBox from '@/components/MessageBox';
import { useLocation } from 'react-router-dom';
import { Shield, Mail, Lock } from 'lucide-react';

export default () => {
    const { state } = useLocation<undefined | { twoFactorRedirect?: boolean }>();

    return (
        <PageContentBlock title={'Conta - Visão Geral'}>
            <div className={'flex-1 w-full max-w-[1600px] mx-auto relative z-10 flex flex-col'}>
                <div className={'mb-10'}>
                    <h1 className={'text-3xl sm:text-4xl font-bold text-white'}>Configurações da Conta</h1>
                    <p className={'text-sm sm:text-base text-zinc-500 mt-2'}>
                        Gerencie as informações básicas da sua conta, segurança e autenticação.
                    </p>
                </div>

                {state?.twoFactorRedirect && (
                    <MessageBox title={'Autenticação de 2 Fatores Obrigatória'} type={'error'} css={tw`mb-6`}>
                        Você precisa ativar a autenticação de dois fatores para continuar.
                    </MessageBox>
                )}

                <div className={'grid grid-cols-1 lg:grid-cols-3 gap-6'}>
                    <div className={'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col'}>
                        <div className={'text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-6'}>
                            <div className={'p-2 rounded-lg bg-zinc-800/50 text-green-500'}>
                                <Lock size={18} />
                            </div>
                            Atualizar Senha
                        </div>
                        <UpdatePasswordForm />
                    </div>

                    <div className={'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col'}>
                        <div className={'text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-6'}>
                            <div className={'p-2 rounded-lg bg-zinc-800/50 text-blue-400'}>
                                <Mail size={18} />
                            </div>
                            E-mail da Conta
                        </div>
                        <UpdateEmailAddressForm />
                    </div>

                    <div className={'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col'}>
                        <div className={'text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-6'}>
                            <div className={'p-2 rounded-lg bg-zinc-800/50 text-amber-500'}>
                                <Shield size={18} />
                            </div>
                            Autenticação 2FA
                        </div>
                        <ConfigureTwoFactorForm />
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};
