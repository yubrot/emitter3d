import { h, RenderableProps } from 'preact';
import { useCallback, useState, useEffect } from 'preact/hooks';
import { StyleSheet, css } from 'aphrodite';

export type Props<T extends string> = {
  disabled?: boolean;
  options: T[];
  value: T;
  onChange(value: T): void;
};

export const Select = <T extends string>(props: RenderableProps<Props<T>>) => {
  const { disabled, options, value, onChange, children } = props;

  const [isOn, setIsOn] = useState(false);

  const handleChange = useCallback(() => {
    if (disabled) return;

    setIsOn(true);

    const i = options.findIndex(o => o == value);
    const next = options[(i + 1) % options.length];
    onChange(next);
  }, [disabled, options, value, onChange]);

  useEffect(() => {
    // Flip isOn to false immediately after the rendering caused by handleChange.
    // FIXME: What we really want to do is to apply selectors like `.container:active .current`
    if (isOn) setIsOn(false);
  }, [isOn]);

  return (
    <div
      className={css(styles.container, disabled ? styles.containerDisabled : styles.containerEnabled)}
      onClick={handleChange}
    >
      {children}
      <div className={css(styles.current, isOn && styles.currentChanged)}>
        {value}
      </div>
    </div>
  );
};

const styles = StyleSheet.create({
  container: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '2px 4px',
    transition: '0.2s',
    border: '1px solid rgba(255, 255, 255, 0)',
  },
  containerEnabled: {
    color: '#aaa',
    ':hover': {
      color: '#fff',
      background: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    ':active': {
      background: 'rgba(255, 255, 255, 0.3)',
      borderColor: 'rgba(255, 255, 255, 0.7)',
    },
  },
  containerDisabled: {
    color: 'rgba(255, 255, 255, 0.1)',
  },
  current: {
    padding: '0 8px',
    transition: 'background 0.5s',
    background: 'rgba(255, 255, 255, 0.05)',
  },
  currentChanged: {
    transition: 'background 0s',
    background: 'rgba(255, 255, 255, 0.5)',
  },
});
