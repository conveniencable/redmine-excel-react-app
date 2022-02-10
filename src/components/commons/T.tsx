import * as React from 'react';
import * as _ from 'lodash';

const LANG = (window as any)['RX__LANG'] || {};

export default function T(props: { message?: string; parameters?: { [key: string]: string } | string; children?: string }) {
  const key = props.message || props.children;

  return <>{LANG[key] || key}</>;
}

export function translate(key: string) {
  return LANG[key] || key;
}
