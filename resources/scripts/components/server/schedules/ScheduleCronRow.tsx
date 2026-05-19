import React from 'react';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import classNames from 'classnames';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    cron: Schedule['cron'];
}

const ScheduleCronRow = ({ cron, className, ...props }: Props) => (
    <div className={classNames('flex flex-wrap gap-4 sm:gap-6 justify-center', className)} {...props}>
        <div className="flex flex-col items-center min-w-[40px]">
            <p className="font-mono text-sm font-bold text-white tracking-wider bg-zinc-950/50 px-2 py-1 rounded-md border border-zinc-800/50 shadow-inner">
                {cron.minute}
            </p>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">Min</p>
        </div>
        <div className="flex flex-col items-center min-w-[40px]">
            <p className="font-mono text-sm font-bold text-white tracking-wider bg-zinc-950/50 px-2 py-1 rounded-md border border-zinc-800/50 shadow-inner">
                {cron.hour}
            </p>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">Hour</p>
        </div>
        <div className="flex flex-col items-center min-w-[40px]">
            <p className="font-mono text-sm font-bold text-white tracking-wider bg-zinc-950/50 px-2 py-1 rounded-md border border-zinc-800/50 shadow-inner">
                {cron.dayOfMonth}
            </p>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">Day</p>
        </div>
        <div className="flex flex-col items-center min-w-[40px]">
            <p className="font-mono text-sm font-bold text-white tracking-wider bg-zinc-950/50 px-2 py-1 rounded-md border border-zinc-800/50 shadow-inner">
                {cron.month}
            </p>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">Month</p>
        </div>
        <div className="flex flex-col items-center min-w-[40px]">
            <p className="font-mono text-sm font-bold text-white tracking-wider bg-zinc-950/50 px-2 py-1 rounded-md border border-zinc-800/50 shadow-inner">
                {cron.dayOfWeek}
            </p>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">Week</p>
        </div>
    </div>
);

export default ScheduleCronRow;
