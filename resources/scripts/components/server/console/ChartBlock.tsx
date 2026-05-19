import React from 'react';

interface ChartBlockProps {
    title: string;
    legend?: React.ReactNode;
    children: React.ReactNode;
}

export default ({ title, legend, children }: ChartBlockProps) => (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 shadow-xl transition-all duration-300 hover:border-zinc-700/50 group">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-green-500 transition-colors">
                {title}
            </h3>
            {legend && <div className="flex items-center gap-2">{legend}</div>}
        </div>
        <div className="relative h-[200px] w-full">
            {children}
        </div>
    </div>
);
