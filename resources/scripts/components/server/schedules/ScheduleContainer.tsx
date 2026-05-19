import React, { useEffect, useState } from 'react';
import getServerSchedules from '@/api/server/schedules/getServerSchedules';
import { ServerContext } from '@/state/server';
import Spinner from '@/components/elements/Spinner';
import { useHistory, useRouteMatch } from 'react-router-dom';
import FlashMessageRender from '@/components/FlashMessageRender';
import ScheduleRow from '@/components/server/schedules/ScheduleRow';
import { httpErrorToHuman } from '@/api/http';
import EditScheduleModal from '@/components/server/schedules/EditScheduleModal';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { Calendar, Plus, CalendarX } from 'lucide-react';

export default () => {
    const match = useRouteMatch();
    const history = useHistory();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, addError } = useFlash();
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);

    const schedules = ServerContext.useStoreState((state) => state.schedules.data);
    const setSchedules = ServerContext.useStoreActions((actions) => actions.schedules.setSchedules);

    useEffect(() => {
        clearFlashes('schedules');
        getServerSchedules(uuid)
            .then((schedules) => setSchedules(schedules))
            .catch((error) => {
                addError({ message: httpErrorToHuman(error), key: 'schedules' });
                console.error(error);
            })
            .then(() => setLoading(false));
    }, []);

    return (
        <ServerContentBlock title={'Schedules'} className="!max-w-[1600px] mx-auto">
            <div className="flex-1 w-full flex flex-col gap-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-2">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
                            <Calendar size={32} className="text-blue-400" /> Schedules
                        </h1>
                        <p className="text-sm sm:text-base text-zinc-500 mt-2">
                            Automate server tasks using the powerful scheduler.
                        </p>
                    </div>

                    <Can action={'schedule.create'}>
                        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                            <EditScheduleModal visible={visible} onModalDismissed={() => setVisible(false)} />
                            <button 
                                type={'button'} 
                                onClick={() => setVisible(true)}
                                className="px-4 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Create Schedule
                            </button>
                        </div>
                    </Can>
                </div>

                {!schedules.length && loading ? (
                    <Spinner size={'large'} centered />
                ) : (
                    <div className="flex flex-col gap-4">
                        {schedules.length === 0 ? (
                            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-xl">
                                <CalendarX size={48} className="text-zinc-700" />
                                <p className="text-sm text-zinc-500">There are no schedules configured for this server.</p>
                            </div>
                        ) : (
                            schedules.map((schedule) => (
                                <a
                                    key={schedule.id}
                                    href={`${match.url}/${schedule.id}`}
                                    onClick={(e: any) => {
                                        e.preventDefault();
                                        history.push(`${match.url}/${schedule.id}`);
                                    }}
                                    className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700/50 group no-underline"
                                >
                                    <ScheduleRow schedule={schedule} />
                                </a>
                            ))
                        )}
                    </div>
                )}
            </div>
        </ServerContentBlock>
    );
};
