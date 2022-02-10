export interface Resp<D> {
  code: RespCode;
  message: string;
  data: D;
}

export interface Page<D> {
  pageIndex: number;
  pageSize: number;
  length: number;
  content: D[];
}

export enum RespCode {
  OK = 0,
  AuthError = 100,
  MustChangePassword = 200,
  NoPrivilege = 300,
  NotFound = 400,
  Invalid = 500,
  BusinessError = 600,
  UnknownError = 700
}

export const SERVER_INVALID_KEY = 'serverInvalid';

export interface Invalid {
  name?: string;
  message: string;
  params: { [name: string]: any };
}

export class ChangeableSubject<T> {
  private _value: T;
  private onChanges = [];
  public isInit = false;

  constructor(value: T) {
    this._value = value;
  }

  public get value(): T {
    return this._value;
  }

  public set value(v: T) {
    this._value = v;

    for (const oc of this.onChanges) {
      oc(v);
    }
  }

  public onChange(onChange: (value: T) => void, fireImmediately = false) {
    this.onChanges.push(onChange);

    if (fireImmediately) {
      onChange(this._value);
    }
  }

  public offChange(onChange: (value: T) => void) {
    const index = this.onChanges.indexOf(onChange);
    if (index !== -1) {
      this.onChanges.splice(index, 1);
    }
  }
}

export type HttpMethod = 'get' | 'delete' | 'post' | 'put' | 'patch';
