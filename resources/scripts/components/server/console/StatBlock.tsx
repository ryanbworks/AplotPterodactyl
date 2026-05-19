import React from 'react';
import useFitText from 'use-fit-text';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { LucideIcon } from 'lucide-react';

interface StatBlockProps {
    title: string;
    copyOnClick?: string;
    color?: string | undefined;
    icon: LucideIcon;
    children: React.ReactNode;
    className?: string;
}

export default ({ title, copyOnClick, icon: Icon, color, className, children }: StatBlockProps) => {
    const { fontSize, ref } = useFitText({ minFontSize: 8, maxFontSize: 500 });

    return (
        <CopyOnClick text={copyOnClick}>
            <div className={`bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700/50 group flex items-center gap-4 ${className}`}>
                <div className={`p-3 rounded-xl transition-all group-hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] ${
                    color && color.includes('red') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                    color && color.includes('yellow') ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                    'bg-zinc-800/50 text-zinc-400 border border-zinc-700/30'
                }`}>
                    <Icon size={20} />
                </div>
                <div className="flex flex-col justify-center overflow-hidden w-full">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-tight mb-1">
                        {title}
                    </p>
                    <div
                        ref={ref}
                        className="h-[1.75rem] w-full font-mono tracking-wider font-semibold text-white truncate"
                        style={{ fontSize }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </CopyOnClick>
    );
};
