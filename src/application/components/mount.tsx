import { h, FunctionalComponent, RefObject } from 'preact';
import { useRef, useEffect } from 'preact/hooks';

export type Props = {
  dom: HTMLElement;
  containerRef?: RefObject<HTMLDivElement>;
  className?: string;
  style?: any;
};

export const Mount: FunctionalComponent<Props> = props => {
  const { dom, className, style } = props;
  const container = props.containerRef || useRef<HTMLDivElement>(null);

  useEffect(() => {
    container.current!.appendChild(dom);
    return () => container.current!.removeChild(dom);
  }, []);

  return <div className={className || ''} style={style || {}} ref={container} />;
};
