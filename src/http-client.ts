import Axios, { AxiosRequestConfig } from 'axios';
import * as qs from 'qs';
import { useState, useCallback } from 'react';

import { Resp, RespCode, HttpMethod } from './models/system.model';
import { routerControl } from './controls/route-control';
import { notificationControl } from './controls/notification-control';
import xhelper from './helpers/xhelper';

export interface HttpRequestState<T> {
  isStarted: boolean;
  success: boolean;
  loading: boolean;
  resp: Resp<T>;
}

class AccessToken {
  private readonly ACCESS_TOKEN_STORE_KEY = 'youcannotseeme';
  private _token: string;
  public clear() {
    this._token = null;
    localStorage.removeItem(this.ACCESS_TOKEN_STORE_KEY);
  }

  public update(token: string) {
    this._token = token;
    localStorage.setItem(this.ACCESS_TOKEN_STORE_KEY, token);
  }

  public get token() {
    if (!this._token) {
      this._token = localStorage.getItem(this.ACCESS_TOKEN_STORE_KEY);
    }

    return this._token;
  }
}

export const AUTH_HEADER_KEY = 'auth-token';

export const axios = Axios.create({
  baseURL: ``
});

axios.interceptors.request.use(config => {
  config.headers.common[AUTH_HEADER_KEY] = accessToken.token;

  return config;
});

export const accessToken = new AccessToken();

export function httpRequest<D, R>(url: string, method: HttpMethod, data: D = null, prefix = '/redmine_excel_connector/'): Promise<Resp<R>> {
  const { promise: result, resolve, reject } = xhelper.createPromise<Resp<R>>();

  const reqParams: AxiosRequestConfig = {
    url: prefix + url,
    method
  };

  if (method === 'get' || method === 'delete') {
    reqParams.params = data;
    reqParams.paramsSerializer = params => {
      return qs.stringify(params, { arrayFormat: 'brackets' });
    };
  } else {
    reqParams.data = data;
  }

  axios
    .request<Resp<R>>(reqParams)
    .then(response => {
      const resp = response.data;
      if (resp && resp.code !== null && resp.code !== undefined) {
        switch (resp.code) {
          case RespCode.OK:
            break;
          case RespCode.Invalid:
            break;
          case RespCode.AuthError:
            accessToken.clear();
            routerControl.toLoggedIn();

            reject(resp);
            return;
          case RespCode.MustChangePassword:
            routerControl.toChangePassword();

            reject(resp);
            return;
          case RespCode.NoPrivilege:
            notificationControl.showError('No Privilege');

            reject(resp);
            return;
          case RespCode.BusinessError:
            notificationControl.showError('Business Error', {
              message: resp.message
            });

            reject(resp);
            return;
          case RespCode.UnknownError:
            notificationControl.showError('System Error', {
              message: resp.message
            });

            reject(resp);
            return;
          case RespCode.NotFound:
            notificationControl.showError('Not Found');

            reject(resp);
            return;
          default:
            notificationControl.showError('Unknown Error', {
              message: resp.message
            });
            reject(resp);
            return;
        }

        resolve(resp);
      } else {
        notificationControl.showError('httpError');
        reject(resp);
      }
    })
    .catch(xhr => {
      if (xhr && xhr.response) {
        const message = xhr.response.statusText;

        notificationControl.showError(xhr.response.status === 504 ? 'Network Error' : 'Unknown Error', {
          message
        });
      } else {
        notificationControl.showError('Unknown Error', {
          message: xhr
        });
      }

      reject(xhr);
    });

  return result;
}

export function useHttpRequest<D, R>(
  url: string,
  method: HttpMethod,
  prefix = '/redmine_excel_connector/'
): { httpState: HttpRequestState<R>; sendRequest: (data: D) => void; reset: () => void } {
  const [httpState, setHttpState] = useState<HttpRequestState<R>>({
    isStarted: false,
    success: false,
    loading: false,
    resp: null
  });

  const sendRequest = useCallback(
    (data: D) => {
      setHttpState(originalState => ({ ...originalState, isStarted: true, loading: true }));
      httpRequest<D, R>(url, method, data, prefix).then(
        resp => {
          setHttpState(originalState => ({ ...originalState, resp, success: true, loading: false }));
        },
        () => {
          setHttpState(originalState => ({ ...originalState, loading: false }));
        }
      );
    },
    [url, method]
  );

  const reset = useCallback(() => {
    setHttpState(originalState => ({ ...originalState, loading: false, success: false, isStarted: false, resp: null }));
  }, [url, method]);

  return { httpState, sendRequest, reset };
}
