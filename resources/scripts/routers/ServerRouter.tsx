import TransferListener from '@/components/server/TransferListener';
import React, { useEffect, useState } from 'react';
import { NavLink, Route, Switch, useRouteMatch } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import TransitionRouter from '@/TransitionRouter';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ServerContext } from '@/state/server';
import { CSSTransition } from 'react-transition-group';
import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { useStoreState } from 'easy-peasy';
import SubNavigation from '@/components/elements/SubNavigation';
import InstallListener from '@/components/server/InstallListener';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import {
    Terminal,
    Folder,
    Database,
    Calendar,
    Users,
    Archive,
    Globe,
    PlayCircle,
    Settings,
    Activity,
    ExternalLink,
} from 'lucide-react';
import { useLocation } from 'react-router';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import PermissionRoute from '@/components/elements/PermissionRoute';
import routes from '@/routers/routes';

const NavigationIcon = ({ name }: { name: string }) => {
    switch (name.toLowerCase()) {
        case 'console':
            return <Terminal size={16} />;
        case 'files':
            return <Folder size={16} />;
        case 'databases':
            return <Database size={16} />;
        case 'schedules':
            return <Calendar size={16} />;
        case 'users':
            return <Users size={16} />;
        case 'backups':
            return <Archive size={16} />;
        case 'network':
            return <Globe size={16} />;
        case 'startup':
            return <PlayCircle size={16} />;
        case 'settings':
            return <Settings size={16} />;
        case 'activity':
            return <Activity size={16} />;
        default:
            return null;
    }
};

export default () => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();

    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);

    const to = (value: string, url = false) => {
        if (value === '/') {
            return url ? match.url : match.path;
        }
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    useEffect(
        () => () => {
            clearServerState();
        },
        []
    );

    useEffect(() => {
        setError('');

        getServer(match.params.id).catch((error) => {
            console.error(error);
            setError(httpErrorToHuman(error));
        });

        return () => {
            clearServerState();
        };
    }, [match.params.id]);

    return (
        <React.Fragment key={'server-router'}>
            <NavigationBar />
            {!uuid || !id ? (
                error ? (
                    <ServerError message={error} />
                ) : (
                    <div className={'pt-16'}>
                        <Spinner size={'large'} centered />
                    </div>
                )
            ) : (
                <>
                    <CSSTransition timeout={150} classNames={'fade'} appear in>
                        <SubNavigation>
                            <div>
                                {routes.server
                                    .filter((route) => !!route.name)
                                    .map((route) =>
                                        route.permission ? (
                                            <Can key={route.path} action={route.permission} matchAny>
                                                <NavLink to={to(route.path, true)} exact={route.exact}>
                                                    <NavigationIcon name={route.name!} />
                                                    {route.name}
                                                </NavLink>
                                            </Can>
                                        ) : (
                                            <NavLink key={route.path} to={to(route.path, true)} exact={route.exact}>
                                                <NavigationIcon name={route.name!} />
                                                {route.name}
                                            </NavLink>
                                        )
                                    )}
                                {rootAdmin && (
                                    // eslint-disable-next-line react/jsx-no-target-blank
                                    <a href={`/admin/servers/view/${serverId}`} target={'_blank'}>
                                        <ExternalLink size={16} />
                                    </a>
                                )}
                            </div>
                        </SubNavigation>
                    </CSSTransition>
                    <InstallListener />
                    <TransferListener />
                    <WebsocketHandler />
                    {inConflictState && (!rootAdmin || (rootAdmin && !location.pathname.endsWith(`/server/${id}`))) ? (
                        <ConflictStateRenderer />
                    ) : (
                        <ErrorBoundary>
                            <TransitionRouter>
                                <Switch location={location}>
                                    {routes.server.map(({ path, permission, component: Component }) => (
                                        <PermissionRoute key={path} permission={permission} path={to(path)} exact>
                                            <Spinner.Suspense>
                                                <Component />
                                            </Spinner.Suspense>
                                        </PermissionRoute>
                                    ))}
                                    <Route path={'*'} component={NotFound} />
                                </Switch>
                            </TransitionRouter>
                        </ErrorBoundary>
                    )}
                </>
            )}
        </React.Fragment>
    );
};

