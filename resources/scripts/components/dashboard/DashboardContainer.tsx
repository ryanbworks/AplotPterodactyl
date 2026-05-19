import React, { useEffect, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerRow from '@/components/dashboard/ServerRow';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import Switch from '@/components/elements/Switch';
import tw from 'twin.macro';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components/macro';

const DashboardShell = styled.div`
    ${tw`relative`};

    &:before {
        content: '';
        ${tw`fixed top-0 left-0 w-2/5 h-2/5 rounded-full pointer-events-none`};
        background: rgba(34, 197, 94, 0.08);
        filter: blur(150px);
    }

    &:after {
        content: '';
        ${tw`fixed bottom-0 right-0 w-1/3 h-1/3 rounded-full pointer-events-none`};
        background: rgba(34, 197, 94, 0.04);
        filter: blur(120px);
    }
`;

const GlassPanel = styled.div`
    ${tw`relative z-10 border shadow-xl`};
    background: rgba(12, 12, 14, 0.82);
    border-color: rgba(39, 39, 42, 0.7);
    border-radius: 1rem;
    backdrop-filter: blur(24px);
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
`;

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

    useEffect(() => {
        setPage(1);
    }, [showOnlyAdmin]);

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'} css={tw`max-w-[1600px]`}>
            <DashboardShell>
                <div css={tw`relative z-10 flex flex-col gap-6`}>
                    <div css={tw`flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4`}>
                        <div>
                            <p css={tw`text-xs font-bold text-green-500 uppercase tracking-widest`}>AplotCloud</p>
                            <h1 css={tw`text-3xl sm:text-4xl font-bold text-white mt-2`}>Seus servidores</h1>
                            <p css={tw`text-sm sm:text-base text-neutral-500 mt-2`}>
                                Gerencie sua infraestrutura em tempo real com status, recursos e acesso rapido.
                            </p>
                        </div>
                        {rootAdmin && (
                            <GlassPanel css={tw`px-4 py-3 flex items-center justify-between gap-4`}>
                                <div>
                                    <p css={tw`text-2xs font-bold uppercase tracking-widest text-neutral-500`}>
                                        Visao
                                    </p>
                                    <p css={tw`text-sm font-semibold text-neutral-200`}>
                                        {showOnlyAdmin ? 'Todos os servidores' : 'Meus servidores'}
                                    </p>
                                </div>
                                <Switch
                                    name={'show_all_servers'}
                                    defaultChecked={showOnlyAdmin}
                                    onChange={() => setShowOnlyAdmin((s) => !s)}
                                />
                            </GlassPanel>
                        )}
                    </div>

                    <GlassPanel css={tw`p-4 sm:p-6`}>
                        <div css={tw`flex items-center justify-between gap-4 mb-5`}>
                            <div>
                                <p css={tw`text-sm font-semibold text-white uppercase tracking-wider`}>
                                    Lista de servidores
                                </p>
                                <p css={tw`text-xs text-neutral-500 mt-1`}>Status, endereco e consumo de recursos.</p>
                            </div>
                        </div>

                        {!servers ? (
                            <div css={tw`py-12`}>
                                <Spinner centered size={'large'} />
                            </div>
                        ) : (
                            <Pagination data={servers} onPageSelect={setPage}>
                                {({ items }) =>
                                    items.length > 0 ? (
                                        <div css={tw`grid grid-cols-1 gap-4`}>
                                            {items.map((server) => (
                                                <ServerRow key={server.uuid} server={server} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div
                                            css={tw`p-12 text-center border border-neutral-800 rounded-xl`}
                                            style={{ background: '#050505' }}
                                        >
                                            <p css={tw`text-sm text-neutral-400`}>
                                                {showOnlyAdmin
                                                    ? 'Nenhum outro servidor encontrado.'
                                                    : 'Nenhum servidor associado a sua conta.'}
                                            </p>
                                        </div>
                                    )
                                }
                            </Pagination>
                        )}
                    </GlassPanel>
                </div>
            </DashboardShell>
        </PageContentBlock>
    );
};
