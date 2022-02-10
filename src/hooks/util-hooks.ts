import { useLayoutEffect, useState, useRef, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import _ = require('lodash');
import { HttpMethod, ChangeableSubject } from '../models/system.model';
import { httpRequest } from '../http-client';

export function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}

export function useOnWindowReSizeCallback(updateValue: () => void, deps?: any[]) {
  useLayoutEffect(() => {
    window.addEventListener('resize', updateValue);
    updateValue();
    return () => window.removeEventListener('resize', updateValue);
  }, deps || []);
}

export function useOnWindowReSize<T>(updateValue: () => T, deps?: any[]) {
  const [value, setValue] = useState<T>(updateValue());
  useLayoutEffect(() => {
    function updateSize() {
      setValue(updateValue());
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, deps || []);
  return value;
}

export const useStickyTableLayout = hooks => {
  hooks.getHeaderProps.push((props, { column }) => [
    props,
    {
      style: {
        width: `${column.totalWidth}px`
      }
    }
  ]);

  hooks.getCellProps.push((props, { cell }) => [
    props,
    {
      style: {
        width: `${cell.column.totalWidth}px`
      }
    }
  ]);
};

useStickyTableLayout.pluginName = 'useStickyTableLayout';

export function useDeepEffect(fn, deps) {
  const isFirst = useRef(true);
  const prevDeps = useRef(deps);

  useEffect(() => {
    const isSame = prevDeps.current.every((obj, index) => _.isEqual(obj, deps[index]));

    if (isFirst.current || !isSame) {
      fn();
    }

    isFirst.current = false;
    prevDeps.current = deps;
  }, deps);
}

export function useStateRef<D>(initState: D) {
  const [state, setState] = useState<D>(initState);

  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  return [stateRef, setState];
}

export function useUpdateState<D>(initDtate: D): [D, (updatedProps: Partial<D>) => void, Dispatch<SetStateAction<D>>] {
  const [state, setState] = useState<D>(initDtate);

  const updateState = useCallback((updatedProps: Partial<D>) => {
    setState(originalState => _.defaults(updatedProps, originalState));
  }, []);

  return [state, updateState, setState];
}

export function useHttpRequestWithChangeableSubject<D>(url: string, method: HttpMethod, requestData: any, subject: ChangeableSubject<D>) {
  const [data, setData] = useState<D>(subject.value);

  if (!subject.isInit) {
    subject.isInit = true;
    httpRequest<any, D>(url, method, requestData).then(resp => {
      subject.value = resp.data;
    });
  }

  useEffect(() => {
    const onChange = val => setData(val);
    subject.onChange(onChange);
    return () => {
      subject.offChange(onChange);
    };
  }, []);

  return data;
}
