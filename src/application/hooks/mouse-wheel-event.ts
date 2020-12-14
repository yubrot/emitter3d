import { PropRef, useCallback, useEffect } from 'preact/hooks';

export function useMouseWheelEvent(
  containerRef: PropRef<HTMLElement>,
  handler: (ev: WheelEvent) => void,
  inputs: ReadonlyArray<unknown>
): void {
  const callback = useCallback(handler, inputs);

  useEffect(() => {
    containerRef.current!.addEventListener('wheel', callback);

    return () => containerRef.current!.removeEventListener('wheel', callback);
  }, [callback]);
}
