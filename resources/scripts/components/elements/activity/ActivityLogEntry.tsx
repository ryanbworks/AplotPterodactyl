import React from 'react';
import { Link } from 'react-router-dom';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Translate from '@/components/elements/Translate';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ActivityLog } from '@definitions/user';
import ActivityLogMetaButton from '@/components/elements/activity/ActivityLogMetaButton';
import { FolderOpen, Terminal, Cpu } from 'lucide-react';
import Avatar from '@/components/Avatar';
import useLocationHash from '@/plugins/useLocationHash';
import { getObjectKeys, isObject } from '@/lib/objects';

interface Props {
    activity: ActivityLog;
    children?: React.ReactNode;
}

function wrapProperties(value: unknown): any {
    if (value === null || typeof value === 'string' || typeof value === 'number') {
        return `<strong>${String(value)}</strong>`;
    }

    if (isObject(value)) {
        return getObjectKeys(value).reduce((obj, key) => {
            if (key === 'count' || (typeof key === 'string' && key.endsWith('_count'))) {
                return { ...obj, [key]: value[key] };
            }
            return { ...obj, [key]: wrapProperties(value[key]) };
        }, {} as Record<string, unknown>);
    }

    if (Array.isArray(value)) {
        return value.map(wrapProperties);
    }

    return value;
}

export default ({ activity, children }: Props) => {
    const { pathTo } = useLocationHash();
    const actor = activity.relationships.actor;
    const properties = wrapProperties(activity.properties);

    return (
        <div className={'grid grid-cols-10 py-4 border-b border-zinc-800/40 last:border-0 hover:bg-zinc-800/20 transition-colors group'}>
            <div className={'hidden sm:flex sm:col-span-1 items-center justify-center select-none'}>
                <div className={'flex items-center w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700/50 overflow-hidden shadow-inner'}>
                    <Avatar name={actor?.uuid || 'system'} />
                </div>
            </div>
            <div className={'col-span-10 sm:col-span-9 flex items-center'}>
                <div className={'flex-1 px-4 sm:px-0'}>
                    <div className={'flex items-center gap-2'}>
                        <Tooltip placement={'top'} content={actor?.email || 'System User'}>
                            <span className={'text-sm font-semibold text-zinc-100'}>{actor?.username || 'System'}</span>
                        </Tooltip>
                        <span className={'text-zinc-600'}>&bull;</span>
                        <Link
                            to={`#${pathTo({ event: activity.event })}`}
                            className={'text-xs font-mono tracking-wider text-blue-400 hover:text-blue-300 transition-colors'}
                        >
                            {activity.event}
                        </Link>
                        <div className={'flex items-center gap-2 ml-1 text-zinc-500 group-hover:text-zinc-400 transition-colors'}>
                            {activity.isApi && (
                                <Tooltip placement={'top'} content={'Using API Key'}>
                                    <Terminal size={14} />
                                </Tooltip>
                            )}
                            {activity.event.startsWith('server:sftp.') && (
                                <Tooltip placement={'top'} content={'Using SFTP'}>
                                    <FolderOpen size={14} />
                                </Tooltip>
                            )}
                            {children}
                        </div>
                    </div>
                    <p className={'text-sm text-zinc-300 mt-0.5 leading-relaxed break-words line-clamp-2 pr-4 [&>strong]:text-zinc-50 [&>strong]:font-semibold [&>strong]:break-all'}>
                        <Translate ns={'activity'} values={properties} i18nKey={activity.event.replace(':', '.')} />
                    </p>
                    <div className={'mt-1 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500'}>
                        {activity.ip && (
                            <span className={'flex items-center gap-1.5'}>
                                <Cpu size={10} className={'text-zinc-600'} />
                                {activity.ip}
                            </span>
                        )}
                        <span className={'text-zinc-800'}>|</span>
                        <Tooltip placement={'right'} content={format(activity.timestamp, 'MMM do, yyyy H:mm:ss')}>
                            <span>{formatDistanceToNowStrict(activity.timestamp, { addSuffix: true })}</span>
                        </Tooltip>
                    </div>
                </div>
                {activity.hasAdditionalMetadata && (
                    <div className={'pr-4'}>
                        <ActivityLogMetaButton meta={activity.properties} />
                    </div>
                )}
            </div>
        </div>
    );
};

