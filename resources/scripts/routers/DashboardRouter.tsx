import React from 'react';
import { NavLink, Route, Switch } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import SubNavigation from '@/components/elements/SubNavigation';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import routes from '@/routers/routes';
import { User, Key, Shield, Activity } from 'lucide-react';

const NavigationIcon = ({ name }: { name: string }) => {
    switch (name.toLowerCase()) {
        case 'account':
            return <User size={16} />;
        case 'api credentials':
            return <Key size={16} />;
        case 'ssh keys':
            return <Shield size={16} />;
        case 'activity':
            return <Activity size={16} />;
        default:
            return null;
    }
};

export default () => {
    const location = useLocation();

    return (
        <>
            <NavigationBar />
            {location.pathname.startsWith('/account') && (
                <SubNavigation>
                    <div>
                        {routes.account
                            .filter((route) => !!route.name)
                            .map(({ path, name, exact = false }) => (
                                <NavLink key={path} to={`/account/${path}`.replace('//', '/')} exact={exact}>
                                    <NavigationIcon name={name!} />
                                    {name}
                                </NavLink>
                            ))}
                    </div>
                </SubNavigation>
            )}
            <TransitionRouter>
                <React.Suspense fallback={<Spinner centered />}>
                    <Switch location={location}>
                        <Route path={'/'} exact>
                            <DashboardContainer />
                        </Route>
                        {routes.account.map(({ path, component: Component }) => (
                            <Route key={path} path={`/account/${path}`.replace('//', '/')} exact>
                                <Component />
                            </Route>
                        ))}
                        <Route path={'*'}>
                            <NotFound />
                        </Route>
                    </Switch>
                </React.Suspense>
            </TransitionRouter>
        </>
    );
};

