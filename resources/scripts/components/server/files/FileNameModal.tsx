import React, { useContext } from 'react';
import { Form, Formik, FormikHelpers, Field as FormikField, FieldProps } from 'formik';
import { object, string } from 'yup';
import { ServerContext } from '@/state/server';
import { join } from 'pathe';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import asDialog from '@/hoc/asDialog';
import { FilePlus, File, ChevronRight } from 'lucide-react';

interface Props {
    onFileNamed: (name: string) => void;
}

interface Values {
    fileName: string;
}

const FileNameDialog = asDialog({
    title: (
        <div className="flex items-center gap-3">
            <FilePlus size={20} className="text-blue-400" />
            <span>Name Your File</span>
        </div>
    ),
})<{ onFileNamed: (name: string) => void }>(({ onFileNamed }) => {
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { close } = useContext(DialogWrapperContext);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        onFileNamed(join(directory, values.fileName));
        setSubmitting(false);
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{ fileName: '' }}
            validationSchema={object().shape({
                fileName: string().required('A file name is required.').min(1),
            })}
        >
            {({ submitForm, values }) => (
                <>
                    <Form className="m-0">
                        <FormikField name="fileName">
                            {({ field, form: { errors, touched } }: FieldProps) => (
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                                        File Name
                                    </label>
                                    <div className="relative group">
                                        <File size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                                        <input
                                            {...field}
                                            autoFocus
                                            className="w-full bg-[#050505] border border-zinc-800 text-white text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600 shadow-inner"
                                            placeholder="Ex: server.properties, index.js..."
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
                                <ChevronRight size={12} /> Full Path
                            </div>
                            <code className="text-xs font-mono tracking-wider break-all text-zinc-400 flex flex-wrap gap-1 items-center">
                                <span className="opacity-50">/home/container/</span>
                                <span className="text-zinc-200">{directory.replace(/^\/+/, '') || ''}</span>
                                {values.fileName && (
                                    <>
                                        <span className="text-zinc-600">/</span>
                                        <span className="text-blue-400 font-bold underline decoration-blue-500/30 underline-offset-4">
                                            {values.fileName}
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
                            className="px-6 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all text-sm font-bold flex items-center justify-center gap-2"
                            onClick={submitForm}
                        >
                            Create File
                        </button>
                    </Dialog.Footer>
                </>
            )}
        </Formik>
    );
});

export default ({ visible, onDismissed, onFileNamed }: { visible: boolean; onDismissed: () => void; onFileNamed: (name: string) => void }) => (
    <FileNameDialog open={visible} onClose={onDismissed} onFileNamed={onFileNamed} />
);
