import React, { useContext, useEffect, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import Can from '@/components/elements/Can';
import CreateBackupButton from '@/components/server/backups/CreateBackupButton';
import FlashMessageRender from '@/components/FlashMessageRender';
import BackupRow from '@/components/server/backups/BackupRow';
import tw from 'twin.macro';
import getServerBackups, { Context as ServerBackupContext } from '@/api/swr/getServerBackups';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Pagination from '@/components/elements/Pagination';
import { Archive, Info, Database } from 'lucide-react';

const BackupContainer = () => {
    const { page, setPage } = useContext(ServerBackupContext);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { data: backups, error, isValidating } = getServerBackups();

    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);

    useEffect(() => {
        if (!error) {
            clearFlashes('backups');

            return;
        }

        clearAndAddHttpError({ error, key: 'backups' });
    }, [error]);

    if (!backups || (error && isValidating)) {
        return <Spinner size={'large'} centered />;
    }

    return (
        <ServerContentBlock title={'Gestão de Backups'}>
            <div className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col">
                {/* Ambient Glows */}
                <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-green-500/10 blur-[150px] pointer-events-none" />
                <div className="fixed bottom-[-10%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

                <div css={tw`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8`}>
                    <div>
                        <h1 css={tw`text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-3`}>
                            <Archive size={32} className="text-green-500" />
                            Backups
                        </h1>
                        <p css={tw`text-sm sm:text-base text-zinc-500 mt-2 flex items-center gap-1.5`}>
                            <Info size={16} />
                            Gerencie e restaure as cópias de segurança do seu servidor.
                        </p>
                    </div>
                    <div css={tw`flex flex-col items-end gap-2`}>
                        <Can action={'backup.create'}>
                            {backupLimit > 0 && backupLimit > backups.backupCount && (
                                <CreateBackupButton />
                            )}
                        </Can>
                        {backupLimit > 0 && (
                            <div css={tw`flex items-center gap-2 bg-zinc-950/50 border border-zinc-800/50 rounded-lg px-3 py-1.5 shadow-inner`}>
                                <Database size={14} className="text-zinc-500" />
                                <p css={tw`text-xs font-bold text-zinc-400 uppercase tracking-widest`}>
                                    <span className="text-green-500 font-mono">{backups.backupCount}</span> de <span className="font-mono">{backupLimit}</span> utilizados
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <FlashMessageRender byKey={'backups'} css={tw`mb-6`} />

                <div>
                    <Pagination data={backups} onPageSelect={setPage}>
                        {({ items }) =>
                            !items.length ? (
                                !backupLimit ? (
                                    <div css={tw`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-16 shadow-xl flex flex-col items-center justify-center text-center`}>
                                        <div css={tw`w-20 h-20 rounded-full bg-zinc-950 flex items-center justify-center mb-6 border border-zinc-800`}>
                                            <ShieldAlert size={40} className="text-zinc-700" />
                                        </div>
                                        <h3 css={tw`text-xl font-bold text-white mb-2`}>Backups desativados</h3>
                                        <p css={tw`text-zinc-500 max-w-xs mx-auto`}>
                                            Os backups não podem ser criados para este servidor porque o limite de backups está definido como 0.
                                        </p>
                                    </div>
                                ) : (
                                    <div css={tw`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-16 shadow-xl flex flex-col items-center justify-center text-center`}>
                                        <div css={tw`w-20 h-20 rounded-full bg-zinc-950 flex items-center justify-center mb-6 border border-zinc-800`}>
                                            <Archive size={40} className="text-zinc-700" />
                                        </div>
                                        <h3 css={tw`text-xl font-bold text-white mb-2`}>Nenhum backup encontrado</h3>
                                        <p css={tw`text-zinc-500 max-w-xs mx-auto mb-8`}>
                                            {page > 1
                                                ? "Parece que não há mais backups nesta página, tente voltar."
                                                : "Ainda não foram criadas cópias de segurança para este servidor."}
                                        </p>
                                        <Can action={'backup.create'}>
                                            {backupLimit > 0 && backupLimit > backups.backupCount && <CreateBackupButton />}
                                        </Can>
                                    </div>
                                )
                            ) : (
                                <div css={tw`grid grid-cols-1 gap-4`}>
                                    {items.map((backup) => (
                                        <BackupRow key={backup.uuid} backup={backup} />
                                    ))}
                                </div>
                            )
                        }
                    </Pagination>
                </div>
                
                {backupLimit === 0 && backups.backupCount === 0 && (
                     <div css={tw`mt-8 p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50 text-center`}>
                        <p css={tw`text-sm text-zinc-500`}>
                            O limite de backups para este servidor é zero. Contacte a administração se precisar de aumentar este limite.
                        </p>
                    </div>
                )}
            </div>
        </ServerContentBlock>
    );
};

export default () => {
    const [page, setPage] = useState<number>(1);
    return (
        <ServerBackupContext.Provider value={{ page, setPage }}>
            <BackupContainer />
        </ServerBackupContext.Provider>
    );
};
