import * as React from 'react';
import { BrowserRouter as Router, Switch, Route, NavLink } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';

export const routesConfig = [
  {
    path: '/redmine_excel_connector/login',
    exact: true,
    component: Login
  },
  {
    path: '/redmine_excel_connector',
    exact: true,
    component: Home
  }
];

export function RouteWithSubRoutes(route) {
  return <Route path={route.path} exact={route.exact || false} render={props => <route.component {...props} routes={route.routes} />} />;
}
