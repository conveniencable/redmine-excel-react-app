import { QueryFilter } from "../models/query.model";

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
