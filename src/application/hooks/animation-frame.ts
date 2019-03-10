import { useRef, useEffect } from 'preact/hooks';

export function useAnimationFrame(onUpdate: (deltaTime: number) => void): void {
  const timeRef = useRef(0);
  const requestRef = useRef(0);
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    function update(): void {
      const now = performance.now();
      const deltaTime = now - timeRef.current;
      callbackRef.current(deltaTime / 1000);
      timeRef.current = now;
      requestRef.current = requestAnimationFrame(update);
    }

    timeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(update);

    return () => cancelAnimationFrame(requestRef.current);
  }, []);
}
