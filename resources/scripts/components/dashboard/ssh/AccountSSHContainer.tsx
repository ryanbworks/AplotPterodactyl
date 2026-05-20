import React, { useEffect } from 'react';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import PageContentBlock from '@/components/elements/PageContentBlock';
import tw from 'twin.macro';
import { useSSHKeys } from '@/api/account/ssh-keys';
import { useFlashKey } from '@/plugins/useFlash';
import { format } from 'date-fns';
import CreateSSHKeyForm from '@/components/dashboard/ssh/CreateSSHKeyForm';
import DeleteSSHKeyButton from '@/components/dashboard/ssh/DeleteSSHKeyButton';
import { Shield, Key, Plus } from 'lucide-react';

export default () => {
    const { clearAndAddHttpError } = useFlashKey('account');
    const { data, isValidating, error } = useSSHKeys({
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    return (
        <PageContentBlock title={'Conta - SSH'}>
            <div className={'flex-1 w-full max-w-[1600px] mx-auto relative z-10 flex flex-col'}>
                <div className={'mb-10'}>
                    <h1 className={'text-3xl sm:text-4xl font-bold text-white'}>Chaves SSH</h1>
                    <p className={'text-sm sm:text-base text-zinc-500 mt-2'}>
                        Adicione chaves SSH para acessar seus servidores de forma segura via terminal.
                    </p>
                </div>

                <FlashMessageRender byKey={'account'} css={tw`mb-6`} />

                <div className={'grid grid-cols-1 lg:grid-cols-4 gap-6'}>
                    <div className={'lg:col-span-3 flex flex-col gap-6'}>
                        <div className={'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl relative min-h-[400px]'}>
                            <SpinnerOverlay visible={!data && isValidating} />
                            
                            <div className={'text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-6'}>
                                <div className={'p-2 rounded-lg bg-zinc-800/50 text-blue-400'}>
                                    <Shield size={18} />
                                </div>
                                Chaves SSH Cadastradas
                            </div>

                            {!data || !data.length ? (
                                <div className={'flex flex-col items-center justify-center p-12 text-center'}>
                                    <Key size={32} className={'text-zinc-700 mb-4'} />
                                    <p className={'text-zinc-500 text-sm'}>
                                        {!data ? 'Carregando chaves...' : 'Nenhuma chave SSH encontrada.'}
                                    </p>
                                </div>
                            ) : (
                                <div className={'flex flex-col gap-3'}>
                                    {data.map((key) => (
                                        <div
                                            key={key.fingerprint}
                                            className={'bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-4 flex items-center transition-all hover:bg-zinc-800/20 group'}
                                        >
                                            <div className={'p-2.5 rounded-lg bg-zinc-900 text-zinc-400 group-hover:text-blue-400 transition-colors'}>
                                                <Key size={16} />
                                            </div>
                                            <div className={'ml-4 flex-1 overflow-hidden'}>
                                                <p className={'text-sm font-medium text-zinc-200 break-words'}>{key.name}</p>
                                                <p className={'text-[10px] font-mono text-zinc-500 mt-1 truncate'}>SHA256:{key.fingerprint}</p>
                                                <p className={'text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1'}>
                                                    Adicionado em: <span className={'text-zinc-400 tracking-normal font-medium'}>
                                                        {format(key.createdAt, 'MMM do, yyyy HH:mm')}
                                                    </span>
                                                </p>
                                            </div>
                                            <DeleteSSHKeyButton name={key.name} fingerprint={key.fingerprint} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={'lg:col-span-1 flex flex-col gap-6'}>
                        <div className={'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col'}>
                            <div className={'text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-6'}>
                                <div className={'p-2 rounded-lg bg-zinc-800/50 text-green-500'}>
                                    <Plus size={18} />
                                </div>
                                Adicionar Chave
                            </div>
                            <CreateSSHKeyForm />
                        </div>
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};
