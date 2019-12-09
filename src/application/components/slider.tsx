import { h, FunctionalComponent } from 'preact';
import { useRef, useMemo } from 'preact/hooks';
import { useMouseDragEvent } from '../hooks';
import { StyleSheet, css } from 'aphrodite';

export type Props = {
  range: [number, number, number];
  disabled?: boolean;
  value: number;
  onChange(value: number): void;
  style?: any;
};

export const Slider: FunctionalComponent<Props> = props => {
  const { range: [min, max, step], disabled, value, onChange, style, children } = props;

  const sliderRef = useRef<HTMLDivElement>();

  const [sliderHover, sliderActive] = useMouseDragEvent(sliderRef, (ev: MouseEvent) => {
    if (disabled) return;
    const { left, width } = sliderRef.current!.getBoundingClientRect();
    const r = Math.min(1, Math.max(0, (ev.clientX - left) / width));
    onChange(min + step * Math.round(r * (max - min) / step));
  }, [min, max, step, disabled, onChange]);

  const width = useMemo(() => ((value - min) / (max - min) * 100) + '%', [value, min, max]);
  const number = useMemo(() => numberString(value, step), [value, step]);

  return (
    <div
      className={css(styles.slider, disabled ? styles.sliderDisabled : styles.sliderEnabled)}
      style={style}
      ref={sliderRef}
    >
      <div
        className={css(
          styles.sliderBody,
          !disabled && sliderHover && styles.sliderBodyHover,
          !disabled && sliderActive && styles.sliderBodyActive
        )}
        style={{ width }}
      />
      <div className={css(styles.sliderSurface)}>
        {children}
        <div className={css(styles.sliderNumber)}>
          {number}
        </div>
      </div>
    </div>
  );
};

export function numberString(value: number, step: number): string {
  let decimal = 0;
  while (step < 1) decimal += 1, step *= 10;
  let s = value < 0 ? "-" : "";
  let t = String(Math.round(Math.abs(value) * 10 ** decimal));
  let u = "";
  for (; decimal > 0; --decimal) {
    if (t.length > 1) {
      u = t.substr(t.length - 1) + u;
      t = t.substr(0, t.length - 1);
    } else {
      u = t + u;
      t = "0";
    }
  }
  return s + t + (u == "" ? "" : "." + u);
}

const styles = StyleSheet.create({
  slider: {
    position: 'relative',
    cursor: 'ew-resize',
    padding: '2px 4px',
    transition: '0.2s',
    border: '1px solid rgba(255, 255, 255, 0)',
  },
  sliderEnabled: {
    color: '#aaa',
    ':hover': {
      color: '#fff',
      background: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    ':active': {
      color: '#fff',
      background: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.7)',
    },
  },
  sliderDisabled: {
    color: 'rgba(255, 255, 255, 0.1)',
  },
  sliderBody: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    background: 'rgba(255, 255, 255, 0.1)',
    transition: '0.2s',
  },
  sliderBodyHover: {
    background: 'rgba(255, 255, 255, 0.3)',
    transitionProperty: 'background',
  },
  sliderBodyActive: {
    background: 'rgba(255, 255, 255, 0.7)',
    transitionProperty: 'background',
  },
  sliderSurface: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderNumber: {
    margin: '0 4px 0 12px',
  }
});
