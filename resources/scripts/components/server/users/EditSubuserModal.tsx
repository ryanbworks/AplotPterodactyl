import React, { useContext, useEffect, useRef } from 'react';
import { Subuser } from '@/state/server/subusers';
import { Form, Formik } from 'formik';
import { array, object, string } from 'yup';
import Field from '@/components/elements/Field';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import createOrUpdateSubuser from '@/api/server/users/createOrUpdateSubuser';
import { ServerContext } from '@/state/server';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import { usePermissions } from '@/plugins/usePermissions';
import { useDeepCompareMemo } from '@/plugins/useDeepCompareMemo';
import tw from 'twin.macro';
import PermissionTitleBox from '@/components/server/users/PermissionTitleBox';
import asModal from '@/hoc/asModal';
import PermissionRow from '@/components/server/users/PermissionRow';
import ModalContext from '@/context/ModalContext';
import { UserPlus, Save, Mail, ShieldAlert, Info } from 'lucide-react';

type Props = {
    subuser?: Subuser;
};

interface Values {
    email: string;
    permissions: string[];
}

const EditSubuserModal = ({ subuser }: Props) => {
    const ref = useRef<HTMLHeadingElement>(null);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSubuser = ServerContext.useStoreActions((actions) => actions.subusers.appendSubuser);
    const { clearFlashes, clearAndAddHttpError } = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.flashes
    );
    const { dismiss, setPropOverrides } = useContext(ModalContext);

    const isRootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const permissions = useStoreState((state) => state.permissions.data);
    const loggedInPermissions = ServerContext.useStoreState((state) => state.server.permissions);
    const [canEditUser] = usePermissions(subuser ? ['user.update'] : ['user.create']);

    const editablePermissions = useDeepCompareMemo(() => {
        const cleaned = Object.keys(permissions).map((key) =>
            Object.keys(permissions[key].keys).map((pkey) => `${key}.${pkey}`)
        );

        const list: string[] = ([] as string[]).concat.apply([], Object.values(cleaned));

        if (isRootAdmin || (loggedInPermissions.length === 1 && loggedInPermissions[0] === '*')) {
            return list;
        }

        return list.filter((key) => loggedInPermissions.indexOf(key) >= 0);
    }, [isRootAdmin, permissions, loggedInPermissions]);

    const submit = (values: Values) => {
        setPropOverrides({ showSpinnerOverlay: true });
        clearFlashes('user:edit');

        createOrUpdateSubuser(uuid, values, subuser)
            .then((subuser) => {
                appendSubuser(subuser);
                dismiss();
            })
            .catch((error) => {
                console.error(error);
                setPropOverrides(null);
                clearAndAddHttpError({ key: 'user:edit', error });

                if (ref.current) {
                    ref.current.scrollIntoView();
                }
            });
    };

    useEffect(
        () => () => {
            clearFlashes('user:edit');
        },
        []
    );

    return (
        <Formik
            onSubmit={submit}
            initialValues={
                {
                    email: subuser?.email || '',
                    permissions: subuser?.permissions || [],
                } as Values
            }
            validationSchema={object().shape({
                email: string()
                    .max(191, 'O endereço de email não pode exceder 191 caracteres.')
                    .email('Deve ser fornecido um endereço de email válido.')
                    .required('Deve ser fornecido um endereço de email válido.'),
                permissions: array().of(string()),
            })}
        >
            <Form className="relative">
                {/* Ambient Glows */}
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-green-500/10 blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />

                <div css={tw`relative z-10`}>
                    <div css={tw`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8`}>
                        <div>
                            <h1 css={tw`text-2xl sm:text-3xl font-bold text-white tracking-tight`} ref={ref}>
                                {subuser
                                    ? `${canEditUser ? 'Modificar' : 'Visualizar'} permissões para ${subuser.email}`
                                    : 'Criar novo subutilizador'}
                            </h1>
                            <p css={tw`text-sm text-zinc-500 mt-1 flex items-center gap-1.5`}>
                                <Info size={14} />
                                {subuser ? 'Gerencie o acesso deste utilizador ao servidor.' : 'Convide um novo utilizador para gerir este servidor.'}
                            </p>
                        </div>
                        <div css={tw`flex justify-end`}>
                            <button
                                type={'submit'}
                                className="px-5 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2"
                            >
                                {subuser ? <Save size={18} /> : <UserPlus size={18} />}
                                {subuser ? 'Guardar' : 'Convidar'}
                            </button>
                        </div>
                    </div>

                    <FlashMessageRender byKey={'user:edit'} css={tw`mb-6`} />

                    {!isRootAdmin && loggedInPermissions[0] !== '*' && (
                        <div css={tw`mb-8 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex gap-3 items-start`}>
                            <ShieldAlert size={18} className="text-blue-400 mt-0.5" />
                            <p css={tw`text-sm text-zinc-400 leading-relaxed`}>
                                Apenas as permissões que a sua conta tem atualmente atribuídas podem ser selecionadas ao criar ou modificar outros utilizadores.
                            </p>
                        </div>
                    )}

                    {!subuser && (
                        <div css={tw`mb-8 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl`}>
                            <div css={tw`flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-wider mb-4`}>
                                <Mail size={18} className="text-green-500" />
                                Detalhes do Utilizador
                            </div>
                            <Field
                                name={'email'}
                                label={'Endereço de Email'}
                                description={'O endereço de email do utilizador que deseja convidar como subutilizador para este servidor.'}
                            />
                        </div>
                    )}

                    <div css={tw`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8`}>
                        {Object.keys(permissions)
                            .filter((key) => key !== 'websocket')
                            .map((key) => (
                                <PermissionTitleBox
                                    key={`permission_${key}`}
                                    title={key}
                                    isEditable={canEditUser}
                                    permissions={Object.keys(permissions[key].keys).map((pkey) => `${key}.${pkey}`)}
                                >
                                    <p css={tw`text-xs text-zinc-500 mb-4 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50`}>
                                        {permissions[key].description}
                                    </p>
                                    <div css={tw`flex flex-col gap-2`}>
                                        {Object.keys(permissions[key].keys).map((pkey) => (
                                            <PermissionRow
                                                key={`permission_${key}.${pkey}`}
                                                permission={`${key}.${pkey}`}
                                                disabled={!canEditUser || editablePermissions.indexOf(`${key}.${pkey}`) < 0}
                                            />
                                        ))}
                                    </div>
                                </PermissionTitleBox>
                            ))}
                    </div>

                    <Can action={subuser ? 'user.update' : 'user.create'}>
                        <div css={tw`flex justify-end pt-4 border-t border-zinc-800/50`}>
                            <button
                                type={'submit'}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2"
                            >
                                {subuser ? <Save size={18} /> : <UserPlus size={18} />}
                                {subuser ? 'Guardar Alterações' : 'Convidar Utilizador'}
                            </button>
                        </div>
                    </Can>
                </div>
            </Form>
        </Formik>
    );
};

export default asModal<Props>({
    top: false,
})(EditSubuserModal);
