import { PropRef, useCallback, useEffect, useState } from 'preact/hooks';

export function useMouseDragEvent(containerRef: PropRef<HTMLElement>, handler: (ev: MouseEvent) => void, inputs: ReadonlyArray<unknown>): [boolean, boolean] {
  const callback = useCallback(handler, inputs);
  const [isActive, setIsActive] = useState(false);
  const [isHover, setIsHover] = useState(false);

  useEffect(() => {
    function handleSliderMoveStart(ev: MouseEvent): void {
      document.addEventListener('mousemove', handleSliderMove);
      document.addEventListener('mouseup', handleSliderMoveEnd);
      setIsActive(true);
      callback(ev);
    }

    function handleSliderMove(ev: MouseEvent): void {
      callback(ev);
    }

    function handleSliderMoveEnd(ev: MouseEvent): void {
      document.removeEventListener('mousemove', handleSliderMove);
      document.removeEventListener('mouseup', handleSliderMoveEnd);
      setIsActive(false);
    }

    function handleMouseEnter(): void {
      setIsHover(true);
    }

    function handleMouseLeave(): void {
      setIsHover(false);
    }

    containerRef.current!.addEventListener('mousedown', handleSliderMoveStart);
    containerRef.current!.addEventListener('mouseenter', handleMouseEnter);
    containerRef.current!.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleSliderMove);
      document.removeEventListener('mouseup', handleSliderMoveEnd);
      containerRef.current!.removeEventListener('mousedown', handleSliderMoveStart);
      containerRef.current!.removeEventListener('mouseenter', handleMouseEnter);
      containerRef.current!.removeEventListener('mouseleave', handleMouseLeave);
      setIsHover(false);
      setIsActive(false);
    };
  }, [callback]);

  return [isHover, isActive];
}
