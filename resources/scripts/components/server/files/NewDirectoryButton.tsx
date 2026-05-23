import React, { useContext, useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { Form, Formik, FormikHelpers, Field as FormikField, FieldProps } from 'formik';
import { join } from 'pathe';
import { object, string } from 'yup';
import createDirectory from '@/api/server/files/createDirectory';
import { FileObject } from '@/api/server/files/loadDirectory';
import { useFlashKey } from '@/plugins/useFlash';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { WithClassname } from '@/components/types';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import asDialog from '@/hoc/asDialog';
import { FolderPlus, Folder, ChevronRight } from 'lucide-react';

interface Values {
    directoryName: string;
}

const schema = object().shape({
    directoryName: string().required('A valid directory name must be provided.'),
});

const generateDirectoryData = (name: string): FileObject => ({
    key: `dir_${name.split('/', 1)[0] ?? name}`,
    name: name.replace(/^(\/*)/, '').split('/', 1)[0] ?? name,
    mode: 'drwxr-xr-x',
    modeBits: '0755',
    size: 0,
    isFile: false,
    isSymlink: false,
    mimetype: '',
    createdAt: new Date(),
    modifiedAt: new Date(),
    isArchiveType: () => false,
    isEditable: () => false,
});

const NewDirectoryDialog = asDialog({
    title: 'Create Directory',
})(() => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const { mutate } = useFileManagerSwr();
    const { close } = useContext(DialogWrapperContext);
    const { clearAndAddHttpError } = useFlashKey('files:directory-modal');

    useEffect(() => {
        return () => {
            clearAndAddHttpError();
        };
    }, []);

    const submit = ({ directoryName }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        createDirectory(uuid, directory, directoryName)
            .then(() => mutate((data) => [...data, generateDirectoryData(directoryName)], false))
            .then(() => close())
            .catch((error) => {
                setSubmitting(false);
                clearAndAddHttpError(error);
            });
    };

    return (
        <Formik onSubmit={submit} validationSchema={schema} initialValues={{ directoryName: '' }}>
            {({ submitForm, values }) => (
                <>
                    <FlashMessageRender key={'files:directory-modal'} />
                    <Form className="m-0">
                        <FormikField name="directoryName">
                            {({ field, form: { errors, touched } }: FieldProps) => (
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                                        Directory Name
                                    </label>
                                    <div className="relative group">
                                        <Folder size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                                        <input
                                            {...field}
                                            autoFocus
                                            className="w-full bg-[#050505] border border-zinc-800 text-white text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600 shadow-inner"
                                            placeholder="Ex: resources, uploads..."
                                        />
                                    </div>
                                    {touched[field.name] && errors[field.name] && (
                                        <p className="text-xs text-red-400 mt-1 ml-1">{errors[field.name] as string}</p>
                                    )}
                                </div>
                            )}
                        </FormikField>
                        
                        <div className="mt-6 p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <ChevronRight size={12} /> Target Path
                            </div>
                            <code className="text-xs font-mono tracking-wider break-all text-zinc-400 flex flex-wrap gap-1 items-center">
                                <span className="opacity-50">/home/container/</span>
                                <span className="text-zinc-200">{directory.replace(/^\/+/, '') || ''}</span>
                                {values.directoryName && (
                                    <>
                                        <span className="text-zinc-600">/</span>
                                        <span className="text-blue-400 font-bold underline decoration-blue-500/30 underline-offset-4">
                                            {values.directoryName}
                                        </span>
                                    </>
                                )}
                            </code>
                        </div>
                    </Form>
                    <Dialog.Footer>
                        <button 
                            type="button"
                            className="px-6 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium"
                            onClick={close}
                        >
                            Cancel
                        </button>
                        <button 
                            type="button"
                            className="px-6 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all text-sm font-bold flex items-center justify-center gap-2"
                            onClick={submitForm}
                        >
                            Create Directory
                        </button>
                    </Dialog.Footer>
                </>
            )}
        </Formik>
    );
});

export default ({ className }: WithClassname) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <NewDirectoryDialog open={open} onClose={setOpen.bind(this, false)} />
            <button 
                onClick={setOpen.bind(this, true)} 
                className={`px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium flex items-center gap-2 ${className}`}
            >
                <FolderPlus size={16} /> Create Directory
            </button>
        </>
    );
};
