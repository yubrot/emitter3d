import { useRef, useCallback, useEffect } from 'preact/hooks';

export function useTimeout(inputs: ReadonlyArray<unknown>): (handler: () => void, delay: number) => void {
  const timeoutIdRef = useRef(0);

  useEffect(() => () => clearTimeout(timeoutIdRef.current), inputs);

  return useCallback((handler: () => void, delay: number) => {
    clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = window.setTimeout(handler, delay);
  }, []);
}
