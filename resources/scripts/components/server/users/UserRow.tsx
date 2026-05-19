import React, { useState } from 'react';
import { Subuser } from '@/state/server/subusers';
import RemoveSubuserButton from '@/components/server/users/RemoveSubuserButton';
import EditSubuserModal from '@/components/server/users/EditSubuserModal';
import Can from '@/components/elements/Can';
import { useStoreState } from 'easy-peasy';
import tw from 'twin.macro';
import { Pencil, ShieldCheck, ShieldAlert } from 'lucide-react';

interface Props {
    subuser: Subuser;
}

export default ({ subuser }: Props) => {
    const uuid = useStoreState((state) => state.user!.data!.uuid);
    const [visible, setVisible] = useState(false);

    return (
        <div css={tw`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 shadow-lg flex items-center transition-all duration-300 hover:border-zinc-700/50 hover:bg-zinc-900/60`}>
            <EditSubuserModal subuser={subuser} visible={visible} onModalDismissed={() => setVisible(false)} />
            
            <div css={tw`w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden hidden md:flex items-center justify-center p-1 shadow-inner`}>
                <img css={tw`w-full h-full rounded-lg object-cover`} src={`${subuser.image}?s=400`} alt={subuser.email} />
            </div>

            <div css={tw`ml-4 flex-1 overflow-hidden`}>
                <p css={tw`text-sm font-bold text-white truncate tracking-wide`}>{subuser.email}</p>
                <p css={tw`text-xs text-zinc-500 mt-0.5 md:hidden flex items-center gap-1`}>
                     {subuser.twoFactorEnabled ? <ShieldCheck size={10} className="text-green-500" /> : <ShieldAlert size={10} className="text-red-500" />}
                     {subuser.permissions.filter((permission) => permission !== 'websocket.connect').length} permissões
                </p>
            </div>

            <div css={tw`ml-4 hidden md:flex flex-col items-center justify-center min-w-[100px]`}>
                <div css={tw`flex items-center gap-1.5`}>
                    {subuser.twoFactorEnabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 border-green-500/20">
                            <ShieldCheck size={10} /> Ativo
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 border-red-500/20">
                            <ShieldAlert size={10} /> Inativo
                        </span>
                    )}
                </div>
                <p css={tw`text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1`}>2FA Status</p>
            </div>

            <div css={tw`ml-4 hidden md:flex flex-col items-center justify-center min-w-[100px]`}>
                <p css={tw`text-sm font-mono text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800`}>
                    {subuser.permissions.filter((permission) => permission !== 'websocket.connect').length}
                </p>
                <p css={tw`text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1`}>Permissões</p>
            </div>

            <div css={tw`ml-4 flex items-center gap-2`}>
                {subuser.uuid !== uuid && (
                    <>
                        <Can action={'user.update'}>
                            <button
                                type={'button'}
                                aria-label={'Editar utilizador'}
                                css={tw`p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all shadow-sm`}
                                onClick={() => setVisible(true)}
                            >
                                <Pencil size={18} />
                            </button>
                        </Can>
                        <Can action={'user.delete'}>
                            <RemoveSubuserButton subuser={subuser} />
                        </Can>
                    </>
                )}
            </div>
        </div>
    );
};
