import React, { useEffect, useState } from 'react';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import { Field as FormikField, Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import { boolean, object, string } from 'yup';
import Field from '@/components/elements/Field';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import useFlash from '@/plugins/useFlash';
import createServerBackup from '@/api/server/backups/createServerBackup';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';
import { Textarea } from '@/components/elements/Input';
import getServerBackups from '@/api/swr/getServerBackups';
import { ServerContext } from '@/state/server';
import FormikSwitch from '@/components/elements/FormikSwitch';
import Can from '@/components/elements/Can';
import { Plus, Archive, ShieldAlert, FileX } from 'lucide-react';

interface Values {
    name: string;
    ignored: string;
    isLocked: boolean;
}

const ModalContent = ({ ...props }: RequiredModalProps) => {
    const { isSubmitting } = useFormikContext<Values>();

    return (
        <Modal {...props} showSpinnerOverlay={isSubmitting}>
            <Form className="relative">
                {/* Ambient Glows */}
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-green-500/10 blur-[80px] pointer-events-none" />
                
                <div css={tw`relative z-10`}>
                    <FlashMessageRender byKey={'backups:create'} css={tw`mb-4`} />
                    
                    <div css={tw`flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/50`}>
                        <Archive size={24} className="text-green-500" />
                        <h2 css={tw`text-2xl font-bold text-white tracking-tight`}>Criar cópia de segurança</h2>
                    </div>

                    <div css={tw`space-y-6`}>
                        <Field
                            name={'name'}
                            label={'Nome do Backup'}
                            description={'Se fornecido, o nome que deve ser usado para referenciar este backup.'}
                            placeholder="Ex: Backup Semanal"
                        />

                        <FormikFieldWrapper
                            name={'ignored'}
                            label={'Ficheiros e Diretorias Ignorados'}
                            description={`
                                Introduza os ficheiros ou pastas a ignorar durante a geração deste backup. Deixe em branco para usar
                                o conteúdo do ficheiro .pteroignore na raiz do servidor.
                            `}
                        >
                            <div className="relative">
                                <FileX size={16} className="absolute left-3 top-3 text-zinc-500" />
                                <FormikField 
                                    as={Textarea} 
                                    name={'ignored'} 
                                    rows={4} 
                                    className="pl-10!"
                                    placeholder=".git/
node_modules/
*.log"
                                />
                            </div>
                        </FormikFieldWrapper>

                        <Can action={'backup.delete'}>
                            <div css={tw`bg-zinc-950/50 border border-zinc-800/50 p-4 rounded-xl shadow-inner`}>
                                <div css={tw`flex items-center gap-3 mb-1`}>
                                    <ShieldAlert size={16} className="text-amber-500" />
                                    <p css={tw`text-xs font-bold text-zinc-400 uppercase tracking-widest`}>Proteção</p>
                                </div>
                                <FormikSwitch
                                    name={'isLocked'}
                                    label={'Bloqueado'}
                                    description={'Impede que este backup seja apagado até ser explicitamente desbloqueado.'}
                                />
                            </div>
                        </Can>
                    </div>

                    <div css={tw`flex justify-end mt-8 pt-4 border-t border-zinc-800/50`}>
                        <button
                            type={'submit'}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={18} /> Iniciar Backup
                        </button>
                    </div>
                </div>
            </Form>
        </Modal>
    );
};

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [visible, setVisible] = useState(false);
    const { mutate } = getServerBackups();

    useEffect(() => {
        clearFlashes('backups:create');
    }, [visible]);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('backups:create');
        createServerBackup(uuid, values)
            .then((backup) => {
                mutate(
                    (data) => ({ ...data, items: data.items.concat(backup), backupCount: data.backupCount + 1 }),
                    false
                );
                setVisible(false);
            })
            .catch((error) => {
                clearAndAddHttpError({ key: 'backups:create', error });
                setSubmitting(false);
            });
    };

    return (
        <>
            {visible && (
                <Formik
                    onSubmit={submit}
                    initialValues={{ name: '', ignored: '', isLocked: false }}
                    validationSchema={object().shape({
                        name: string().max(191),
                        ignored: string(),
                        isLocked: boolean(),
                    })}
                >
                    <ModalContent appear visible={visible} onDismissed={() => setVisible(false)} />
                </Formik>
            )}
            <button
                onClick={() => setVisible(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2"
            >
                <Plus size={16} /> Criar Backup
            </button>
        </>
    );
};
