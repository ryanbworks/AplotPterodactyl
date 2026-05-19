import React, { useState } from 'react';
import {
    Download,
    RefreshCcw,
    MoreVertical,
    Lock,
    Unlock,
    Trash2,
} from 'lucide-react';
import DropdownMenu, { DropdownButtonRow } from '@/components/elements/DropdownMenu';
import getBackupDownloadUrl from '@/api/server/backups/getBackupDownloadUrl';
import useFlash from '@/plugins/useFlash';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import deleteBackup from '@/api/server/backups/deleteBackup';
import Can from '@/components/elements/Can';
import tw from 'twin.macro';
import getServerBackups from '@/api/swr/getServerBackups';
import { ServerBackup } from '@/api/server/types';
import { ServerContext } from '@/state/server';
import Input from '@/components/elements/Input';
import { restoreServerBackup } from '@/api/server/backups';
import http, { httpErrorToHuman } from '@/api/http';
import { Dialog } from '@/components/elements/dialog';

interface Props {
    backup: ServerBackup;
}

export default ({ backup }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    const [modal, setModal] = useState('');
    const [loading, setLoading] = useState(false);
    const [truncate, setTruncate] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { mutate } = getServerBackups();

    const doDownload = () => {
        setLoading(true);
        clearFlashes('backups');
        getBackupDownloadUrl(uuid, backup.uuid)
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'backups', error });
            })
            .then(() => setLoading(false));
    };

    const doDeletion = () => {
        setLoading(true);
        clearFlashes('backups');
        deleteBackup(uuid, backup.uuid)
            .then(() =>
                mutate(
                    (data) => ({
                        ...data,
                        items: data.items.filter((b) => b.uuid !== backup.uuid),
                        backupCount: data.backupCount - 1,
                    }),
                    false
                )
            )
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'backups', error });
                setLoading(false);
                setModal('');
            });
    };

    const doRestorationAction = () => {
        setLoading(true);
        clearFlashes('backups');
        restoreServerBackup(uuid, backup.uuid, truncate)
            .then(() =>
                setServerFromState((s) => ({
                    ...s,
                    status: 'restoring_backup',
                }))
            )
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'backups', error });
            })
            .then(() => setLoading(false))
            .then(() => setModal(''));
    };

    const onLockToggle = () => {
        if (backup.isLocked && modal !== 'unlock') {
            return setModal('unlock');
        }

        http.post(`/api/client/servers/${uuid}/backups/${backup.uuid}/lock`)
            .then(() =>
                mutate(
                    (data) => ({
                        ...data,
                        items: data.items.map((b) =>
                            b.uuid !== backup.uuid
                                ? b
                                : {
                                      ...b,
                                      isLocked: !b.isLocked,
                                  }
                        ),
                    }),
                    false
                )
            )
            .catch((error) => alert(httpErrorToHuman(error)))
            .then(() => setModal(''));
    };

    return (
        <>
            <Dialog.Confirm
                open={modal === 'unlock'}
                onClose={() => setModal('')}
                title={`Desbloquear "${backup.name}"`}
                onConfirmed={onLockToggle}
            >
                Este backup deixará de estar protegido contra eliminações automáticas ou acidentais.
            </Dialog.Confirm>
            <Dialog.Confirm
                open={modal === 'restore'}
                onClose={() => setModal('')}
                confirm={'Restaurar'}
                title={`Restaurar "${backup.name}"`}
                onConfirmed={() => doRestorationAction()}
            >
                <p>
                    O seu servidor será interrompido. Não poderá controlar o estado de energia, aceder ao gestor de ficheiros
                    ou criar backups adicionais até que o processo esteja concluído.
                </p>
                <p css={tw`mt-4 -mb-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800`}>
                    <label htmlFor={'restore_truncate'} css={tw`text-sm flex items-center cursor-pointer text-zinc-300`}>
                        <Input
                            type={'checkbox'}
                            css={tw`text-red-500! w-5! h-5! mr-3`}
                            id={'restore_truncate'}
                            value={'true'}
                            checked={truncate}
                            onChange={() => setTruncate((s) => !s)}
                        />
                        Eliminar todos os ficheiros antes de restaurar o backup.
                    </label>
                </p>
            </Dialog.Confirm>
            <Dialog.Confirm
                title={`Eliminar "${backup.name}"`}
                confirm={'Continuar'}
                open={modal === 'delete'}
                onClose={() => setModal('')}
                onConfirmed={doDeletion}
            >
                Esta é uma operação permanente. O backup não pode ser recuperado após ser eliminado.
            </Dialog.Confirm>
            <SpinnerOverlay visible={loading} fixed />
            {backup.isSuccessful ? (
                <DropdownMenu
                    renderToggle={(onClick) => (
                        <button
                            onClick={onClick}
                            css={tw`p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all shadow-sm`}
                        >
                            <MoreVertical size={18} />
                        </button>
                    )}
                >
                    <div css={tw`text-sm p-1`}>
                        <Can action={'backup.download'}>
                            <DropdownButtonRow onClick={doDownload}>
                                <Download size={14} className="mr-2" />
                                <span>Descarregar</span>
                            </DropdownButtonRow>
                        </Can>
                        <Can action={'backup.restore'}>
                            <DropdownButtonRow onClick={() => setModal('restore')}>
                                <RefreshCcw size={14} className="mr-2" />
                                <span>Restaurar</span>
                            </DropdownButtonRow>
                        </Can>
                        <Can action={'backup.delete'}>
                            <>
                                <DropdownButtonRow onClick={onLockToggle}>
                                    {backup.isLocked ? <Unlock size={14} className="mr-2" /> : <Lock size={14} className="mr-2" />}
                                    {backup.isLocked ? 'Desbloquear' : 'Bloquear'}
                                </DropdownButtonRow>
                                {!backup.isLocked && (
                                    <DropdownButtonRow danger onClick={() => setModal('delete')}>
                                        <Trash2 size={14} className="mr-2" />
                                        <span>Eliminar</span>
                                    </DropdownButtonRow>
                                )}
                            </>
                        </Can>
                    </div>
                </DropdownMenu>
            ) : (
                <button
                    onClick={() => setModal('delete')}
                    css={tw`p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20 transition-all shadow-sm`}
                >
                    <Trash2 size={18} />
                </button>
            )}
        </>
    );
};
