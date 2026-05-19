import React, { useEffect, useState } from 'react';
import getFileContents from '@/api/server/files/getFileContents';
import { httpErrorToHuman } from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import saveFileContents from '@/api/server/files/saveFileContents';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import { useHistory, useLocation, useParams } from 'react-router';
import FileNameModal from '@/components/server/files/FileNameModal';
import Can from '@/components/elements/Can';
import FlashMessageRender from '@/components/FlashMessageRender';
import { ServerError } from '@/components/elements/ScreenBlock';
import modes from '@/modes';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { encodePathSegments, hashToPath } from '@/helpers';
import { dirname } from 'pathe';
import CodemirrorEditor from '@/components/elements/CodemirrorEditor';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { FileEdit, Save, FilePlus, Info, ChevronDown, Code } from 'lucide-react';

export default () => {
    const [error, setError] = useState('');
    const { action } = useParams<{ action: 'new' | string }>();
    const [loading, setLoading] = useState(action === 'edit');
    const [content, setContent] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [mode, setMode] = useState('text/plain');

    const history = useHistory();
    const { hash } = useLocation();

    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);
    const { addError, clearFlashes } = useFlash();

    let fetchFileContent: null | (() => Promise<string>) = null;

    useEffect(() => {
        if (action === 'new') return;

        setError('');
        setLoading(true);
        const path = hashToPath(hash);
        setDirectory(dirname(path));
        getFileContents(uuid, path)
            .then(setContent)
            .catch((error) => {
                console.error(error);
                setError(httpErrorToHuman(error));
            })
            .then(() => setLoading(false));
    }, [action, uuid, hash]);

    const save = (name?: string) => {
        if (!fetchFileContent) {
            return;
        }

        setLoading(true);
        clearFlashes('files:view');
        fetchFileContent()
            .then((content) => saveFileContents(uuid, name || hashToPath(hash), content))
            .then(() => {
                if (name) {
                    history.push(`/server/${id}/files/edit#/${encodePathSegments(name)}`);
                    return;
                }

                return Promise.resolve();
            })
            .catch((error) => {
                console.error(error);
                addError({ message: httpErrorToHuman(error), key: 'files:view' });
            })
            .then(() => setLoading(false));
    };

    if (error) {
        return <ServerError message={error} onBack={() => history.goBack()} />;
    }

    return (
        <ServerContentBlock title={action === 'edit' ? 'Edit File' : 'New File'} showFlashKey={'files:view'} className="!max-w-[1600px] mx-auto">
            <div className="flex-1 w-full flex flex-col gap-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
                            {action === 'edit' ? <FileEdit size={32} className="text-blue-400" /> : <FilePlus size={32} className="text-blue-400" />}
                            {action === 'edit' ? 'Edit File' : 'Create New File'}
                        </h1>
                        <div className="mt-2">
                            <FileManagerBreadcrumbs withinFileEditor isNewFile={action !== 'edit'} />
                        </div>
                    </div>
                </div>

                    {hash.replace(/^#/, '').endsWith('.pteroignore') && (
                        <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex gap-4 items-start shadow-xl backdrop-blur-xl">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                                <Info size={18} />
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                You&apos;re editing a <code className="font-mono text-blue-400 bg-blue-500/10 rounded px-1.5 py-0.5">.pteroignore</code>{' '}
                                file. Any files or directories listed in here will be excluded from backups. Wildcards are
                                supported by using an asterisk (<code className="font-mono text-white">*</code>).
                                You can negate a prior rule by prepending an exclamation point (
                                <code className="font-mono text-white">!</code>).
                            </p>
                        </div>
                    )}

                    <FileNameModal
                        visible={modalVisible}
                        onDismissed={() => setModalVisible(false)}
                        onFileNamed={(name) => {
                            setModalVisible(false);
                            save(name);
                        }}
                    />

                    <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl overflow-hidden p-1">
                        <SpinnerOverlay visible={loading} />
                        <CodemirrorEditor
                            mode={mode}
                            filename={hash.replace(/^#/, '')}
                            onModeChanged={setMode}
                            initialContent={content}
                            fetchContent={(value) => {
                                fetchFileContent = value;
                            }}
                            onContentSaved={() => {
                                if (action !== 'edit') {
                                    setModalVisible(true);
                                } else {
                                    save();
                                }
                            }}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
                        <div className="relative w-full sm:w-64 group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                                <Code size={16} />
                            </div>
                            <select 
                                value={mode} 
                                onChange={(e) => setMode(e.currentTarget.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                            >
                                {modes.map((mode) => (
                                    <option key={`${mode.name}_${mode.mime}`} value={mode.mime}>
                                        {mode.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                                <ChevronDown size={16} />
                            </div>
                        </div>

                        {action === 'edit' ? (
                            <Can action={'file.update'}>
                                <button 
                                    onClick={() => save()}
                                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <Save size={16} /> Save Content
                                </button>
                            </Can>
                        ) : (
                            <Can action={'file.create'}>
                                <button 
                                    onClick={() => setModalVisible(true)}
                                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <FilePlus size={16} /> Create File
                                </button>
                            </Can>
                        )}
                    </div>
                </div>
        </ServerContentBlock>
    );
};
