import * as React from 'react';

import { useLoggedOut } from '../hooks/auth-hook';
import { Menu, Dropdown } from 'semantic-ui-react';
import T from './commons/T';
import { User } from '../models/user.model';

export default function Top(props: { user: User; selectedProjectIds: number[]; onProjectChange: (selectedIds: number[]) => void }) {
  const { loggingOut, logOut } = useLoggedOut();
  const { user } = props;

  if (!user) {
    return <></>;
  }

  return (
    <div className="top-bar">
      <Menu borderless fluid>
        <Menu.Item position="right" style={{ alignItems: 'start' }}>
          {user.name}
          <Dropdown icon="angle down" loading={loggingOut}>
            <Dropdown.Menu direction="left">
              <Dropdown.Item onClick={() => logOut()}>
                <T>logout</T>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Menu.Item>
      </Menu>
    </div>
  );
}
