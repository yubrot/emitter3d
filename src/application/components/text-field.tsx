import { h, FunctionalComponent } from 'preact';
import { useCallback } from 'preact/hooks';
import { StyleSheet, css } from 'aphrodite';

export type Props = {
  value: string;
  onChange(value: string): void;
  multiline?: boolean;
  style?: any;
};

export const TextField: FunctionalComponent<Props> = props => {
  const { value, onChange, multiline, style } = props;

  const handleChange = useCallback((ev: Event) => onChange((ev.target as any).value), [onChange]);

  return multiline ? (
    <textarea
      className={css(styles.normal, styles.multiline)}
      style={style}
      value={value}
      onInput={handleChange}
    />
  ) : (
    <input
      type="text"
      className={css(styles.normal)}
      style={style}
      value={value}
      onInput={handleChange}
    />
  );
};

const styles = StyleSheet.create({
  normal: {
    background: 'none',
    margin: '0 3px',
    borderStyle: 'solid',
    borderWidth: '0 0 1px',
    borderColor: '#555',
    color: '#fff',
    fontSize: '16px',
    fontFamily: 'monospace',
    transition: 'border 0.2s',
    ':hover': {
      borderColor: '#aaa',
    },
  },
  multiline: {
    borderWidth: '1px',
    background: 'rgba(0, 0, 0, 0.4)',
    padding: '5px',
  },
});
