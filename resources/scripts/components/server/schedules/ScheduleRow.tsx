import React from 'react';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import { format } from 'date-fns';
import ScheduleCronRow from '@/components/server/schedules/ScheduleCronRow';
import { Calendar, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default ({ schedule }: { schedule: Schedule }) => (
    <div className="flex flex-wrap md:flex-nowrap items-center gap-6 w-full">
        <div className="flex items-center gap-4 flex-1 min-w-[200px]">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all">
                <Calendar size={20} />
            </div>
            <div className="flex flex-col">
                <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                    {schedule.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <Clock size={12} className="text-zinc-500" />
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Last run: <span className="text-zinc-400 normal-case font-mono">{schedule.lastRunAt ? format(schedule.lastRunAt, "MMM do 'at' h:mma") : 'never'}</span>
                    </p>
                </div>
            </div>
        </div>

        <div className="flex-1 min-w-[250px]">
            <ScheduleCronRow cron={schedule.cron} className="justify-center md:justify-start" />
        </div>

        <div className="flex items-center gap-3 ml-auto">
            {schedule.isProcessing ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                    <Loader2 size={12} className="animate-spin" /> Processing
                </span>
            ) : schedule.isActive ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                    <CheckCircle2 size={12} /> Active
                </span>
            ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 border-red-500/20">
                    <XCircle size={12} /> Inactive
                </span>
            )}
        </div>
    </div>
);
