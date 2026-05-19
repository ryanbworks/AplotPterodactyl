import React, { useEffect, useState } from 'react';
import { useActivityLogs } from '@/api/server/activity';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useFlashKey } from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import ActivityLogEntry from '@/components/elements/activity/ActivityLogEntry';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { ActivityLogFilters } from '@/api/account/activity';
import { Link } from 'react-router-dom';
import { XCircle, Filter, Activity } from 'lucide-react';
import useLocationHash from '@/plugins/useLocationHash';

export default () => {
    const { hash } = useLocationHash();
    const { clearAndAddHttpError } = useFlashKey('server:activity');
    const [filters, setFilters] = useState<ActivityLogFilters>({ page: 1, sorts: { timestamp: -1 } });

    const { data, isValidating, error } = useActivityLogs(filters, {
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        setFilters((value) => ({ ...value, filters: { ip: hash.ip, event: hash.event } }));
    }, [hash]);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    return (
        <ServerContentBlock title={'Activity Log'}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Logs de Atividade</h1>
                    <p className="text-sm sm:text-base text-zinc-500 mt-2">
                        Histórico detalhado de todas as operações realizadas neste servidor.
                    </p>
                </div>

                {(filters.filters?.event || filters.filters?.ip) && (
                    <div className={'flex justify-end'}>
                        <Link
                            to={'#'}
                            className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium flex items-center gap-2"
                            onClick={() => setFilters((value) => ({ ...value, filters: {} }))}
                        >
                            <XCircle size={16} /> Limpar Filtros
                        </Link>
                    </div>
                )}
            </div>

            <FlashMessageRender byKey={'server:activity'} className="mb-6" />

            {!data && isValidating ? (
                <Spinner centered />
            ) : (
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden shadow-xl flex flex-col">
                    <div className="px-6 py-4 border-b border-zinc-800/50 bg-zinc-950/30 flex items-center gap-2">
                        <Activity size={14} className="text-green-500" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            Eventos do Servidor
                        </span>
                    </div>

                    {data?.items.length === 0 ? (
                        <div className="p-12 text-center">
                            <Filter size={32} className="mx-auto text-zinc-700 mb-4" />
                            <p className="text-zinc-400">Nenhum registro de atividade encontrado.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {data?.items.map((activity) => (
                                <ActivityLogEntry key={activity.id} activity={activity}>
                                    <span />
                                </ActivityLogEntry>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {data && (
                <div className="mt-6">
                    <PaginationFooter
                        pagination={data.pagination}
                        onPageSelect={(page) => setFilters((value) => ({ ...value, page }))}
                    />
                </div>
            )}
        </ServerContentBlock>
    );
};

