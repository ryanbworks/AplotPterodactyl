import React, { useEffect, useState } from 'react';
import CreateApiKeyForm from '@/components/dashboard/forms/CreateApiKeyForm';
import getApiKeys, { ApiKey } from '@/api/account/getApiKeys';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import deleteApiKey from '@/api/account/deleteApiKey';
import FlashMessageRender from '@/components/FlashMessageRender';
import { format } from 'date-fns';
import PageContentBlock from '@/components/elements/PageContentBlock';
import tw from 'twin.macro';
import { Dialog } from '@/components/elements/dialog';
import { useFlashKey } from '@/plugins/useFlash';
import Code from '@/components/elements/Code';
import { Key, Trash2, ShieldAlert, Plus } from 'lucide-react';

export default () => {
    const [deleteIdentifier, setDeleteIdentifier] = useState('');
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const { clearAndAddHttpError } = useFlashKey('account');

    useEffect(() => {
        getApiKeys()
            .then((keys) => setKeys(keys))
            .then(() => setLoading(false))
            .catch((error) => clearAndAddHttpError(error));
    }, []);

    const doDeletion = (identifier: string) => {
        setLoading(true);

        clearAndAddHttpError();
        deleteApiKey(identifier)
            .then(() => setKeys((s) => [...(s || []).filter((key) => key.identifier !== identifier)]))
            .catch((error) => clearAndAddHttpError(error))
            .then(() => {
                setLoading(false);
                setDeleteIdentifier('');
            });
    };

    return (
        <PageContentBlock title={'Conta - API'}>
            <div className={'flex-1 w-full max-w-[1600px] mx-auto relative z-10 flex flex-col'}>
                <div className={'mb-10'}>
                    <h1 className={'text-3xl sm:text-4xl font-bold text-white'}>Credenciais de API</h1>
                    <p className={'text-sm sm:text-base text-zinc-500 mt-2'}>
                        Crie e gerencie chaves de API para interagir com o painel programaticamente.
                    </p>
                </div>

                <FlashMessageRender byKey={'account'} css={tw`mb-6`} />

                <div className={'grid grid-cols-1 lg:grid-cols-4 gap-6'}>
                    <div className={'lg:col-span-3 flex flex-col gap-6'}>
                        <div className={'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl relative min-h-[400px]'}>
                            <SpinnerOverlay visible={loading} />
                            
                            <div className={'text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-6'}>
                                <div className={'p-2 rounded-lg bg-zinc-800/50 text-blue-400'}>
                                    <Key size={18} />
                                </div>
                                Suas Chaves de API
                            </div>

                            <Dialog.Confirm
                                title={'Deletar Chave de API'}
                                confirm={'Deletar Chave'}
                                open={!!deleteIdentifier}
                                onClose={() => setDeleteIdentifier('')}
                                onConfirmed={() => doDeletion(deleteIdentifier)}
                            >
                                <div className={'bg-zinc-950/50 border border-zinc-800/50 p-4 rounded-xl flex gap-3 items-start'}>
                                    <ShieldAlert size={20} className={'text-red-500 shrink-0 mt-0.5'} />
                                    <p className={'text-sm text-zinc-400 leading-relaxed'}>
                                        Todas as requisições usando a chave <Code>{deleteIdentifier}</Code> serão invalidadas imediatamente.
                                    </p>
                                </div>
                            </Dialog.Confirm>

                            {keys.length === 0 ? (
                                <div className={'flex flex-col items-center justify-center p-12 text-center'}>
                                    <Key size={32} className={'text-zinc-700 mb-4'} />
                                    <p className={'text-zinc-500 text-sm'}>
                                        {loading ? 'Carregando chaves...' : 'Nenhuma chave de API encontrada.'}
                                    </p>
                                </div>
                            ) : (
                                <div className={'flex flex-col gap-3'}>
                                    {keys.map((key) => (
                                        <div
                                            key={key.identifier}
                                            className={'bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-4 flex items-center transition-all hover:bg-zinc-800/20 group'}
                                        >
                                            <div className={'p-2.5 rounded-lg bg-zinc-900 text-zinc-400 group-hover:text-blue-400 transition-colors'}>
                                                <Key size={16} />
                                            </div>
                                            <div className={'ml-4 flex-1 overflow-hidden'}>
                                                <p className={'text-sm font-medium text-zinc-200 break-words'}>{key.description}</p>
                                                <div className={'flex items-center gap-4 mt-1'}>
                                                    <p className={'text-[10px] text-zinc-500 uppercase font-bold tracking-widest'}>
                                                        Identificador: <span className={'font-mono text-zinc-400'}>{key.identifier}</span>
                                                    </p>
                                                    <p className={'text-[10px] text-zinc-500 uppercase font-bold tracking-widest'}>
                                                        Último uso: <span className={'text-zinc-400 tracking-normal font-medium'}>
                                                            {key.lastUsedAt ? format(key.lastUsedAt, 'MMM do, yyyy HH:mm') : 'Nunca'}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                className={'ml-4 p-2 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all'} 
                                                onClick={() => setDeleteIdentifier(key.identifier)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
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
                                Criar Nova Chave
                            </div>
                            <CreateApiKeyForm onKeyCreated={(key) => setKeys((s) => [...s!, key])} />
                        </div>
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};
