import { h, FunctionalComponent } from 'preact';
import { useCallback } from 'preact/hooks';
import { StyleSheet, css } from 'aphrodite';

export type Props = {
  disabled?: boolean;
  onClick(): void;
};

export const Button: FunctionalComponent<Props> = props => {
  const { disabled, onClick, children } = props;

  const handleClick = useCallback(() => !disabled && onClick(), [disabled, onClick]);

  return (
    <button
      className={css(styles.normal, disabled ? styles.disabled : styles.enabled)}
      disabled={disabled}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

const styles = StyleSheet.create({
  normal: {
    cursor: 'pointer',
    margin: '2px',
    padding: '3px 6px',
    border: 'none',
    transition: '0.2s',
  },
  enabled: {
    color: '#fff',
    background: 'rgba(255, 255, 255, 0.1)',
    ':hover': {
      background: 'rgba(255, 255, 255, 0.3)',
    },
    ':active': {
      background: 'rgba(255, 255, 255, 0.7)',
    },
  },
  disabled: {
    color: '#999',
    background: 'rgba(100, 100, 100, 0.1)',
  },
});
