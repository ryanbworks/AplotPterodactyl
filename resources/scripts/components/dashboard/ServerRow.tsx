import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthernet, faHdd, faMemory, faMicrochip, faServer } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import tw from 'twin.macro';
import Spinner from '@/components/elements/Spinner';
import styled from 'styled-components/macro';
import isEqual from 'react-fast-compare';

// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const Icon = memo(
    styled(FontAwesomeIcon)<{ $alarm: boolean }>`
        ${(props) => (props.$alarm ? tw`text-red-500` : tw`text-green-500`)};
    `,
    isEqual
);

const IconDescription = styled.p<{ $alarm: boolean }>`
    ${tw`text-sm font-semibold`};
    ${(props) => (props.$alarm ? tw`text-red-400` : tw`text-white`)};
`;

const StatusIndicatorBox = styled(Link)<{ $status: ServerPowerState | undefined }>`
    ${tw`relative block no-underline overflow-hidden transition-all duration-300`};
    background: rgba(14, 14, 16, 0.92);
    border: 1px solid rgba(39, 39, 42, 0.72);
    border-radius: 1rem;
    backdrop-filter: blur(24px);
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.42);

    & .status-bar {
        ${tw`w-1.5 absolute right-0 z-20 rounded-full m-1 opacity-70 transition-all duration-150`};
        height: calc(100% - 0.5rem);

        ${({ $status }) =>
            !$status || $status === 'offline'
                ? tw`bg-red-500`
                : $status === 'running'
                ? tw`bg-green-500`
                : tw`bg-yellow-500`};
    }

    &:hover {
        border-color: rgba(34, 197, 94, 0.28);
        box-shadow: 0 0 22px rgba(34, 197, 94, 0.16), 0 18px 45px rgba(0, 0, 0, 0.3);
        transform: translateY(-2px);
    }

    &:hover .status-bar {
        ${tw`opacity-100`};
    }
`;

const ResourceBlock = styled.div`
    ${tw`flex items-center gap-3 rounded-xl border p-3`};
    background: #050505;
    border-color: rgba(39, 39, 42, 0.95);
`;

const statusDetails = (status: ServerPowerState | undefined, isSuspended: boolean, serverStatus?: string | null) => {
    if (isSuspended) {
        return {
            label: serverStatus === 'suspended' ? 'Suspenso' : 'Erro',
            css: tw`text-red-500 bg-red-500/10 border-red-500/20`,
        };
    }

    if (!status) {
        return { label: 'Carregando', css: tw`text-neutral-400 bg-neutral-500/10 border-neutral-500/20` };
    }

    switch (status) {
        case 'running':
            return { label: 'Online', css: tw`text-green-500 bg-green-500/10 border-green-500/20` };
        case 'starting':
            return { label: 'Iniciando', css: tw`text-yellow-500 bg-yellow-500/10 border-yellow-500/20` };
        case 'stopping':
            return { label: 'Parando', css: tw`text-yellow-500 bg-yellow-500/10 border-yellow-500/20` };
        case 'offline':
        default:
            return { label: 'Offline', css: tw`text-red-500 bg-red-500/10 border-red-500/20` };
    }
};

type Timer = ReturnType<typeof setInterval>;

