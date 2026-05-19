import React from 'react';
import { ServerContext } from '@/state/server';
import { Field as FormikField, Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import { Actions, useStoreActions } from 'easy-peasy';
import renameServer from '@/api/server/renameServer';
import Field from '@/components/elements/Field';
import { object, string } from 'yup';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import tw from 'twin.macro';
import Label from '@/components/elements/Label';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import { Textarea } from '@/components/elements/Input';
import { Edit3, Save } from 'lucide-react';

interface Values {
    name: string;
    description: string;
}

const RenameServerBox = () => {
    const { isSubmitting } = useFormikContext<Values>();

    return (
        <div css={tw`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl relative`}>
            <SpinnerOverlay visible={isSubmitting} />
            <div css={tw`flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-wider mb-6 pb-4 border-b border-zinc-800/50`}>
                <Edit3 size={18} className="text-green-500" />
                Alterar Detalhes do Servidor
            </div>
            <Form css={tw`mb-0`}>
                <div css={tw`space-y-6`}>
                    <Field 
                        id={'name'} 
                        name={'name'} 
                        label={'Nome do Servidor'} 
                        type={'text'} 
                        placeholder="Introduza o nome do servidor..."
                    />
                    <div>
                        <Label>Descrição do Servidor</Label>
                        <FormikFieldWrapper name={'description'}>
                            <FormikField 
                                as={Textarea} 
                                name={'description'} 
                                rows={3} 
                                placeholder="Uma breve descrição sobre o que este servidor faz..."
                            />
                        </FormikFieldWrapper>
                    </div>
                </div>
                <div css={tw`mt-8 pt-4 border-t border-zinc-800/50 flex justify-end`}>
                    <button
                        type={'submit'}
                        className="px-5 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2"
                    >
                        <Save size={18} /> Guardar Alterações
                    </button>
                </div>
            </Form>
        </div>
    );
};

export default () => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const setServer = ServerContext.useStoreActions((actions) => actions.server.setServer);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const submit = ({ name, description }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('settings');
        renameServer(server.uuid, name, description)
            .then(() => setServer({ ...server, name, description }))
            .catch((error) => {
                console.error(error);
                addError({ key: 'settings', message: httpErrorToHuman(error) });
            })
            .then(() => setSubmitting(false));
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                name: server.name,
                description: server.description,
            }}
            validationSchema={object().shape({
                name: string().required('O nome do servidor é obrigatório.').min(1),
                description: string().nullable(),
            })}
        >
            <RenameServerBox />
        </Formik>
    );
};
