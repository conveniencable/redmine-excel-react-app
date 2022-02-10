export interface DataType {
  valueType: ValueType;
  isArray?: boolean;
  enumName?: string;
  enumValues?: any[];
  enumTexts?: string[];
}

export enum ValueType {
  Boolean = 'Boolean',
  String = 'String',
  Integer = 'Integer',
  Long = 'Long',
  Double = 'Double',
  Decimal = 'Decimal',
  Date = 'Date',
  DateTime = 'DateTime',
  File = 'File'
}

export const CompatibleValueTypes: { [ValueTypeName: string]: ValueType[] } = {
  Decimal: [ValueType.Long, ValueType.Integer, ValueType.Double],
  Double: [ValueType.Long, ValueType.Integer],
  Long: [ValueType.Integer],
  DateTime: [ValueType.Date]
};

export interface IdName {
  id: number;
  name: string;
}
