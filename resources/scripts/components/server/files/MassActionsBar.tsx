import React, { useEffect, useState } from 'react';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';
import compressFiles from '@/api/server/files/compressFiles';
import { ServerContext } from '@/state/server';
import deleteFiles from '@/api/server/files/deleteFiles';
import RenameFileModal from '@/components/server/files/RenameFileModal';
import Portal from '@/components/elements/Portal';
import { Dialog } from '@/components/elements/dialog';
import Fade from '@/components/elements/Fade';
import { Move, Archive, Trash2, CheckCircle2 } from 'lucide-react';

const MassActionsBar = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const { mutate } = useFileManagerSwr();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [showMove, setShowMove] = useState(false);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const selectedFiles = ServerContext.useStoreState((state) => state.files.selectedFiles);
    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);

    useEffect(() => {
        if (!loading) setLoadingMessage('');
    }, [loading]);

    const onClickCompress = () => {
        setLoading(true);
        clearFlashes('files');
        setLoadingMessage('Archiving files...');

        compressFiles(uuid, directory, selectedFiles)
            .then(() => mutate())
            .then(() => setSelectedFiles([]))
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setLoading(false));
    };

    const onClickConfirmDeletion = () => {
        setLoading(true);
        setShowConfirm(false);
        clearFlashes('files');
        setLoadingMessage('Deleting files...');

        deleteFiles(uuid, directory, selectedFiles)
            .then(() => {
                mutate((files) => files.filter((f) => selectedFiles.indexOf(f.name) < 0), false);
                setSelectedFiles([]);
            })
            .catch((error) => {
                mutate();
                clearAndAddHttpError({ key: 'files', error });
            })
            .then(() => setLoading(false));
    };

    return (
        <>
            <div className={'pointer-events-none fixed bottom-0 z-20 left-0 right-0 flex justify-center'}>
                <SpinnerOverlay visible={loading} size={'large'} fixed>
                    {loadingMessage}
                </SpinnerOverlay>
                <Dialog.Confirm
                    title={'Delete Files'}
                    open={showConfirm}
                    confirm={'Delete'}
                    onClose={() => setShowConfirm(false)}
                    onConfirmed={onClickConfirmDeletion}
                >
                    <p className={'mb-2'}>
                        Are you sure you want to delete&nbsp;
                        <span className={'font-semibold text-gray-50'}>{selectedFiles.length} files</span>? This is a
                        permanent action and the files cannot be recovered.
                    </p>
                    {selectedFiles.slice(0, 15).map((file) => (
                        <li key={file}>{file}</li>
                    ))}
                    {selectedFiles.length > 15 && <li>and {selectedFiles.length - 15} others</li>}
                </Dialog.Confirm>
                {showMove && (
                    <RenameFileModal
                        files={selectedFiles}
                        visible
                        appear
                        useMoveTerminology
                        onDismissed={() => setShowMove(false)}
                    />
                )}
                <Portal>
                    <div className={'pointer-events-none fixed bottom-8 flex justify-center w-full z-50'}>
                        <Fade timeout={75} in={selectedFiles.length > 0} unmountOnExit>
                            <div className={'flex items-center gap-6 px-6 py-4 pointer-events-auto rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 shadow-2xl'}>
                                <div className="flex items-center gap-3 pr-6 border-r border-zinc-800">
                                    <div className="bg-green-500/10 p-2 rounded-lg">
                                        <CheckCircle2 size={18} className="text-green-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-sm leading-none">{selectedFiles.length}</span>
                                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Selected</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setShowMove(true)}
                                        className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all text-xs font-bold flex items-center gap-2"
                                    >
                                        <Move size={14} /> Move
                                    </button>
                                    <button 
                                        onClick={onClickCompress}
                                        className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all text-xs font-bold flex items-center gap-2"
                                    >
                                        <Archive size={14} /> Archive
                                    </button>
                                    <button 
                                        onClick={() => setShowConfirm(true)}
                                        className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            </div>
                        </Fade>
                    </div>
                </Portal>
            </div>
        </>
    );
};

export default MassActionsBar;
