import * as React from 'react';
import { DataType } from '../../../models/commons.model';

interface InputProperty {
  dataType: DataType;
}

class BasicInput<T> extends React.PureComponent<InputProperty, T> {}