export default ({ server, className }: { server: Server; className?: string }) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        // Don't waste a HTTP request if there is nothing important to show to the user because
        // the server is suspended.
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Unlimited';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited';
    const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + ' %' : 'Unlimited';
    const primaryAllocation = server.allocations.find((allocation) => allocation.isDefault);
    const status = statusDetails(stats?.status, isSuspended, server.status);

    return (
        <StatusIndicatorBox to={`/server/${server.id}`} className={className} $status={stats?.status}>
            <div css={tw`grid grid-cols-1 xl:grid-cols-12 gap-5 p-5 sm:p-6`}>
                <div css={tw`xl:col-span-5 flex items-start gap-4 min-w-0`}>
                    <div
                        css={tw`w-12 h-12 rounded-xl flex items-center justify-center flex-none`}
                        style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'rgb(34, 197, 94)' }}
                    >
                        <FontAwesomeIcon icon={faServer} />
                    </div>
                    <div css={tw`min-w-0`}>
                        <div css={tw`flex flex-wrap items-center gap-2`}>
                            <p css={tw`text-lg font-bold text-white break-words`}>{server.name}</p>
                            <span
                                css={[
                                    tw`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-2xs font-bold uppercase tracking-wider`,
                                    status.css,
                                ]}
                            >
                                {status.label}
                            </span>
                        </div>
                        {!!server.description && (
                            <p css={tw`text-sm text-neutral-400 break-words line-clamp-2 mt-1`}>
                                {server.description}
                            </p>
                        )}
                        <div css={tw`flex flex-wrap items-center gap-3 mt-4`}>
                            <span css={tw`text-2xs font-bold uppercase tracking-widest text-neutral-500`}>Node</span>
                            <span css={tw`font-mono text-xs text-neutral-300`}>{server.node}</span>
                        </div>
                    </div>
                </div>

                <div css={tw`xl:col-span-3 flex items-center`}>
                    <ResourceBlock css={tw`w-full`}>
                        <FontAwesomeIcon icon={faEthernet} css={tw`text-green-500 flex-none`} />
                        <div css={tw`min-w-0`}>
                            <p css={tw`text-2xs font-bold uppercase tracking-widest text-neutral-500`}>Endereco</p>
                            <p css={tw`font-mono text-sm text-neutral-200 truncate`}>
                                {primaryAllocation
                                    ? `${primaryAllocation.alias || ip(primaryAllocation.ip)}:${primaryAllocation.port}`
                                    : 'Sem alocacao'}
                            </p>
                        </div>
                    </ResourceBlock>
                </div>

                <div css={tw`xl:col-span-4`}>
                    {!stats || isSuspended ? (
                        <div
                            css={tw`h-full min-h-[76px] flex items-center justify-center rounded-xl border border-neutral-800`}
                            style={{ background: '#050505' }}
                        >
                            {isSuspended || server.isTransferring || server.status ? (
                                <span
                                    css={[
                                        tw`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-2xs font-bold uppercase tracking-wider`,
                                        status.css,
                                    ]}
                                >
                                    {server.isTransferring
                                        ? 'Transferindo'
                                        : server.status === 'installing'
                                        ? 'Instalando'
                                        : server.status === 'restoring_backup'
                                        ? 'Restaurando backup'
                                        : status.label}
                                </span>
                            ) : (
                                <Spinner size={'small'} />
                            )}
                        </div>
                    ) : (
                        <div css={tw`grid grid-cols-1 sm:grid-cols-3 gap-3`}>
                            <ResourceBlock>
                                <Icon icon={faMicrochip} $alarm={alarms.cpu} />
                                <div>
                                    <p css={tw`text-2xs font-bold uppercase tracking-widest text-neutral-500`}>CPU</p>
                                    <IconDescription $alarm={alarms.cpu}>
                                        {stats.cpuUsagePercent.toFixed(2)} %
                                    </IconDescription>
                                    <p css={tw`text-xs text-neutral-600 mt-1`}>de {cpuLimit}</p>
                                </div>
                            </ResourceBlock>
                            <ResourceBlock>
                                <Icon icon={faMemory} $alarm={alarms.memory} />
                                <div>
                                    <p css={tw`text-2xs font-bold uppercase tracking-widest text-neutral-500`}>RAM</p>
                                    <IconDescription $alarm={alarms.memory}>
                                        {bytesToString(stats.memoryUsageInBytes)}
                                    </IconDescription>
                                    <p css={tw`text-xs text-neutral-600 mt-1`}>de {memoryLimit}</p>
                                </div>
                            </ResourceBlock>
                            <ResourceBlock>
                                <Icon icon={faHdd} $alarm={alarms.disk} />
                                <div>
                                    <p css={tw`text-2xs font-bold uppercase tracking-widest text-neutral-500`}>Disco</p>
                                    <IconDescription $alarm={alarms.disk}>
                                        {bytesToString(stats.diskUsageInBytes)}
                                    </IconDescription>
                                    <p css={tw`text-xs text-neutral-600 mt-1`}>de {diskLimit}</p>
                                </div>
                            </ResourceBlock>
                        </div>
                    )}
                </div>
            </div>
            <div className={'status-bar'} />
        </StatusIndicatorBox>
    );
};
