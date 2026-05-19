import React, { useContext } from 'react';
import { DialogContext } from './';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';

export default ({ children }: { children: React.ReactNode }) => {
    const { setFooter } = useContext(DialogContext);

    useDeepCompareEffect(() => {
        setFooter(
            <div className={'px-6 py-3 bg-black border-t border-zinc-800 flex items-center justify-end space-x-3 rounded-b-xl'}>
                {children}
            </div>
        );
    }, [children]);

    return null;
};
