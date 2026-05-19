import { encodePathSegments } from '@/helpers';
import { differenceInHours, format, formatDistanceToNow } from 'date-fns';
import React, { memo } from 'react';
import { FileObject } from '@/api/server/files/loadDirectory';
import FileDropdownMenu from '@/components/server/files/FileDropdownMenu';
import { ServerContext } from '@/state/server';
import { NavLink, useRouteMatch } from 'react-router-dom';
import isEqual from 'react-fast-compare';
import SelectFileCheckbox from '@/components/server/files/SelectFileCheckbox';
import { usePermissions } from '@/plugins/usePermissions';
import { join } from 'pathe';
import { bytesToString } from '@/lib/formatters';
import { Folder, File, FileArchive, Link as LinkIcon } from 'lucide-react';

const Clickable: React.FC<{ file: FileObject }> = memo(({ file, children }) => {
    const [canRead] = usePermissions(['file.read']);
    const [canReadContents] = usePermissions(['file.read-content']);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const match = useRouteMatch();

    return (file.isFile && (!file.isEditable() || !canReadContents)) || (!file.isFile && !canRead) ? (
        <div className="flex flex-1 items-center h-full min-w-0">{children}</div>
    ) : (
        <NavLink
            className="flex flex-1 items-center h-full min-w-0 no-underline group/link"
            to={`${match.url}${file.isFile ? '/edit' : ''}#${encodePathSegments(join(directory, file.name))}`}
        >
            {children}
        </NavLink>
    );
}, isEqual);

const FileObjectRow = ({ file }: { file: FileObject }) => (
    <div
        className="px-6 py-4 hover:bg-zinc-800/20 transition-colors group"
        key={file.name}
        onContextMenu={(e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent(`pterodactyl:files:ctx:${file.key}`, { detail: e.clientX }));
        }}
    >
        <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-11 sm:col-span-9 md:col-span-6 flex items-center gap-4 min-w-0">
                <div className="flex-shrink-0 w-8 flex justify-center relative z-30">
                    <SelectFileCheckbox name={file.name} />
                </div>

                <Clickable file={file}>
                    <div className="flex items-center gap-4 ml-2 min-w-0">
                        <div className="flex-shrink-0 text-blue-400 group-hover/link:text-blue-300 transition-colors">

                            {file.isFile ? (
                                file.isSymlink ? (
                                    <LinkIcon size={18} />
                                ) : file.isArchiveType() ? (
                                    <FileArchive size={18} />
                                ) : (
                                    <File size={18} />
                                )
                            ) : (
                                <Folder size={18} />
                            )}
                        </div>
                        <div className="truncate font-medium text-zinc-200 group-hover/link:text-white transition-colors text-sm">
                            {file.name}
                        </div>
                    </div>
                </Clickable>
            </div>

            <div className="hidden sm:block sm:col-span-2 lg:col-span-2 text-right">
                <span className="font-mono text-[11px] tracking-wider text-zinc-500">
                    {file.isFile ? bytesToString(file.size) : '—'}
                </span>
            </div>

            <div className="hidden md:block md:col-span-3 lg:col-span-3 text-right">
                <span className="font-mono text-[11px] tracking-wider text-zinc-500" title={file.modifiedAt.toString()}>
                    {Math.abs(differenceInHours(file.modifiedAt, new Date())) > 48
                        ? format(file.modifiedAt, 'MMM do, yyyy h:mma')
                        : formatDistanceToNow(file.modifiedAt, { addSuffix: true })}
                </span>
            </div>

            <div className="col-span-1 flex justify-end">
                <FileDropdownMenu file={file} />
            </div>
        </div>
    </div>
);

export default memo(FileObjectRow, (prevProps, nextProps) => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { isArchiveType, isEditable, ...prevFile } = prevProps.file;
    const { isArchiveType: nextIsArchiveType, isEditable: nextIsEditable, ...nextFile } = nextProps.file;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    return isEqual(prevFile, nextFile);
});
