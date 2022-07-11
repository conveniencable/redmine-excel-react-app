import _ = require('lodash');
import { QueryFilter, QueryValue } from '../models/query.model';

export function sendCommand(command: string, ...data: any) {
  const anywin = window as any;
  if (anywin.chrome.webview && anywin.chrome.webview.postMessage) {
    anywin.chrome.webview.postMessage(JSON.stringify([command, ...data.map(d => JSON.stringify(d))]));
  } else {
    console.log('send command', command, data);
  }
}

export function isEmptyOperatorValue(filter: QueryFilter) {
  if (!filter.values) {
    return true;
  }
  if (filter.operator == '><') {
    return !filter.values[0] || !filter.values[1];
  }

  return filter.values.filter(v => !!v).length === 0;
}

const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function getColumnName(num: number) {
  if (num < 26) return alpha[num - 1];
  else {
    const q = Math.floor(num / 26);
    const r = num % 26;
    if (r == 0) {
      if (q == 1) return alpha[26 + r - 1];
      else return getColumnName(q - 1) + alpha[26 + r - 1];
    } else return getColumnName(q) + alpha[r - 1];
  }
}

export function getColumnNameNumber(name: string) {
  if (!name) {
    return 0;
  }

  name = name.toUpperCase();
  let result = 0;
  const aCode = 'A'.charCodeAt(0);
  for (let i = 0; i < name.length; i++) {
    result *= 26;
    result += name[i].charCodeAt(0) - aCode + 1;
  }
  return result;
}

export function correctQueryValue(query: QueryValue) {
  if (!query.query.startRow) {
    query.query.startRow = 1;
  }

  if (!query.query.columns.includes('id')) {
    query.query.columns.unshift('id');
  }

  if (!query.query.columnPositions || query.query.columnPositions.length !== query.query.columns.length) {
    query.query.columnPositions = query.query.columns.map((c, i) => i + 1);
  }

  return query;
}
