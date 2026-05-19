import React, { useContext, useEffect } from 'react';
import { Schedule, Task } from '@/api/server/schedules/getServerSchedules';
import { Field as FormikField, Form, Formik, FormikHelpers, useField, FieldProps } from 'formik';
import { ServerContext } from '@/state/server';
import createOrUpdateScheduleTask from '@/api/server/schedules/createOrUpdateScheduleTask';
import { httpErrorToHuman } from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import { boolean, number, object, string } from 'yup';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import ModalContext from '@/context/ModalContext';
import asModal from '@/hoc/asModal';
import FormikSwitch from '@/components/elements/FormikSwitch';
import { Terminal, Zap, Archive, Clock, ChevronRight, ChevronDown, List } from 'lucide-react';

interface Props {
    schedule: Schedule;
    task?: Task;
}

interface Values {
    action: string;
    payload: string;
    timeOffset: string;
    continueOnFailure: boolean;
}

const schema = object().shape({
    action: string().required().oneOf(['command', 'power', 'backup']),
    payload: string().when('action', {
        is: (v) => v !== 'backup',
        then: string().required('A task payload must be provided.'),
        otherwise: string(),
    }),
    continueOnFailure: boolean(),
    timeOffset: number()
        .typeError('The time offset must be a valid number between 0 and 900.')
        .required('A time offset value must be provided.')
        .min(0, 'The time offset must be at least 0 seconds.')
        .max(900, 'The time offset must be less than 900 seconds.'),
});

const ActionListener = () => {
    const [{ value }, { initialValue: initialAction }] = useField<string>('action');
    const [, { initialValue: initialPayload }, { setValue, setTouched }] = useField<string>('payload');

    useEffect(() => {
        if (value !== initialAction) {
            setValue(value === 'power' ? 'start' : '');
            setTouched(false);
        } else {
            setValue(initialPayload || '');
            setTouched(false);
        }
    }, [value]);

    return null;
};

const TaskDetailsModal = ({ schedule, task }: Props) => {
    const { dismiss } = useContext(ModalContext);
    const { clearFlashes, addError } = useFlash();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);

    useEffect(() => {
        return () => {
            clearFlashes('schedule:task');
        };
    }, []);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:task');
        if (backupLimit === 0 && values.action === 'backup') {
            setSubmitting(false);
            addError({
                message: "A backup task cannot be created when the server's backup limit is set to 0.",
                key: 'schedule:task',
            });
        } else {
            createOrUpdateScheduleTask(uuid, schedule.id, task?.id, values)
                .then((task) => {
                    let tasks = schedule.tasks.map((t) => (t.id === task.id ? task : t));
                    if (!schedule.tasks.find((t) => t.id === task.id)) {
                        tasks = [...tasks, task];
                    }

                    appendSchedule({ ...schedule, tasks });
                    dismiss();
                })
                .catch((error) => {
                    console.error(error);
                    setSubmitting(false);
                    addError({ message: httpErrorToHuman(error), key: 'schedule:task' });
                });
        }
    };

    return (
        <Formik
            onSubmit={submit}
            validationSchema={schema}
            initialValues={{
                action: task?.action || 'command',
                payload: task?.payload || '',
                timeOffset: task?.timeOffset.toString() || '0',
                continueOnFailure: task?.continueOnFailure || false,
            }}
        >
            {({ isSubmitting, values }) => (
                <Form className="m-0">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                            <List size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-white">
                            {task ? 'Edit Task' : 'Create Task'}
                        </h3>
                    </div>

                    <FlashMessageRender byKey={'schedule:task'} className="mb-6" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                                Action
                            </label>
                            <ActionListener />
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                                    <Zap size={16} />
                                </div>
                                <FormikField 
                                    as="select" 
                                    name="action"
                                    className="w-full bg-[#050505] border border-zinc-800 text-white text-sm rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                                >
                                    <option value={'command'}>Send Command</option>
                                    <option value={'power'}>Send Power Action</option>
                                    <option value={'backup'}>Create Backup</option>
                                </FormikField>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                                    <ChevronDown size={16} />
                                </div>
                            </div>
                        </div>

                        <FormikField name="timeOffset">
                            {({ field, form: { errors, touched } }: FieldProps) => (
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                                        Time Offset (Seconds)
                                    </label>
                                    <div className="relative group">
                                        <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                                        <input
                                            {...field}
                                            className="w-full bg-[#050505] border border-zinc-800 text-white text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600 shadow-inner font-mono"
                                            placeholder="0"
                                        />
                                    </div>
                                    {touched[field.name] && errors[field.name] && (
                                        <p className="text-xs text-red-400 mt-1 ml-1">{errors[field.name] as string}</p>
                                    )}
                                </div>
                            )}
                        </FormikField>
                    </div>

                    <div className="mb-6">
                        {values.action === 'command' ? (
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Payload (Command)</label>
                                <div className="relative group">
                                    <Terminal size={16} className="absolute left-3 top-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                                    <FormikField 
                                        as="textarea" 
                                        name="payload" 
                                        rows={4} 
                                        className="w-full bg-[#050505] border border-zinc-800 text-white text-sm font-mono rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700 shadow-inner"
                                        placeholder="say Hello World!"
                                    />
                                </div>
                            </div>
                        ) : values.action === 'power' ? (
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Payload (Power Action)</label>
                                <div className="relative group">
                                    <Zap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                                    <FormikField 
                                        as="select" 
                                        name="payload"
                                        className="w-full bg-[#050505] border border-zinc-800 text-white text-sm rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value={'start'}>Start the server</option>
                                        <option value={'restart'}>Restart the server</option>
                                        <option value={'stop'}>Stop the server</option>
                                        <option value={'kill'}>Terminate the server</option>
                                    </FormikField>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Ignored Files (Optional)</label>
                                <div className="relative group">
                                    <Archive size={16} className="absolute left-3 top-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                                    <FormikField 
                                        as="textarea" 
                                        name="payload" 
                                        rows={4} 
                                        className="w-full bg-[#050505] border border-zinc-800 text-white text-sm font-mono rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700 shadow-inner"
                                        placeholder="logs/*\ncache/*"
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-500 ml-1">Optional. By default, your .pteroignore file will be used.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex flex-col gap-1">
                            <p className="text-xs font-bold text-zinc-300">Continue on Failure</p>
                            <p className="text-[10px] text-zinc-500 leading-tight max-w-[250px]">Future tasks will be run even if this task fails.</p>
                        </div>
                        <FormikSwitch name="continueOnFailure" />
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-3">
                        <button 
                            type="button"
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium"
                            onClick={dismiss}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} /> {task ? 'Save Changes' : 'Create Task'}
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default asModal<Props>()(TaskDetailsModal);
