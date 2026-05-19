import * as React from 'react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LayoutGrid, Settings, LogOut, Search, User } from 'lucide-react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Avatar from '@/components/Avatar';

export default () => {
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const user = useStoreState((state: ApplicationStore) => state.user.data!);
    const rootAdmin = user.rootAdmin;
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    return (
        <div className={'fixed top-0 left-0 w-full z-40 bg-zinc-950/50 backdrop-blur-xl border-b border-zinc-800/50 shadow-xl'}>
            <SpinnerOverlay visible={isLoggingOut} />
            <div className={'mx-auto w-full flex items-center h-16 max-w-[1600px] px-4'}>
                <div id={'logo'} className={'flex-1'}>
                    <Link
                        to={'/'}
                        className={'text-xl font-bold text-white hover:text-green-500 transition-all duration-300 flex items-center gap-2 group'}
                    >
                        <div className={'w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.3)] group-hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all'}>
                            <LayoutGrid size={18} className={'text-white'} />
                        </div>
                        <span className={'hidden sm:block tracking-tight'}>{name}</span>
                    </Link>
                </div>
                
                <div className={'flex h-full items-center gap-1 sm:gap-2'}>
                    <SearchContainer />
                    
                    <Tooltip placement={'bottom'} content={'Dashboard'}>
                        <NavLink 
                            to={'/'} 
                            exact
                            className={'p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all active:text-green-500'}
                            activeClassName={'text-green-500 bg-green-500/5'}
                        >
                            <LayoutGrid size={20} />
                        </NavLink>
                    </Tooltip>

                    {rootAdmin && (
                        <Tooltip placement={'bottom'} content={'Admin'}>
                            <a 
                                href={'/admin'} 
                                rel={'noreferrer'}
                                className={'p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all'}
                            >
                                <Settings size={20} />
                            </a>
                        </Tooltip>
                    )}

                    <div className={'h-8 w-px bg-zinc-800/50 mx-1 sm:mx-2'} />

                    <Tooltip placement={'bottom'} content={'Minha Conta'}>
                        <NavLink 
                            to={'/account'}
                            className={'flex items-center gap-3 p-1.5 pr-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all'}
                            activeClassName={'text-white bg-zinc-800/50'}
                        >
                            <div className={'w-8 h-8 rounded-lg overflow-hidden border border-zinc-700/50'}>
                                <Avatar.User />
                            </div>
                            <div className={'hidden md:flex flex-col items-start leading-none'}>
                                <span className={'text-xs font-bold text-zinc-100'}>{user.username}</span>
                                <span className={'text-[10px] text-zinc-500 mt-0.5 uppercase tracking-widest'}>Cliente</span>
                            </div>
                        </NavLink>
                    </Tooltip>

                    <Tooltip placement={'bottom'} content={'Sair'}>
                        <button 
                            onClick={onTriggerLogout}
                            className={'p-2.5 rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all'}
                        >
                            <LogOut size={20} />
                        </button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};

