import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import getServerSchedule from '@/api/server/schedules/getServerSchedule';
import Spinner from '@/components/elements/Spinner';
import FlashMessageRender from '@/components/FlashMessageRender';
import EditScheduleModal from '@/components/server/schedules/EditScheduleModal';
import NewTaskButton from '@/components/server/schedules/NewTaskButton';
import DeleteScheduleButton from '@/components/server/schedules/DeleteScheduleButton';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import ScheduleTaskRow from '@/components/server/schedules/ScheduleTaskRow';
import isEqual from 'react-fast-compare';
import { format } from 'date-fns';
import ScheduleCronRow from '@/components/server/schedules/ScheduleCronRow';
import RunScheduleButton from '@/components/server/schedules/RunScheduleButton';
import { Calendar, Settings, Play, Trash2, Clock, ChevronRight, Loader2 } from 'lucide-react';

interface Params {
    id: string;
}

const CronBox = ({ title, value }: { title: string; value: string }) => (
    <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 shadow-inner flex flex-col items-center justify-center">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{title}</p>
        <p className="text-lg font-mono font-bold text-white tracking-wider bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800 shadow-sm">
            {value}
        </p>
    </div>
);

const ActivePill = ({ active }: { active: boolean }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${
        active 
            ? 'text-green-500 bg-green-500/10 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
            : 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20'
    }`}>
        {active ? 'Active' : 'Inactive'}
    </span>
);

export default () => {
    const history = useHistory();
    const { id: scheduleId } = useParams<Params>();

    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [isLoading, setIsLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);

    const schedule = ServerContext.useStoreState(
        (st) => st.schedules.data.find((s) => s.id === Number(scheduleId)),
        isEqual
    );
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);

    useEffect(() => {
        if (schedule?.id === Number(scheduleId)) {
            setIsLoading(false);
            return;
        }

        clearFlashes('schedules');
        getServerSchedule(uuid, Number(scheduleId))
            .then((schedule) => appendSchedule(schedule))
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ error, key: 'schedules' });
            })
            .then(() => setIsLoading(false));
    }, [scheduleId]);

    const toggleEditModal = useCallback(() => {
        setShowEditModal((s) => !s);
    }, []);

    return (
        <ServerContentBlock title={'Schedule Settings'} showFlashKey={'schedules'} className="!max-w-[1600px] mx-auto">
            {!schedule || isLoading ? (
                <Spinner size={'large'} centered />
            ) : (
                <div className="flex flex-1 w-full flex-col gap-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                                    {schedule.name}
                                </h1>
                                {schedule.isProcessing ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                        <Loader2 size={12} className="animate-spin" /> Processing
                                    </span>
                                ) : (
                                    <ActivePill active={schedule.isActive} />
                                )}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-zinc-600" />
                                    <span>Last run: <span className="text-zinc-300 font-mono">{schedule.lastRunAt ? format(schedule.lastRunAt, "MMM do 'at' h:mma") : 'n/a'}</span></span>
                                </div>
                                <div className="hidden sm:block text-zinc-800">|</div>
                                <div className="flex items-center gap-2">
                                    <ChevronRight size={14} className="text-zinc-600" />
                                    <span>Next run: <span className="text-zinc-300 font-mono">{schedule.nextRunAt ? format(schedule.nextRunAt, "MMM do 'at' h:mma") : 'n/a'}</span></span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                            <Can action={'schedule.update'}>
                                <button 
                                    onClick={toggleEditModal}
                                    className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium flex items-center gap-2"
                                >
                                    <Settings size={16} /> Edit Settings
                                </button>
                                <NewTaskButton schedule={schedule} />
                            </Can>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 flex flex-col gap-6">
                            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-xl overflow-hidden">
                                <div className="bg-zinc-950/50 px-6 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={14} /> Scheduled Tasks
                                    </h3>
                                    <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-mono">
                                        {schedule.tasks.length} total
                                    </span>
                                </div>
                                
                                <div className="divide-y divide-zinc-800/40">
                                    {schedule.tasks.length > 0 ? (
                                        schedule.tasks
                                            .sort((a, b) => a.sequenceId - b.sequenceId)
                                            .map((task) => (
                                                <ScheduleTaskRow
                                                    key={`${schedule.id}_${task.id}`}
                                                    task={task}
                                                    schedule={schedule}
                                                />
                                            ))
                                    ) : (
                                        <div className="p-12 text-center text-zinc-500 text-sm italic">
                                            No tasks have been added to this schedule yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1 flex flex-col gap-6">
                            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <Calendar size={14} /> Cron Expression
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <CronBox title={'Minute'} value={schedule.cron.minute} />
                                    <CronBox title={'Hour'} value={schedule.cron.hour} />
                                    <CronBox title={'Day (M)'} value={schedule.cron.dayOfMonth} />
                                    <CronBox title={'Month'} value={schedule.cron.month} />
                                    <div className="col-span-2">
                                        <CronBox title={'Day (W)'} value={schedule.cron.dayOfWeek} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Can action={'schedule.update'}>
                                    {schedule.tasks.length > 0 && <RunScheduleButton schedule={schedule} />}
                                </Can>
                                <Can action={'schedule.delete'}>
                                    <DeleteScheduleButton
                                        scheduleId={schedule.id}
                                        onDeleted={() => history.push(`/server/${id}/schedules`)}
                                    />
                                </Can>
                            </div>
                        </div>
                    </div>
                    
                    <EditScheduleModal visible={showEditModal} schedule={schedule} onModalDismissed={toggleEditModal} />
                </div>
            )}
        </ServerContentBlock>
    );
};
