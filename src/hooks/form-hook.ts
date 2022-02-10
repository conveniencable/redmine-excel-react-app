import { HttpMethod, RespCode, Invalid } from '../models/system.model';
import { HttpRequestState, useHttpRequest } from '../http-client';
import { useState, useEffect, useRef } from 'react';
import { useDeepEffect } from './util-hooks';
import _ = require('lodash');
import { XValidator, Validators } from '../components/commons/XForm';

export type InvalidErrorContent = {
  message?: string;
  parameters?: { [key: string]: string };
};
export type FieldsInvalidErrors = { [fieldName: string]: InvalidErrorContent };

export class XFormControl<D> {
  formData: D;
  setFormData: (data: D) => void;

  private send: (data: D) => void;
  resetHttp: () => void;

  formValidators: XValidator | XValidator[];
  formErrors: InvalidErrorContent[];
  setFormErrors: React.Dispatch<React.SetStateAction<InvalidErrorContent[]>>;

  fieldsValidators: { [fieldName: string]: XValidator | XValidator[] } = {};
  fieldsErrors: FieldsInvalidErrors;
  setFieldsErrors: React.Dispatch<React.SetStateAction<FieldsInvalidErrors>>;

  private httpRequestState: HttpRequestState<D>;

  init(
    formData: D,
    setFormData: React.Dispatch<React.SetStateAction<D>>,
    sendRequest: (data: D) => void,
    httpRequestState: HttpRequestState<D>,
    resetHttp: () => void,
    formErrors: InvalidErrorContent[],
    setFormErrors: React.Dispatch<React.SetStateAction<InvalidErrorContent[]>>,
    fieldsErrors: FieldsInvalidErrors,
    setFieldsErrors: React.Dispatch<React.SetStateAction<FieldsInvalidErrors>>
  ) {
    this.formData = formData;
    this.setFormData = setFormData;

    this.send = sendRequest;
    this.httpRequestState = httpRequestState;
    this.resetHttp = resetHttp;

    this.submit = this.submit.bind(this);
    this.fieldChange = this.fieldChange.bind(this);

    this.formErrors = formErrors;
    this.setFormErrors = setFormErrors;

    this.fieldsErrors = fieldsErrors;
    this.setFieldsErrors = setFieldsErrors;
  }

  setFieldValidator(fieldName: string, validators: XValidator | XValidator[]) {
    this.fieldsValidators[fieldName] = validators;
  }

  fieldChange(name, value) {
    this.setFormData({ ...this.formData, [name]: value });
  }

  fieldOnBlur(name) {
    const error = this.validateField(name, this.formData[name]);

    this.setFieldsErrors(errors => ({ ...errors, [name]: error }));
  }

  fieldOnFocus(name) {
    this.setFieldsErrors(errors => ({ ...errors, [name]: null }));
  }

  public submit(e, mapper?: (data: D) => any) {
    e && e.preventDefault();

    const tempFormErrors = [];
    const tempFieldsErrors = {};
    if (this.formValidators) {
      let validators: XValidator[];
      if (_.isArray(this.formValidators)) {
        validators = validators;
      } else {
        validators = [this.formValidators];
      }

      for (const v of validators) {
        const result = v(null, this.formData);
        if (result) {
          tempFormErrors.push(result);
        }
      }

      if (!_.isEqual(this.formErrors, tempFormErrors)) {
        this.setFormErrors(tempFormErrors);
      }
    }

    for (const fieldName of Object.keys(this.fieldsValidators)) {
      const error = this.validateField(fieldName, this.formData[fieldName]);
      if (error) {
        tempFieldsErrors[fieldName] = error;
      }
    }

    if (_.isEmpty(tempFormErrors) && _.isEmpty(tempFieldsErrors)) {
      this.send(mapper && _.isFunction(mapper) ? mapper(this.formData) : this.formData);
    } else {
      this.setFormErrors(tempFormErrors);
      this.setFieldsErrors(tempFieldsErrors);
    }
  }

  public updateData(formData: D) {
    this.setFormData(formData);
  }

  public fieldError(fieldName: string) {
    if (this.fieldsErrors && this.fieldsErrors[fieldName]) {
      const error = this.fieldsErrors[fieldName];
      if (error) {
        return {
          pointing: 'below',
          content: error.message
        };
      }
    } else {
      return null;
    }
  }

  public reset() {
    this.resetHttp();
    this.setFormErrors(null);
    this.setFieldsErrors(null);
    this.fieldsValidators = {};
    this.formValidators = null;
  }

  get loading() {
    return this.httpRequestState.loading;
  }

  get success() {
    return this.httpRequestState.success && this.httpRequestState.resp.code === RespCode.OK;
  }

  get respData() {
    return this.httpRequestState.resp.data;
  }

  private validateField(name: string, value: any) {
    let validators = this.fieldsValidators[name];
    let error = null;
    if (validators) {
      if (!_.isArray(validators)) {
        validators = [validators];
      }

      for (const validator of validators) {
        if (!_.isNil(value) || validator === Validators.required || validator === Validators.notBlank) {
          const result = validator(value, this.formData);
          if (result) {
            error = result;
            break;
          }
        }
      }
    }

    return error;
  }
}

export function useXForm<D>(url, method: HttpMethod, initFormData: Partial<D> = {}): XFormControl<D> {
  const [formData, setFormData] = useState<D>(initFormData as any);
  const [formErrors, setFormErrors] = useState<InvalidErrorContent[]>([]);
  const [fieldsErrors, setFieldsErrors] = useState<FieldsInvalidErrors>({});

  useDeepEffect(() => {
    if (!_.isEqual(initFormData, formData)) {
      setFormData(initFormData as any);
    }
  }, [initFormData]);

  const xFormControlRef = useRef(new XFormControl<D>());

  const { httpState, sendRequest, reset } = useHttpRequest<D, D>(url, method);

  const httpStateRef = useRef(null);
  httpStateRef.current = httpState;

  useDeepEffect(() => {
    if (httpStateRef.current.resp) {
      const tempFieldsErrors: FieldsInvalidErrors = {};
      const tempFormErrors: InvalidErrorContent[] = [];

      if (httpStateRef.current.resp.code === RespCode.Invalid) {
        for (const inv of (httpStateRef.current.resp.data as any) as Invalid[]) {
          const error: InvalidErrorContent = {
            message: inv.message,
            parameters: inv.params
          };

          if (inv.name) {
            tempFieldsErrors[inv.name] = error;
          } else {
            tempFormErrors.push(error);
          }
        }
      }

      setFormErrors(tempFormErrors);
      setFieldsErrors(tempFieldsErrors);
    }
  }, [httpState.resp && httpState.resp.code]);

  xFormControlRef.current.init(formData, setFormData, sendRequest, httpState, reset, formErrors, setFormErrors, fieldsErrors, setFieldsErrors);

  return xFormControlRef.current;
}
