import React, { useState } from 'react';
import { Schedule, Task } from '@/api/server/schedules/getServerSchedules';
import deleteScheduleTask from '@/api/server/schedules/deleteScheduleTask';
import { httpErrorToHuman } from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import TaskDetailsModal from '@/components/server/schedules/TaskDetailsModal';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import { 
    Terminal, 
    Zap, 
    Archive, 
    Pencil, 
    Trash2, 
    AlertCircle, 
    Clock, 
    Code 
} from 'lucide-react';

interface Props {
    schedule: Schedule;
    task: Task;
}

const getActionDetails = (action: string): [string, any] => {
    switch (action) {
        case 'command':
            return ['Send Command', Terminal];
        case 'power':
            return ['Power Action', Zap];
        case 'backup':
            return ['Create Backup', Archive];
        default:
            return ['Unknown Action', Code];
    }
};

export default ({ schedule, task }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, addError } = useFlash();
    const [visible, setVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);

    const onConfirmDeletion = () => {
        setIsLoading(true);
        clearFlashes('schedules');
        deleteScheduleTask(uuid, schedule.id, task.id)
            .then(() =>
                appendSchedule({
                    ...schedule,
                    tasks: schedule.tasks.filter((t) => t.id !== task.id),
                })
            )
            .catch((error) => {
                console.error(error);
                setIsLoading(false);
                addError({ message: httpErrorToHuman(error), key: 'schedules' });
            });
    };

    const [title, Icon] = getActionDetails(task.action);

    return (
        <div className="flex flex-wrap md:flex-nowrap items-center gap-6 px-6 py-4 hover:bg-zinc-800/20 transition-colors group">
            <SpinnerOverlay visible={isLoading} fixed size={'large'} />
            <TaskDetailsModal
                schedule={schedule}
                task={task}
                visible={isEditing}
                onModalDismissed={() => setIsEditing(false)}
            />
            <ConfirmationModal
                title={'Confirm task deletion'}
                buttonText={'Delete Task'}
                onConfirmed={onConfirmDeletion}
                visible={visible}
                onModalDismissed={() => setVisible(false)}
            >
                Are you sure you want to delete this task? This action cannot be undone.
            </ConfirmationModal>

            <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all">
                    <Icon size={18} />
                </div>
                <div className="flex flex-col">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                        {title}
                    </p>
                    {task.payload && (
                        <div className="mt-1 flex items-center gap-2 max-w-[300px]">
                            <code className="text-[11px] font-mono text-zinc-400 bg-zinc-950/50 border border-zinc-800 rounded px-1.5 py-0.5 truncate">
                                {task.payload}
                            </code>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                {task.continueOnFailure && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                        <AlertCircle size={12} /> Continues on Failure
                    </span>
                )}
                {task.sequenceId > 1 && task.timeOffset > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-800/30 border-zinc-700/50">
                        <Clock size={12} /> {task.timeOffset}s delay
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
                <Can action={'schedule.update'}>
                    <button
                        type={'button'}
                        aria-label={'Edit scheduled task'}
                        className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                        onClick={() => setIsEditing(true)}
                    >
                        <Pencil size={16} />
                    </button>
                </Can>
                <Can action={'schedule.update'}>
                    <button
                        type={'button'}
                        aria-label={'Delete scheduled task'}
                        className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        onClick={() => setVisible(true)}
                    >
                        <Trash2 size={16} />
                    </button>
                </Can>
            </div>
        </div>
    );
};
