import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Spinner from '@/components/elements/Spinner';
import { bytesToString } from '@/lib/formatters';
import Can from '@/components/elements/Can';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import BackupContextMenu from '@/components/server/backups/BackupContextMenu';
import tw from 'twin.macro';
import getServerBackups from '@/api/swr/getServerBackups';
import { ServerBackup } from '@/api/server/types';
import { SocketEvent } from '@/components/server/events';
import { HardDrive, Lock, ShieldAlert, CheckCircle2, Clock, FileCode } from 'lucide-react';

interface Props {
    backup: ServerBackup;
    className?: string;
}

export default ({ backup, className }: Props) => {
    const { mutate } = getServerBackups();

    useWebsocketEvent(`${SocketEvent.BACKUP_COMPLETED}:${backup.uuid}` as SocketEvent, (data) => {
        try {
            const parsed = JSON.parse(data);

            mutate(
                (data) => ({
                    ...data,
                    items: data.items.map((b) =>
                        b.uuid !== backup.uuid
                            ? b
                            : {
                                  ...b,
                                  isSuccessful: parsed.is_successful || true,
                                  checksum: (parsed.checksum_type || '') + ':' + (parsed.checksum || ''),
                                  bytes: parsed.file_size || 0,
                                  completedAt: new Date(),
                              }
                    ),
                }),
                false
            );
        } catch (e) {
            console.warn(e);
        }
    });

    return (
        <div 
            className={className}
            css={tw`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 shadow-lg flex flex-wrap md:flex-nowrap items-center transition-all duration-300 hover:border-zinc-700/50 hover:bg-zinc-900/60 hover:-translate-y-1`}
        >
            <div css={tw`flex items-center truncate w-full md:flex-1`}>
                <div css={tw`mr-4 w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner`}>
                    {backup.completedAt !== null ? (
                        backup.isLocked ? (
                            <Lock size={20} className="text-amber-500" />
                        ) : (
                            <HardDrive size={20} className="text-zinc-400" />
                        )
                    ) : (
                        <Spinner size={'small'} />
                    )}
                </div>
                <div css={tw`flex flex-col truncate`}>
                    <div css={tw`flex items-center gap-2 mb-1`}>
                        {backup.completedAt !== null && !backup.isSuccessful && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 border-red-500/20">
                                <ShieldAlert size={10} /> Falhou
                            </span>
                        )}
                        {backup.completedAt !== null && backup.isSuccessful && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 border-green-500/20">
                                <CheckCircle2 size={10} /> Sucesso
                            </span>
                        )}
                        <p css={tw`text-sm font-bold text-white truncate tracking-wide`}>{backup.name}</p>
                        {backup.completedAt !== null && backup.isSuccessful && (
                            <span css={tw`text-xs font-mono text-zinc-500 ml-1`}>
                                {bytesToString(backup.bytes)}
                            </span>
                        )}
                    </div>
                    <div css={tw`flex items-center gap-1.5 text-zinc-500`}>
                        <FileCode size={12} />
                        <p css={tw`text-[10px] font-mono truncate tracking-wider`}>{backup.checksum || 'A aguardar checksum...'}</p>
                    </div>
                </div>
            </div>
            
            <div css={tw`flex-1 md:flex-none md:w-48 mt-4 md:mt-0 md:ml-8 md:text-center flex flex-col items-center md:items-center`}>
                <div css={tw`flex items-center gap-1.5 text-zinc-200`}>
                    <Clock size={14} className="text-zinc-500" />
                    <p title={format(backup.createdAt, 'dd/MM/yyyy HH:mm:ss')} css={tw`text-sm font-medium`}>
                        {formatDistanceToNow(backup.createdAt, { includeSeconds: true, addSuffix: true, locale: ptBR })}
                    </p>
                </div>
                <p css={tw`text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1`}>Criado</p>
            </div>

            <Can action={['backup.download', 'backup.restore', 'backup.delete']} matchAny>
                <div css={tw`mt-4 md:mt-0 ml-6 flex justify-end`}>
                    {!backup.completedAt ? (
                        <div css={tw`p-2 opacity-0`}>
                            <HardDrive size={18} />
                        </div>
                    ) : (
                        <BackupContextMenu backup={backup} />
                    )}
                </div>
            </Can>
        </div>
    );
};
