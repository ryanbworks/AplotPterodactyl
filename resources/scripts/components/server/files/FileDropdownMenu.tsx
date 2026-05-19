import React, { memo, useRef, useState } from 'react';
import RenameFileModal from '@/components/server/files/RenameFileModal';
import { ServerContext } from '@/state/server';
import { join } from 'pathe';
import deleteFiles from '@/api/server/files/deleteFiles';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import copyFile from '@/api/server/files/copyFile';
import Can from '@/components/elements/Can';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import useFlash from '@/plugins/useFlash';
import { FileObject } from '@/api/server/files/loadDirectory';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import DropdownMenu from '@/components/elements/DropdownMenu';
import useEventListener from '@/plugins/useEventListener';
import compressFiles from '@/api/server/files/compressFiles';
import decompressFiles from '@/api/server/files/decompressFiles';
import isEqual from 'react-fast-compare';
import ChmodFileModal from '@/components/server/files/ChmodFileModal';
import { Dialog } from '@/components/elements/dialog';
import { 
    MoreVertical, 
    Pencil, 
    Move, 
    Shield, 
    Copy, 
    FolderInput, 
    FileArchive, 
    Download, 
    Trash2 
} from 'lucide-react';

type ModalType = 'rename' | 'move' | 'chmod';

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
    icon: any;
    title: string;
    danger?: boolean;
}

const Row = ({ icon: Icon, title, danger, ...props }: RowProps) => (
    <div 
        {...props}
        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all cursor-pointer group ${
            danger 
                ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                : 'text-zinc-400 hover:bg-green-500/10 hover:text-green-500'
        }`}
    >
        <Icon size={14} className="opacity-70 group-hover:opacity-100" />
        <span className="font-medium">{title}</span>
    </div>
);

const FileDropdownMenu = ({ file }: { file: FileObject }) => {
    const onClickRef = useRef<DropdownMenu>(null);
    const [showSpinner, setShowSpinner] = useState(false);
    const [modal, setModal] = useState<ModalType | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = useFileManagerSwr();
    const { clearAndAddHttpError, clearFlashes } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    useEventListener(`pterodactyl:files:ctx:${file.key}`, (e: CustomEvent) => {
        if (onClickRef.current) {
            onClickRef.current.triggerMenu(e.detail);
        }
    });

    const doDeletion = () => {
        clearFlashes('files');
        mutate((files) => files.filter((f) => f.key !== file.key), false);

        deleteFiles(uuid, directory, [file.name]).catch((error) => {
            mutate();
            clearAndAddHttpError({ key: 'files', error });
        });
    };

    const doCopy = () => {
        setShowSpinner(true);
        clearFlashes('files');

        copyFile(uuid, join(directory, file.name))
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doDownload = () => {
        setShowSpinner(true);
        clearFlashes('files');

        getFileDownloadUrl(uuid, join(directory, file.name))
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doArchive = () => {
        setShowSpinner(true);
        clearFlashes('files');

        compressFiles(uuid, directory, [file.name])
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    const doUnarchive = () => {
        setShowSpinner(true);
        clearFlashes('files');

        decompressFiles(uuid, directory, file.name)
            .then(() => mutate())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setShowSpinner(false));
    };

    return (
        <>
            <Dialog.Confirm
                open={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                title={`Delete ${file.isFile ? 'File' : 'Directory'}`}
                confirm={'Delete'}
                onConfirmed={doDeletion}
            >
                You will not be able to recover the contents of&nbsp;
                <span className={'font-semibold text-gray-50'}>{file.name}</span> once deleted.
            </Dialog.Confirm>
            <DropdownMenu
                ref={onClickRef}
                renderToggle={(onClick) => (
                    <div 
                        className="px-4 py-3 text-zinc-500 hover:text-green-500 transition-all cursor-pointer group"
                        onClick={onClick}
                    >
                        <MoreVertical size={18} className="group-hover:scale-110 transition-transform" />
                        {modal ? (
                            modal === 'chmod' ? (
                                <ChmodFileModal
                                    visible
                                    appear
                                    files={[{ file: file.name, mode: file.modeBits }]}
                                    onDismissed={() => setModal(null)}
                                />
                            ) : (
                                <RenameFileModal
                                    visible
                                    appear
                                    files={[file.name]}
                                    useMoveTerminology={modal === 'move'}
                                    onDismissed={() => setModal(null)}
                                />
                            )
                        ) : null}
                        <SpinnerOverlay visible={showSpinner} fixed size={'large'} />
                    </div>
                )}
            >
                <Can action={'file.update'}>
                    <Row onClick={() => setModal('rename')} icon={Pencil} title={'Rename'} />
                    <Row onClick={() => setModal('move')} icon={Move} title={'Move'} />
                    <Row onClick={() => setModal('chmod')} icon={Shield} title={'Permissions'} />
                </Can>
                {file.isFile && (
                    <Can action={'file.create'}>
                        <Row onClick={doCopy} icon={Copy} title={'Copy'} />
                    </Can>
                )}
                {file.isArchiveType() ? (
                    <Can action={'file.create'}>
                        <Row onClick={doUnarchive} icon={FolderInput} title={'Unarchive'} />
                    </Can>
                ) : (
                    <Can action={'file.archive'}>
                        <Row onClick={doArchive} icon={FileArchive} title={'Archive'} />
                    </Can>
                )}
                {file.isFile && <Row onClick={doDownload} icon={Download} title={'Download'} />}
                <Can action={'file.delete'}>
                    <Row onClick={() => setShowConfirmation(true)} icon={Trash2} title={'Delete'} danger />
                </Can>
            </DropdownMenu>
        </>
    );
};

export default memo(FileDropdownMenu, isEqual);
