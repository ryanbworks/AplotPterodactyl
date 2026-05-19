import React, { useEffect } from 'react';
import { httpErrorToHuman } from '@/api/http';
import { CSSTransition } from 'react-transition-group';
import Spinner from '@/components/elements/Spinner';
import FileObjectRow from '@/components/server/files/FileObjectRow';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import { FileObject } from '@/api/server/files/loadDirectory';
import NewDirectoryButton from '@/components/server/files/NewDirectoryButton';
import { NavLink, useLocation } from 'react-router-dom';
import Can from '@/components/elements/Can';
import { ServerError } from '@/components/elements/ScreenBlock';
import tw from 'twin.macro';
import { ServerContext } from '@/state/server';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import FileManagerStatus from '@/components/server/files/FileManagerStatus';
import MassActionsBar from '@/components/server/files/MassActionsBar';
import UploadButton from '@/components/server/files/UploadButton';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useStoreActions } from '@/state/hooks';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FileActionCheckbox } from '@/components/server/files/SelectFileCheckbox';
import { hashToPath } from '@/helpers';
import { Files, FilePlus, FolderX, AlertTriangle } from 'lucide-react';

const sortFiles = (files: FileObject[]): FileObject[] => {
    const sortedFiles: FileObject[] = files
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));
    return sortedFiles.filter((file, index) => index === 0 || file.name !== sortedFiles[index - 1].name);
};

export default () => {
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const { hash } = useLocation();
    const { data: files, error, mutate } = useFileManagerSwr();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const clearFlashes = useStoreActions((actions) => actions.flashes.clearFlashes);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);

    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const selectedFilesLength = ServerContext.useStoreState((state) => state.files.selectedFiles.length);

    useEffect(() => {
        clearFlashes('files');
        setSelectedFiles([]);
        setDirectory(hashToPath(hash));
    }, [hash]);

    useEffect(() => {
        mutate();
    }, [directory]);

    const onSelectAllClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(e.currentTarget.checked ? files?.map((file) => file.name) || [] : []);
    };

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} onRetry={() => mutate()} />;
    }

    return (
        <ServerContentBlock title={'File Manager'} showFlashKey={'files'} className="!max-w-[1600px] mx-auto">
            <div className="flex-1 w-full flex flex-col gap-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-2">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
                                <Files size={32} className="text-blue-400" /> Files
                            </h1>
                            <div className="mt-2">
                                <FileManagerBreadcrumbs />
                            </div>
                        </div>

                        <Can action={'file.create'}>
                            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                                <FileManagerStatus />
                                <NewDirectoryButton />
                                <UploadButton />
                                <NavLink to={`/server/${id}/files/new${window.location.hash}`}>
                                    <button className="px-4 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2">
                                        <FilePlus size={16} /> New File
                                    </button>
                                </NavLink>
                            </div>
                        </Can>
                    </div>

                    {!files ? (
                        <Spinner size={'large'} centered />
                    ) : (
                        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-xl">
                            {/* Header Grid */}
                            <div className="bg-zinc-950/50 px-6 py-3 border-b border-zinc-800/50 rounded-t-2xl">
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-11 sm:col-span-9 md:col-span-6 flex items-center gap-4">
                                        <div className="flex-shrink-0 w-8 flex justify-center">
                                            <FileActionCheckbox
                                                type={'checkbox'}
                                                checked={selectedFilesLength === (files?.length === 0 ? -1 : files?.length)}
                                                onChange={onSelectAllClick}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-6">Name</span>
                                    </div>
                                    <div className="hidden sm:block sm:col-span-2 lg:col-span-2 text-right">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Size</span>
                                    </div>
                                    <div className="hidden md:block md:col-span-3 lg:col-span-3 text-right">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Modified</span>
                                    </div>
                                    <div className="col-span-1" /> {/* Dropdown Spacer */}
                                </div>
                            </div>

                            {!files.length ? (
                                <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
                                    <FolderX size={48} className="text-zinc-700" />
                                    <p className="text-sm text-zinc-500">This directory seems to be empty.</p>
                                </div>
                            ) : (
                                <CSSTransition classNames={'fade'} timeout={150} appear in>
                                    <div className="divide-y divide-zinc-800/40">
                                        {files.length > 250 && (
                                            <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 flex items-center gap-3">
                                                <AlertTriangle size={18} className="text-amber-500" />
                                                <p className="text-amber-500 text-xs font-medium">
                                                    This directory is too large to display in the browser, limiting output to the first 250 files.
                                                </p>
                                            </div>
                                        )}
                                        {sortFiles(files.slice(0, 250)).map((file) => (
                                            <FileObjectRow key={file.key} file={file} />
                                        ))}
                                    </div>
                                </CSSTransition>
                            )}
                        </div>
                    )}
                    <MassActionsBar />
                </div>
        </ServerContentBlock>
    );
};
