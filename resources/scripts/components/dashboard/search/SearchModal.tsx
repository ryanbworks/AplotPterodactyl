import React, { useEffect, useRef, useState } from 'react';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import { Field, Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { object, string } from 'yup';
import debounce from 'debounce';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import InputSpinner from '@/components/elements/InputSpinner';
import getServers from '@/api/getServers';
import { Server } from '@/api/server/getServer';
import { ApplicationStore } from '@/state';
import { Link } from 'react-router-dom';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Input from '@/components/elements/Input';
import { ip } from '@/lib/formatters';
import { Server as ServerIcon, MapPin, Globe } from 'lucide-react';

type Props = RequiredModalProps;

interface Values {
    term: string;
}

const ServerResult = styled(Link)`
    ${tw`flex items-center p-4 rounded-xl border border-zinc-800/50 no-underline transition-all duration-300`};
    background: rgba(9, 9, 11, 0.5);

    &:hover {
        ${tw`bg-zinc-800/40 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.05)] -translate-y-0.5`};
    }

    &:not(:last-of-type) {
        ${tw`mb-3`};
    }
`;

const SearchWatcher = () => {
    const { values, submitForm } = useFormikContext<Values>();

    useEffect(() => {
        if (values.term.length >= 3) {
            submitForm();
        }
    }, [values.term]);

    return null;
};

export default ({ ...props }: Props) => {
    const ref = useRef<HTMLInputElement>(null);
    const isAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [servers, setServers] = useState<Server[]>([]);
    const { clearAndAddHttpError, clearFlashes } = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.flashes
    );

    const search = debounce(({ term }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('search');

        getServers({ query: term, type: isAdmin ? 'admin-all' : undefined })
            .then((servers) => setServers(servers.items.filter((_, index) => index < 5)))
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'search', error });
            })
            .then(() => setSubmitting(false))
            .then(() => ref.current?.focus());
    }, 500);

    useEffect(() => {
        if (props.visible) {
            if (ref.current) ref.current.focus();
        }
    }, [props.visible]);

    // Formik does not support an innerRef on custom components.
    const InputWithRef = (props: any) => <Input autoFocus {...props} ref={ref} />;

    return (
        <Formik
            onSubmit={search}
            validationSchema={object().shape({
                term: string().min(3, 'Introduza pelo menos 3 caracteres para pesquisar.'),
            })}
            initialValues={{ term: '' } as Values}
        >
            {({ isSubmitting }) => (
                <Modal {...props} top={true}>
                    <Form>
                        <FormikFieldWrapper
                            name={'term'}
                            label={'Pesquisar Servidores'}
                            description={'Procure por nome, UUID ou endereço IP.'}
                        >
                            <SearchWatcher />
                            <InputSpinner visible={isSubmitting}>
                                <Field as={InputWithRef} name={'term'} placeholder={'Comece a digitar...'} />
                            </InputSpinner>
                        </FormikFieldWrapper>
                    </Form>
                    {servers.length > 0 && (
                        <div className={'mt-8 flex flex-col'}>
                            <p className={'text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4'}>
                                Resultados Encontrados
                            </p>
                            {servers.map((server) => (
                                <ServerResult
                                    key={server.uuid}
                                    to={`/server/${server.id}`}
                                    onClick={() => props.onDismissed()}
                                >
                                    <div className={'mr-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800/50 text-green-500'}>
                                        <ServerIcon size={20} />
                                    </div>
                                    <div className={'flex-1 mr-4'}>
                                        <p className={'text-sm font-bold text-zinc-100'}>{server.name}</p>
                                        <div className={'mt-1.5 flex items-center gap-3 text-xs text-zinc-500 font-mono'}>
                                            {server.allocations
                                                .filter((alloc) => alloc.isDefault)
                                                .map((allocation) => (
                                                    <span key={allocation.ip + allocation.port.toString()} className={'flex items-center gap-1'}>
                                                        <Globe size={12} className={'text-zinc-600'} />
                                                        {allocation.alias || ip(allocation.ip)}:{allocation.port}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                    <div className={'flex-none text-right'}>
                                        <span className={'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-950 border-zinc-800'}>
                                            <MapPin size={10} />
                                            {server.node}
                                        </span>
                                    </div>
                                </ServerResult>
                            ))}
                        </div>
                    )}
                </Modal>
            )}
        </Formik>
    );
};

