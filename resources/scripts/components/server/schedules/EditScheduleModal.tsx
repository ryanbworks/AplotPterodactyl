import React, { useContext, useEffect, useState } from 'react';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import { Form, Formik, FormikHelpers, Field as FormikField, FieldProps } from 'formik';
import FormikSwitch from '@/components/elements/FormikSwitch';
import createOrUpdateSchedule from '@/api/server/schedules/createOrUpdateSchedule';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import ModalContext from '@/context/ModalContext';
import asModal from '@/hoc/asModal';
import Switch from '@/components/elements/Switch';
import ScheduleCheatsheetCards from '@/components/server/schedules/ScheduleCheatsheetCards';
import { Calendar, Settings, ChevronRight, HelpCircle, Clock } from 'lucide-react';

interface Props {
    schedule?: Schedule;
}

interface Values {
    name: string;
    dayOfWeek: string;
    month: string;
    dayOfMonth: string;
    hour: string;
    minute: string;
    enabled: boolean;
    onlyWhenOnline: boolean;
}

const CronInput = ({ name, label, placeholder }: { name: string; label: string; placeholder?: string }) => (
    <FormikField name={name}>
        {({ field }: FieldProps) => (
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
                <input
                    {...field}
                    className="w-full bg-[#050505] border border-zinc-800 text-white text-sm font-mono rounded-xl py-2 px-3 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700 shadow-inner text-center"
                    placeholder={placeholder || '*'}
                />
            </div>
        )}
    </FormikField>
);

const EditScheduleModal = ({ schedule }: Props) => {
    const { addError, clearFlashes } = useFlash();
    const { dismiss } = useContext(ModalContext);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const [showCheatsheet, setShowCheetsheet] = useState(false);

    useEffect(() => {
        return () => {
            clearFlashes('schedule:edit');
        };
    }, []);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:edit');
        createOrUpdateSchedule(uuid, {
            id: schedule?.id,
            name: values.name,
            cron: {
                minute: values.minute,
                hour: values.hour,
                dayOfWeek: values.dayOfWeek,
                month: values.month,
                dayOfMonth: values.dayOfMonth,
            },
            onlyWhenOnline: values.onlyWhenOnline,
            isActive: values.enabled,
        })
            .then((schedule) => {
                setSubmitting(false);
                appendSchedule(schedule);
                dismiss();
            })
            .catch((error) => {
                console.error(error);

                setSubmitting(false);
                addError({ key: 'schedule:edit', message: httpErrorToHuman(error) });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={
                {
                    name: schedule?.name || '',
                    minute: schedule?.cron.minute || '*/5',
                    hour: schedule?.cron.hour || '*',
                    dayOfMonth: schedule?.cron.dayOfMonth || '*',
                    month: schedule?.cron.month || '*',
                    dayOfWeek: schedule?.cron.dayOfWeek || '*',
                    enabled: schedule?.isActive ?? true,
                    onlyWhenOnline: schedule?.onlyWhenOnline ?? true,
                } as Values
            }
        >
            {({ isSubmitting }) => (
                <Form className="m-0">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                            {schedule ? <Settings size={20} /> : <Calendar size={20} />}
                        </div>
                        <h3 className="text-xl font-bold text-white">
                            {schedule ? 'Edit Schedule' : 'Create New Schedule'}
                        </h3>
                    </div>

                    <FlashMessageRender byKey={'schedule:edit'} className="mb-6" />

                    <FormikField name="name">
                        {({ field, form: { errors, touched } }: FieldProps) => (
                            <div className="flex flex-col gap-2 mb-6">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                                    Schedule Name
                                </label>
                                <input
                                    {...field}
                                    className="w-full bg-[#050505] border border-zinc-800 text-white text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600 shadow-inner"
                                    placeholder="Ex: Daily Restart, Backup Task..."
                                />
                                {touched[field.name] && errors[field.name] && (
                                    <p className="text-xs text-red-400 mt-1 ml-1">{errors[field.name] as string}</p>
                                )}
                            </div>
                        )}
                    </FormikField>

                    <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={12} /> Cron Configuration
                            </h4>
                            <button
                                type="button"
                                onClick={() => setShowCheetsheet((s) => !s)}
                                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 uppercase tracking-wider"
                            >
                                <HelpCircle size={12} /> {showCheatsheet ? 'Hide Help' : 'Show Cheatsheet'}
                            </button>
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            <CronInput name="minute" label="Min" />
                            <CronInput name="hour" label="Hour" />
                            <CronInput name="dayOfMonth" label="Day" />
                            <CronInput name="month" label="Month" />
                            <CronInput name="dayOfWeek" label="Week" />
                        </div>
                        {showCheatsheet && (
                            <div className="mt-4 pt-4 border-t border-zinc-800/50">
                                <ScheduleCheatsheetCards />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl flex items-center justify-between shadow-sm">
                            <div className="flex flex-col gap-1">
                                <p className="text-xs font-bold text-zinc-300">Only When Server Is Online</p>
                                <p className="text-[10px] text-zinc-500 leading-tight max-w-[250px]">Only execute this schedule when the server is online.</p>
                            </div>
                            <FormikSwitch name="onlyWhenOnline" />
                        </div>

                        <div className="p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl flex items-center justify-between shadow-sm">
                            <div className="flex flex-col gap-1">
                                <p className="text-xs font-bold text-zinc-300">Schedule Enabled</p>
                                <p className="text-[10px] text-zinc-500 leading-tight max-w-[250px]">Automatically execute this schedule at the defined time.</p>
                            </div>
                            <FormikSwitch name="enabled" />
                        </div>
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
                            <ChevronRight size={16} /> {schedule ? 'Save Changes' : 'Create Schedule'}
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default asModal<Props>()(EditScheduleModal);
