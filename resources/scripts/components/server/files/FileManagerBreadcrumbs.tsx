import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { NavLink, useLocation } from 'react-router-dom';
import { encodePathSegments, hashToPath } from '@/helpers';
import { ChevronRight, Home } from 'lucide-react';

interface Props {
    renderLeft?: JSX.Element;
    withinFileEditor?: boolean;
    isNewFile?: boolean;
}

export default ({ withinFileEditor, isNewFile }: Props) => {
    const [file, setFile] = useState<string | null>(null);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { hash } = useLocation();

    useEffect(() => {
        const path = hashToPath(hash);

        if (withinFileEditor && !isNewFile) {
            const name = path.split('/').pop() || null;
            setFile(name);
        }
    }, [withinFileEditor, isNewFile, hash]);

    const breadcrumbs = (): { name: string; path?: string }[] =>
        directory
            .split('/')
            .filter((directory) => !!directory)
            .map((directory, index, dirs) => {
                if (!withinFileEditor && index === dirs.length - 1) {
                    return { name: directory };
                }

                return { name: directory, path: `/${dirs.slice(0, index + 1).join('/')}` };
            });

    return (
        <div className="flex items-center text-xs font-mono tracking-wider overflow-x-hidden">
            <NavLink 
                to={`/server/${id}/files`} 
                className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors no-underline"
            >
                <Home size={14} />
                <span>/</span>
            </NavLink>
            
            {breadcrumbs().map((crumb, index) => (
                <React.Fragment key={index}>
                    {crumb.path ? (
                        <NavLink
                            to={`/server/${id}/files#${encodePathSegments(crumb.path)}`}
                            className="px-1.5 text-zinc-400 no-underline hover:text-white transition-colors"
                        >
                            {crumb.name}
                        </NavLink>
                    ) : (
                        <span className="px-1.5 text-zinc-200 font-semibold italic">
                            {crumb.name}
                        </span>
                    )}
                    <span className="text-zinc-600">/</span>
                </React.Fragment>
            ))}
            
            {file && (
                <span className="px-1.5 text-blue-400 font-bold">
                    {file}
                </span>
            )}
        </div>
    );
};
