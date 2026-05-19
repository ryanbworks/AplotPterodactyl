import React, { useState } from 'react';
import EditSubuserModal from '@/components/server/users/EditSubuserModal';
import { UserPlus } from 'lucide-react';

export default () => {
    const [visible, setVisible] = useState(false);

    return (
        <>
            <EditSubuserModal visible={visible} onModalDismissed={() => setVisible(false)} />
            <button
                onClick={() => setVisible(true)}
                className="px-4 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2"
            >
                <UserPlus size={16} /> Novo Utilizador
            </button>
        </>
    );
};
