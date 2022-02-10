import * as React from 'react';
import { hot } from 'react-hot-loader';
import { routesConfig, RouteWithSubRoutes } from '../routes';
import { BrowserRouter as Router, Switch } from 'react-router-dom';
import './../assets/scss/App.scss';
import NotificationMessageComponent from './commons/NotificationMessage';
import { DialogComponent } from './commons/Dialog';
import Top from './Top';
import { useSelectedProjectIds } from '../hooks/app-hook';
import { useCurrentUser } from '../hooks/auth-hook';
import { useEffect } from 'react';
import { dialogControl } from '../controls/dialog-control';
import { notificationControl } from '../controls/notification-control';

function App() {
  const currentUser = useCurrentUser();
  const { selectedProjectIds, updateSelectedProjectIds } = useSelectedProjectIds(currentUser);

  useEffect(() => {
    const win: any = window;
    win.showError = (message: string) => {
      dialogControl.alert(message);
    };
    win.showException = (message: string) => {
      dialogControl.alert(message);
    };
    win.showSuccess = (message: string) => {
      notificationControl.showSuccess(message);
    };
    win.showConfirm = (message: string, callback: (agree: boolean) => Promise<any>) => {
      dialogControl.confirm(message, callback);
    };
  }, []);

  return (
    <Router>
      <div className="main-content">
        <Top user={currentUser} selectedProjectIds={selectedProjectIds} onProjectChange={updateSelectedProjectIds} />
        <Switch>
          {routesConfig.map((route, i) => (
            <RouteWithSubRoutes key={i} {...route} />
          ))}
        </Switch>
        <NotificationMessageComponent />
        <DialogComponent />
      </div>
    </Router>
  );
}

declare let module: any;

export default hot(module)(App);
