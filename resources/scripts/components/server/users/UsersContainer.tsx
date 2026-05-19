import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import Spinner from '@/components/elements/Spinner';
import AddSubuserButton from '@/components/server/users/AddSubuserButton';
import UserRow from '@/components/server/users/UserRow';
import FlashMessageRender from '@/components/FlashMessageRender';
import getServerSubusers from '@/api/server/users/getServerSubusers';
import { httpErrorToHuman } from '@/api/http';
import Can from '@/components/elements/Can';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import tw from 'twin.macro';
import { Users, UserPlus, Info } from 'lucide-react';

export default () => {
    const [loading, setLoading] = useState(true);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const subusers = ServerContext.useStoreState((state) => state.subusers.data);
    const setSubusers = ServerContext.useStoreActions((actions) => actions.subusers.setSubusers);

    const permissions = useStoreState((state: ApplicationStore) => state.permissions.data);
    const getPermissions = useStoreActions((actions: Actions<ApplicationStore>) => actions.permissions.getPermissions);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    useEffect(() => {
        clearFlashes('users');
        getServerSubusers(uuid)
            .then((subusers) => {
                setSubusers(subusers);
                setLoading(false);
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'users', message: httpErrorToHuman(error) });
            });
    }, []);

    useEffect(() => {
        getPermissions().catch((error) => {
            addError({ key: 'users', message: httpErrorToHuman(error) });
            console.error(error);
        });
    }, []);

    if (!subusers.length && (loading || !Object.keys(permissions).length)) {
        return <Spinner size={'large'} centered />;
    }

    return (
        <ServerContentBlock title={'Gestão de Utilizadores'}>
            <div className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col">
                <div css={tw`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8`}>
                    <div>
                        <h1 css={tw`text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-3`}>
                            <Users size={32} className="text-green-500" />
                            Utilizadores
                        </h1>
                        <p css={tw`text-sm sm:text-base text-zinc-500 mt-2 flex items-center gap-1.5`}>
                            <Info size={16} />
                            Faça a gestão dos utilizadores que têm acesso a este servidor e defina as suas permissões.
                        </p>
                    </div>
                    <Can action={'user.create'}>
                        <div css={tw`flex justify-end`}>
                            <AddSubuserButton />
                        </div>
                    </Can>
                </div>

                <FlashMessageRender byKey={'users'} css={tw`mb-6`} />

                {!subusers.length ? (
                    <div css={tw`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-16 shadow-xl flex flex-col items-center justify-center text-center`}>
                        <div css={tw`w-20 h-20 rounded-full bg-zinc-950 flex items-center justify-center mb-6 border border-zinc-800`}>
                            <Users size={40} className="text-zinc-700" />
                        </div>
                        <h3 css={tw`text-xl font-bold text-white mb-2`}>Nenhum utilizador encontrado</h3>
                        <p css={tw`text-zinc-500 max-w-xs mx-auto mb-8`}>
                            Parece que ainda não adicionou nenhum subutilizador a este servidor.
                        </p>
                        <Can action={'user.create'}>
                            <AddSubuserButton />
                        </Can>
                    </div>
                ) : (
                    <div css={tw`grid grid-cols-1 gap-4`}>
                        {subusers.map((subuser) => <UserRow key={subuser.uuid} subuser={subuser} />)}
                    </div>
                )}
            </div>
        </ServerContentBlock>
    );
};
