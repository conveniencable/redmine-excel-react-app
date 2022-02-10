import { XTableColumn } from '../components/commons/XTable';
import { ValueType } from '../models/commons.model';
import _ = require('lodash');

class XHelper {
  public createPromise<V>() {
    let resolve: (value: V | PromiseLike<V>) => void;
    let reject: (reason: any) => void;

    const promise = new Promise<V>((rs, rj) => {
      resolve = rs;
      reject = rj;
    });

    return { promise, resolve, reject };
  }

  public createXColumn(
    title: string,
    valueType: ValueType,
    fieldName?: string,
    formater?: (rows, index: number) => any,
    enumName?: string,
    enumValues?: any,
    enumTexts?: string[]
  ): XTableColumn {
    return {
      title,
      fieldName: fieldName || (title as string),
      dataType: {
        valueType,
        enumName,
        enumValues: generateEnumValues(enumValues),
        enumTexts,
        isArray: false
      },
      formater
    };
  }

  public dataType(valueType: ValueType, enumName?: string, enumValues?: any, enumTexts?: string[]) {
    return {
      valueType,
      enumName,
      enumValues: generateEnumValues(enumValues),
      enumTexts,
      isArray: false
    };
  }

  public reorder(list, startIndex, endIndex) {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
  }
}

function generateEnumValues(enumValues) {
  return enumValues ? (_.isArray(enumValues) ? enumValues : Object.keys(enumValues).filter((v, i) => parseInt(v, 10) !== i)) : enumValues;
}

const xhelper = new XHelper();

export default xhelper;
