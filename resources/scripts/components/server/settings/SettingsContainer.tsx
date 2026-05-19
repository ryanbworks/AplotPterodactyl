import React from 'react';
import { ServerContext } from '@/state/server';
import { useStoreState } from 'easy-peasy';
import RenameServerBox from '@/components/server/settings/RenameServerBox';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import ReinstallServerBox from '@/components/server/settings/ReinstallServerBox';
import tw from 'twin.macro';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { ip } from '@/lib/formatters';
import { Settings, Info, Server, ShieldCheck, Terminal, ExternalLink } from 'lucide-react';

export default () => {
    const username = useStoreState((state) => state.user.data!.username);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);
    const sftp = ServerContext.useStoreState((state) => state.server.data!.sftpDetails, isEqual);

    return (
        <ServerContentBlock title={'Definições'} css={tw`max-w-[1600px] mx-auto`}>
            <div className="flex-1 w-full flex flex-col">
                {/* Ambient Glows */}
                <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-green-500/10 blur-[150px] pointer-events-none" />
                <div className="fixed bottom-[-10%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

                <div css={tw`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10`}>
                    <div>
                        <h1 css={tw`text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-3`}>
                            <Settings size={32} className="text-green-500" />
                            Configurações
                        </h1>
                        <p css={tw`text-sm sm:text-base text-zinc-500 mt-2 flex items-center gap-1.5`}>
                            <Info size={16} />
                            Gerencie o acesso SFTP, informações técnicas e manutenção do servidor.
                        </p>
                    </div>
                </div>

                <FlashMessageRender byKey={'settings'} css={tw`mb-6 relative z-10`} />

                <div css={tw`grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10`}>
                    <div css={tw`flex flex-col gap-8`}>
                        <Can action={'file.sftp'}>
                            <div css={tw`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl`}>
                                <div css={tw`flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/50`}>
                                    <div css={tw`flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-wider`}>
                                        <Server size={18} className="text-blue-400" />
                                        Detalhes SFTP
                                    </div>
                                    <a 
                                        href={`sftp://${username}.${id}@${ip(sftp.ip)}:${sftp.port}`}
                                        className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest"
                                    >
                                        Lançar SFTP <ExternalLink size={14} />
                                    </a>
                                </div>
                                
                                <div css={tw`space-y-6`}>
                                    <div>
                                        <Label>Endereço do Servidor</Label>
                                        <CopyOnClick text={`sftp://${ip(sftp.ip)}:${sftp.port}`}>
                                            <Input type={'text'} value={`sftp://${ip(sftp.ip)}:${sftp.port}`} readOnly />
                                        </CopyOnClick>
                                    </div>
                                    <div>
                                        <Label>Utilizador</Label>
                                        <CopyOnClick text={`${username}.${id}`}>
                                            <Input type={'text'} value={`${username}.${id}`} readOnly />
                                        </CopyOnClick>
                                    </div>
                                    <div css={tw`bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl flex gap-3 items-start`}>
                                        <ShieldCheck size={18} className="text-blue-400 shrink-0 mt-0.5" />
                                        <p css={tw`text-xs text-zinc-400 leading-relaxed`}>
                                            A sua palavra-passe SFTP é a mesma que utiliza para aceder a este painel.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Can>

                        <div css={tw`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl`}>
                            <div css={tw`flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-wider mb-6 pb-4 border-b border-zinc-800/50`}>
                                <Terminal size={18} className="text-green-500" />
                                Informações Técnicas
                            </div>
                            
                            <div css={tw`space-y-4`}>
                                <div css={tw`flex items-center justify-between`}>
                                    <p css={tw`text-xs font-bold text-zinc-500 uppercase tracking-widest`}>Node</p>
                                    <code css={tw`font-mono text-sm bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800 text-green-500 shadow-inner`}>
                                        {node}
                                    </code>
                                </div>
                                <div css={tw`flex items-center justify-between`}>
                                    <p css={tw`text-xs font-bold text-zinc-500 uppercase tracking-widest`}>ID do Servidor</p>
                                    <CopyOnClick text={uuid}>
                                        <code css={tw`font-mono text-[10px] sm:text-xs bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800 text-zinc-400 shadow-inner cursor-pointer hover:text-white transition-colors`}>
                                            {uuid}
                                        </code>
                                    </CopyOnClick>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div css={tw`flex flex-col gap-8`}>
                        <Can action={'settings.rename'}>
                            <RenameServerBox />
                        </Can>
                        <Can action={'settings.reinstall'}>
                            <ReinstallServerBox />
                        </Can>
                    </div>
                </div>
            </div>
        </ServerContentBlock>
    );
};
