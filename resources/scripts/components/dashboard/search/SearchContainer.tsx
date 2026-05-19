import React, { useState } from 'react';
import { Search } from 'lucide-react';
import useEventListener from '@/plugins/useEventListener';
import SearchModal from '@/components/dashboard/search/SearchModal';
import Tooltip from '@/components/elements/tooltip/Tooltip';

export default () => {
    const [visible, setVisible] = useState(false);

    useEventListener('keydown', (e: KeyboardEvent) => {
        if (['input', 'textarea'].indexOf(((e.target as HTMLElement).tagName || 'input').toLowerCase()) < 0) {
            if (!visible && e.metaKey && e.key.toLowerCase() === '/') {
                setVisible(true);
            }
        }
    });

    return (
        <>
            {visible && <SearchModal appear visible={visible} onDismissed={() => setVisible(false)} />}
            <Tooltip placement={'bottom'} content={'Procurar'}>
                <div 
                    className={'p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all cursor-pointer'} 
                    onClick={() => setVisible(true)}
                >
                    <Search size={20} />
                </div>
            </Tooltip>
        </>
    );
};

