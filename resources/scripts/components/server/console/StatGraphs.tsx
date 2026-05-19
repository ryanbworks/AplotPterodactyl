import React, { useEffect, useRef } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { Line } from 'react-chartjs-2';
import { useChart, useChartTickLabel } from '@/components/server/console/chart';
import { hexToRgba } from '@/lib/helpers';
import { bytesToString } from '@/lib/formatters';
import { DownloadCloud, UploadCloud } from 'lucide-react';
import { theme } from 'twin.macro';
import ChartBlock from '@/components/server/console/ChartBlock';
import Tooltip from '@/components/elements/tooltip/Tooltip';

export default () => {
    const status = ServerContext.useStoreState((state) => state.status.value);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const previous = useRef<Record<'tx' | 'rx', number>>({ tx: -1, rx: -1 });

    const cpu = useChartTickLabel('CPU', limits.cpu, '%', 2);
    const memory = useChartTickLabel('Memory', limits.memory, 'MiB');
    const network = useChart('Network', {
        sets: 2,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    ticks: {
                        callback(value) {
                            return bytesToString(typeof value === 'string' ? parseInt(value, 10) : value);
                        },
                    },
                },
            },
        },
        callback(opts, index) {
            return {
                ...opts,
                label: !index ? 'Network In' : 'Network Out',
                borderColor: !index ? theme('colors.blue.400') : theme('colors.green.400'),
                backgroundColor: hexToRgba(!index ? theme('colors.blue.700') : theme('colors.green.700'), 0.2),
                fill: true,
                tension: 0.4,
            };
        },
    });

    useEffect(() => {
        if (status === 'offline') {
            cpu.clear();
            memory.clear();
            network.clear();
        }
    }, [status]);

    useWebsocketEvent(SocketEvent.STATS, (data: string) => {
        let values: any = {};
        try {
            values = JSON.parse(data);
        } catch (e) {
            return;
        }
        cpu.push(values.cpu_absolute);
        memory.push(Math.floor(values.memory_bytes / 1024 / 1024));
        network.push([
            previous.current.rx < 0 ? 0 : Math.max(0, values.network.rx_bytes - previous.current.rx),
            previous.current.tx < 0 ? 0 : Math.max(0, values.network.tx_bytes - previous.current.tx),
        ]);

        previous.current = { tx: values.network.tx_bytes, rx: values.network.rx_bytes };
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ChartBlock title={'CPU Load'}>
                <Line {...cpu.props} options={{ ...cpu.props.options, maintainAspectRatio: false }} />
            </ChartBlock>
            <ChartBlock title={'Memory'}>
                <Line {...memory.props} options={{ ...memory.props.options, maintainAspectRatio: false }} />
            </ChartBlock>
            <ChartBlock
                title={'Network'}
                legend={
                    <div className="flex gap-3">
                        <Tooltip arrow content={'Inbound'}>
                            <DownloadCloud size={14} className="text-blue-400" />
                        </Tooltip>
                        <Tooltip arrow content={'Outbound'}>
                            <UploadCloud size={14} className="text-green-400" />
                        </Tooltip>
                    </div>
                }
            >
                <Line {...network.props} options={{ ...network.props.options, maintainAspectRatio: false }} />
            </ChartBlock>
        </div>
    );
};
