import * as React from 'react';
import { Form, FormFieldProps, DropdownItemProps, Modal, Button, Dropdown } from 'semantic-ui-react';
import '../../assets/scss/components/commons/XForm.scss';
import { XFormControl, useXForm, InvalidErrorContent } from '../../hooks/form-hook';
import { DataType, ValueType } from '../../models/commons.model';
import _ = require('lodash');
import T from './T';
import { HttpMethod } from '../../models/system.model';
import { notificationControl } from '../../controls/notification-control';
import { httpRequest } from '../../http-client';
import classNames = require('classnames');
import xhelper from '../../helpers/xhelper';
import { XMultipleInput } from './forms/MultipleInput';

export interface InputTypeProperties {
  name: string;
  label?: any;
  placeholder?: string;
  value: any;
  dataType: DataType;
  options?: FormFieldProps;
  error?: any;
  onChange: (name: string, value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export interface InputFieldProperties {
  name: string;
  label?: string;
  placeholder?: string;
  dataType: DataType;
  validators?: XValidator | XValidator[];
  options?: FormFieldProps;
  xformcontrol: XFormControl<any>;
}

export type XValidator = (fieldValue, values) => InvalidErrorContent;

export const Validators = {
  required: fieldValue => (_.isNil(fieldValue) ? { message: 'required' } : null),
  notBlank: fieldValue => (_.isNil(fieldValue) || !fieldValue.trim() ? { message: 'notBlank' } : null),
  notEmpty: fieldValue => (_.isArray(fieldValue) && fieldValue.length === 0 ? { message: 'notBlank' } : null),
  email: fieldValue => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const valid = re.test(String(fieldValue).toLowerCase());
    return valid ? null : { message: 'email' };
  },
  minLength: (requiredLength: number) => {
    const validator: XValidator = fieldValue => {
      const actualLength = fieldValue.length;
      if (actualLength < requiredLength) {
        return {
          message: 'minLength',
          parameters: {
            actualLength: String(actualLength),
            requiredLength: String(requiredLength)
          }
        };
      }

      return null;
    };

    return validator;
  },
  maxLength: (requiredLength: number) => {
    const validator: XValidator = fieldValue => {
      const actualLength = fieldValue.length;
      if (actualLength > requiredLength) {
        return {
          message: 'maxLength',
          parameters: {
            actualLength: String(actualLength),
            requiredLength: String(requiredLength)
          }
        };
      }

      return null;
    };

    return validator;
  },
  min: (min: number) => {
    const validator: XValidator = fieldValue => {
      if (fieldValue < min) {
        return { message: 'min', parameters: { min: String(min), actual: String(fieldValue) } };
      }

      return null;
    };

    return validator;
  },
  max: (max: number) => {
    const validator: XValidator = fieldValue => {
      if (fieldValue > max) {
        return { message: 'min', parameters: { max: String(max), actual: String(fieldValue) } };
      }

      return null;
    };

    return validator;
  }
};

export interface XDialogFormProps<D> {
  open: boolean;
  title: any;
  url: string;
  method: HttpMethod;
  onClose: () => void;
  onSuccess: (data: D) => void;
  initFormData?: Partial<D>;
  validators?: XValidator | XValidator[];
}

export function XDialoyForm<D>(
  props: XDialogFormProps<D> & {
    children: (xForm: XFormControl<any>) => any;
  }
) {
  const xFormControl = useXForm<D>(props.url, props.method, (props.initFormData || {}) as any);

  xFormControl.formValidators = props.validators;

  React.useEffect(() => {
    if (xFormControl.success) {
      props.onSuccess(xFormControl.respData);
      xFormControl.resetHttp();
      xFormControl.updateData({} as D);
      notificationControl.showSuccess('saveSuccess');
    }
  }, [xFormControl.success, props.onSuccess]);

  return (
    <Modal open={props.open} closeOnEscape={false} closeOnDimmerClick={false}>
      <Modal.Header>{props.title}</Modal.Header>
      <Modal.Content>
        <Form loading={xFormControl.loading} onSubmit={xFormControl.submit}>
          {props.children(xFormControl)}
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button
          loading={xFormControl.loading}
          onClick={() => {
            xFormControl.reset();
            props.onClose();
          }}
        >
          <T>cancel</T>
        </Button>
        <Button loading={xFormControl.loading} onClick={xFormControl.submit} positive>
          <T>submit</T>
        </Button>
      </Modal.Actions>
    </Modal>
  );
}

export function XInput(props: InputTypeProperties) {
  const TypeInput = XInputMapping.get(props.dataType.valueType);

  return <TypeInput {...props} />;
}

export function XFormInput(props: InputFieldProperties) {
  const TypeInput = XInputMapping.get(props.dataType.valueType);
  props.xformcontrol.setFieldValidator(props.name, props.validators);

  const label = _.isNil(props.label) ? props.name : props.label;

  const required = isRequired(props);

  const error = props.xformcontrol.fieldError(props.name);
  return (
    <TypeInput
      {..._.omit(props, 'xformcontrol', 'label', 'options')}
      options={{
        ...props.options,
        required,
        onBlur: () => props.xformcontrol.fieldOnBlur(props.name),
        onFocus: () => props.xformcontrol.fieldOnFocus(props.name)
      }}
      label={
        label ? (
          <label>
            <T>{label}</T>
          </label>
        ) : null
      }
      placeholder={props.placeholder}
      value={props.xformcontrol.formData[props.name] || ''}
      onChange={(name, value) => props.xformcontrol.fieldChange(name, value)}
      error={error}
    />
  );
}

export function XFormField(props: InputFieldProperties) {
  const TypeInput = XInputMapping.get(props.dataType.valueType);

  props.xformcontrol.setFieldValidator(props.name, props.validators);

  const required = isRequired(props);

  const error = props.xformcontrol.fieldError(props.name);

  return (
    <TypeInput
      {..._.omit(props, 'xformcontrol', 'options')}
      options={{ ...props.options, required }}
      value={props.xformcontrol.formData[props.name] || ''}
      onChange={(name, value) => props.xformcontrol.fieldChange(name, value)}
      error={error}
    />
  );
}

const XInputMapping = new Map<ValueType, (props: InputTypeProperties) => any>();
XInputMapping.set(ValueType.Boolean, BooleanInput);
XInputMapping.set(ValueType.String, StringInput);
XInputMapping.set(ValueType.Integer, IntegerInput);
XInputMapping.set(ValueType.Long, IntegerInput);
XInputMapping.set(ValueType.Double, DoubleInput);
XInputMapping.set(ValueType.Decimal, DoubleInput);
XInputMapping.set(ValueType.Date, DateInput);
XInputMapping.set(ValueType.DateTime, DateTimeInput);
XInputMapping.set(ValueType.File, FileInput);

function BooleanInput(props: InputTypeProperties) {
  return (
    <Form.Checkbox
      className="boolean-input"
      placeholder={props.placeholder}
      label={props.label}
      name={props.name}
      checked={props.value || false}
      onChange={(e, data) => props.onChange(props.name, data.checked)}
      error={props.error}
      {...(props.options as any)}
    ></Form.Checkbox>
  );
}

function StringInput(props: InputTypeProperties) {
  return (
    <Form.Input
      type="text"
      label={props.label}
      placeholder={props.placeholder}
      name={props.name}
      value={props.value || ''}
      onChange={(e, data) => props.onChange(props.name, data.value)}
      {...props.options}
      error={props.error}
    ></Form.Input>
  );
}

function IntegerInput(props: InputTypeProperties) {
  let value;

  if (props.value === null || props.value === undefined) {
    value = '';
  } else {
    value = props.value;
  }

  if (props.dataType.isArray) {
    return <XMultipleInput {...props}></XMultipleInput>;
  }

  return (
    <Form.Input
      type="number"
      step="1"
      pattern="\d+"
      name={props.name}
      value={value}
      onChange={(e, data) => props.onChange(props.name, parseInt(data.value, 10) || 0)}
      label={props.label}
      placeholder={props.placeholder}
      {...props.options}
      error={props.error}
    ></Form.Input>
  );
}

function DoubleInput(props: InputTypeProperties) {
  let value;
  if (props.value === null || props.value === undefined) {
    value = '';
  } else {
    value = props.value;
  }

  return (
    <Form.Input
      type="number"
      name={props.name}
      value={value}
      onChange={(e, data) => props.onChange(props.name, parseFloat(data.value) || 0)}
      label={props.label}
      placeholder={props.placeholder}
      {...props.options}
      error={props.error}
    ></Form.Input>
  );
}

function DateInput(props: InputTypeProperties) {
  const value = props.value ? props.value.split('T')[0] : '';
  return (
    <Form.Input
      type="date"
      name={props.name}
      value={value}
      onChange={e => props.onChange(props.name, e.target.value ? e.target.valueAsDate.toISOString().split('T')[0] : null)}
      label={props.label}
      placeholder={props.placeholder}
      {...props.options}
      error={props.error}
    ></Form.Input>
  );
}

function DateTimeInput(props: InputTypeProperties) {
  const value = props.value ? props.value.split('.')[0] : '';
  return (
    <Form.Input
      type="datetime-local"
      name={props.name}
      value={value}
      onChange={e => props.onChange(props.name, e.target.value ? e.target.valueAsDate.toISOString().split('.')[0] : null)}
      label={props.label}
      placeholder={props.placeholder}
      {...props.options}
      error={props.error}
    ></Form.Input>
  );
}

function EnumInput(props: InputTypeProperties) {
  const options: DropdownItemProps[] = props.dataType.enumValues.map((value, i) => ({
    text: props.dataType.enumTexts[i],
    value
  }));

  return (
    <Form.Select
      options={options}
      value={props.value}
      onChange={(e, data) => props.onChange(props.name, data.value)}
      label={props.label}
      placeholder={props.placeholder}
      {...props.options}
      multiple={props.dataType.isArray || false}
      error={props.error}
    ></Form.Select>
  );
}

function FileInput(props: InputTypeProperties) {
  // TODO

  return <Form.Input type="file" name={props.name}></Form.Input>;
}

function isRequired(props: InputFieldProperties) {
  if (props.validators) {
    if (_.isArray(props.validators)) {
      if (props.validators.includes(Validators.required) || props.validators.includes(Validators.notBlank)) {
        return true;
      }
    } else {
      if (props.validators === Validators.required || props.validators === Validators.notBlank) {
        return true;
      }
    }
  }
  return false;
}

function XMultipleInput2(props: InputTypeProperties & { inputType: any }) {
  const [options, setOptions] = React.useState([]);

  React.useEffect(() => {
    setOptions((props.value || []).map(v => ({ text: v, value: v })));
  }, [props.value]);

  return (
    <Form.Field
      {..._.omit(props, 'inputType', 'options', 'name', 'onChange')}
      {...props.options}
      control={Dropdown}
      options={options}
      search
      selection
      allowAdditions
      multiple
      searchInput={props.inputType}
      onAddItem={(e, data) => setOptions(originalValue => [...originalValue, { text: data.value, value: data.value }])}
      onChange={(e, data) => {
        setOptions((data.value as any[]).map(v => ({ text: v, value: v })));
        props.onChange(props.name, data.value);
      }}
      noResultsMessage=""
    ></Form.Field>
  );
}

function XSearchInput(props: InputTypeProperties & { url: string; method: HttpMethod }) {
  const [config, setConfig] = React.useState<{
    loading: boolean;
    options: { text: any; value: any }[];
  }>({ loading: false, options: [] });

  return (
    <Dropdown
      options={config.options}
      loading={config.loading}
      placeholder={props.placeholder || props.label}
      search
      selection
      multiple={props.dataType.isArray || false}
      value={props.value}
      onChange={(e, data) => {
        props.onChange(props.name, data.value);
      }}
      onSearchChange={React.useCallback(
        _.debounce(
          (e, data) => {
            setConfig(originalConfig => ({ ...originalConfig, loading: true }));
            let selectedValues = null;
            if (props.value) {
              if (!_.isArray(props.value)) {
                selectedValues = [props.value];
              } else {
                selectedValues = props.value;
              }
            }
            httpRequest<any, any>(props.url, props.method, { q: data.searchQuery, selectedValues })
              .then(resp => {
                setConfig(originalConfig => ({ options: resp.data, loading: false }));
              })
              .catch(e => {
                setConfig(originalConfig => ({ ...originalConfig, loading: false }));
              });
          },
          500,
          { leading: true }
        ),
        []
      )}
      noResultsMessage=""
    />
  );
}

function XSearchTreeInput(props: InputTypeProperties & { url: string; method: HttpMethod }) {
  const [config, setConfig] = React.useState<{
    loading: boolean;
    options: { text: any; value: any }[];
  }>({ loading: false, options: [] });

  return (
    <Dropdown
      options={config.options}
      loading={config.loading}
      placeholder={props.placeholder || props.label}
      search
      selection
      multiple={props.dataType.isArray || false}
      value={props.value}
      onChange={(e, data) => {
        props.onChange(props.name, data.value);
      }}
      onSearchChange={React.useCallback(
        _.debounce(
          (e, data) => {
            setConfig(originalConfig => ({ ...originalConfig, loading: true }));
            let selectedValues = null;
            if (props.value) {
              if (!_.isArray(props.value)) {
                selectedValues = [props.value];
              } else {
                selectedValues = props.value;
              }
            }
            httpRequest<any, any>(props.url, props.method, { q: data.searchQuery, selectedValues })
              .then(resp => {
                setConfig(originalConfig => ({ options: resp.data, loading: false }));
              })
              .catch(e => {
                setConfig(originalConfig => ({ ...originalConfig, loading: false }));
              });
          },
          500,
          { leading: true }
        ),
        []
      )}
      noResultsMessage=""
    />
  );
}

export function generateInputProperties(dataType: DataType) {
  const props = {} as any;
  switch (dataType.valueType) {
    case ValueType.String:
      props.type = 'text';
      break;
    case ValueType.Integer:
    case ValueType.Long:
      props.type = 'number';
      props.step = 0;
      break;
    case ValueType.Double:
    case ValueType.Decimal:
      props.type = 'number';
      break;
    case ValueType.Date:
      props.type = 'date';
      break;
    case ValueType.DateTime:
      props.type = 'datetime-local';
      props.step = 1800;
      break;
  }

  return props;
}

export function convertInputValue(valueType: ValueType, originalValue) {
  switch (valueType) {
    case ValueType.Date:
      return originalValue ? originalValue.split('T')[0] : '';
    case ValueType.DateTime:
      return originalValue ? originalValue.split('.')[0] : '';
  }

  return originalValue;
}

export function parseInputValue(input: HTMLInputElement, valueType: ValueType) {
  switch (valueType) {
    case ValueType.Boolean:
      return input.checked;
    case ValueType.String:
      return input.value;
    case ValueType.Integer:
    case ValueType.Long:
      return parseInt(input.value);
    case ValueType.Double:
    case ValueType.Decimal:
      return parseFloat(input.value);
    case ValueType.Date:
      return input.value ? input.valueAsDate.toISOString().split('T')[0] : null;
    case ValueType.DateTime:
      return input.value ? input.valueAsDate.toISOString().split('.')[0] : null;
  }
}
