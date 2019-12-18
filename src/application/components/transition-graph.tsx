import { h, Fragment, FunctionalComponent } from 'preact';
import { useCallback } from 'preact/hooks';
import { StyleSheet, css } from 'aphrodite';
import { Slider } from './slider';
import { Transition, compileTransition } from '../effects/store';

export type Props = {
  disabled?: boolean;
  value: Transition;
  onChange(value: Transition): void;
};

export const TransitionGraph: FunctionalComponent<Props> = props => {
  const { disabled, value, onChange, children } = props;
  const { init, center, exponent } = value;

  const initChange = useCallback((init: number) => onChange({ init, center, exponent }), [center, exponent, onChange]);
  const centerChange = useCallback((center: number) => onChange({ init, center, exponent }), [init, exponent, onChange]);
  const exponentChange = useCallback((exponent: number) => onChange({ init, center, exponent }), [init, center, onChange]);

  const f = compileTransition(value);
  const command = 'M 0 100 ' + Array(101)
    .fill(0)
    .map((_, i) => `L ${i} ${100 - Math.floor(f(i / 100) * 100)}`)
    .join(' ');

  return (
    <div className={css(styles.container, disabled ? styles.containerDisabled : styles.containerEnabled)}>
      <div className={css(styles.header)}>{children}</div>
      <div className={css(styles.body)}>
        <div className={css(styles.parameters)}>
          <Slider disabled={disabled} range={[0, 1, 0.02]} value={init} onChange={initChange}>
            init
          </Slider>
          <Slider disabled={disabled} range={[0, 1, 0.02]} value={center} onChange={centerChange}>
            center
          </Slider>
          <Slider disabled={disabled} range={[-3, 3, 0.1]} value={exponent} onChange={exponentChange}>
            exponent
          </Slider>
        </div>
        <svg width="1" height="1" viewBox="0 0 100 100" className={css(styles.preview, !disabled && styles.previewEnabled)}>
          <path d={command} />
        </svg>
      </div>
    </div>
  );
};

const styles = StyleSheet.create({
  container: {
    transition: '0.2s',
    border: '1px solid rgba(255, 255, 255, 0)',
  },
  containerEnabled: {
    color: '#aaa',
    ':hover': {
      color: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
  },
  containerDisabled: {
    color: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    padding: '2px 4px',
  },
  body: {
    display: 'flex',
  },
  parameters: {
    margin: '2px',
    fontSize: '10px',
    flex: '3 1',
  },
  preview: {
    margin: '2px',
    flex: '1 1',
    height: 'auto',
    stroke: 'rgba(255, 255, 255, 0.1)',
    strokeWidth: '3px',
    fill: 'rgba(255, 255, 255, 0.05)',
  },
  previewEnabled: {
    stroke: 'rgba(255, 255, 255, 0.4)',
    fill: 'rgba(255, 255, 255, 0.1)',
  }
});
