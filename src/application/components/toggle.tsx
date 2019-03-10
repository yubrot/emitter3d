import { h, FunctionalComponent } from 'preact';
import { useCallback } from 'preact/hooks';
import { StyleSheet, css } from 'aphrodite';

export type Props = {
  disabled?: boolean;
  value: boolean;
  onChange(value: boolean): void;
  style?: any;
};

export const Toggle: FunctionalComponent<Props> = props => {
  const { disabled, value, onChange, style, children } = props;

  const handleClick = useCallback(() => !disabled && onChange(!value), [disabled, value, onChange]);

  return (
    <div
      class={css(
        styles.normal,
        disabled ? styles.disabled : styles.enabled,
        value && (disabled ? styles.disabledChecked : styles.enabledChecked)
      )}
      style={style}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

const styles = StyleSheet.create({
  normal: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '2px 4px',
    transition: '0.2s',
    border: '1px solid rgba(255, 255, 255, 0)',
    ':after': {
      content: '""',
      display: 'block',
      width: '7px',
      height: '7px',
      margin: '0 4px 0 12px',
      transform: 'rotate(45deg)',
      transition: '0.2s',
    },
  },
  enabled: {
    color: '#aaa',
    ':hover': {
      background: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    ':active': {
      background: 'rgba(255, 255, 255, 0.3)',
      borderColor: 'rgba(255, 255, 255, 0.7)',
    },
    ':after': {
      border: '1px solid #555',
    },
    ':hover:after': {
      borderColor: '#aaa',
    },
    ':active:after': {
      borderColor: '#fff',
    },
  },
  enabledChecked: {
    ':after': {
      borderColor: '#aaa',
      background: 'rgba(255, 255, 255, 0.3)',
    },
    ':hover:after': {
      borderColor: '#fff',
      background: '#aaa',
    },
    ':active:after': {
      borderColor: '#aaa',
    },
  },
  disabled: {
    color: 'rgba(255, 255, 255, 0.1)',
    ':after': {
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
  },
  disabledChecked: {
    ':after': {
      borderColor: 'rgba(255, 255, 255, 0.3)',
      background: 'rgba(255, 255, 255, 0.1)',
    },
  },
});
