import { ChangeableSubject, RespCode } from '../models/system.model';
import { useState, useEffect } from 'react';
import { accessToken, httpRequest, useHttpRequest } from '../http-client';
import * as _ from 'lodash';
import { routerControl } from '../controls/route-control';
import { useXForm } from './form-hook';
import { LoginData, User } from '../models/user.model';
import { sendCommand } from '../helpers/my_helper';

const currentUser = new ChangeableSubject<User>((window as any)['RX__CurrentUser'] || null);

export function useCurrentUser(): User {
  const [state, setState] = useState<User>(currentUser.value);

  useEffect(() => {
    const onChange = (info: User) => {
      setState(info);
    };

    currentUser.onChange(onChange);

    return () => {
      currentUser.offChange(onChange);
    };
  });

  if (!currentUser.isInit) {
    currentUser.isInit = true;

    if (!currentUser.value) {
      routerControl.toLoggedIn();
    }
  }

  return state;
}

export function useLogin() {
  const xForm = useXForm<LoginData>('api/logged_in', 'post');

  useEffect(() => {
    if (xForm.success) {
      sendCommand('login', xForm.formData.login, xForm.formData.password);

      updateCurrentUser(xForm.respData as any);
      routerControl.toReturnUrl();
    }
  }, [xForm.success]);

  return xForm;
}

export function tryToLogin(login: string, password: string) {
  httpRequest<LoginData, any>('api/logged_in', 'post', { login, password }).then(resp => {
    if (resp.code == RespCode.OK) {
      updateCurrentUser(resp.data);
      routerControl.toReturnUrl();
    }
  });
}

export function useLoggedOut() {
  const { httpState, sendRequest } = useHttpRequest('api/logged_out', 'post');

  useEffect(() => {
    if (httpState.resp && httpState.resp.code === RespCode.OK) {
      updateCurrentUser(null);
      routerControl.toLoggedIn();
    }
  }, [httpState.resp]);

  return { loggingOut: httpState.loading, logOut: () => sendRequest(null) };
}

function updateCurrentUser(data: User) {
  currentUser.value = data;
}
