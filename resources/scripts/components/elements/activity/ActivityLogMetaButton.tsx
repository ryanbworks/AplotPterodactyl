import React, { useState } from 'react';
import { Database } from 'lucide-react';
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/elements/button/index';

export default ({ meta }: { meta: Record<string, unknown> }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className={'self-center md:px-4'}>
            <Dialog open={open} onClose={() => setOpen(false)} hideCloseIcon title={'Metadados do Evento'}>
                <pre
                    className={
                        'bg-[#050505] border border-zinc-800 rounded-xl p-4 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap text-zinc-300 shadow-inner'
                    }
                >
                    {JSON.stringify(meta, null, 2)}
                </pre>
                <Dialog.Footer>
                    <Button.Text onClick={() => setOpen(false)}>Fechar</Button.Text>
                </Dialog.Footer>
            </Dialog>
            <button
                aria-describedby={'Ver metadados adicionais do evento'}
                className={
                    'p-2 transition-all duration-300 text-zinc-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg'
                }
                onClick={() => setOpen(true)}
            >
                <Database size={18} />
            </button>
        </div>
    );
};

