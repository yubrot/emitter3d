import { h, FunctionalComponent } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import { StyleSheet, css } from 'aphrodite';
import { Button } from './button';

export type Props = {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  width?: string;
  height?: string;
};

export const Window: FunctionalComponent<Props> = props => {
  const { children, width, height, top, bottom, left, right } = props;

  const flexDirection = top ? 'column' : 'column-reverse';
  const alignItems = left ? 'flex-start' : 'flex-end';

  const [isOpened, setIsOpened] = useState(false);
  const handleToggle = useCallback(() => setIsOpened(isOpened => !isOpened), []);

  return (
    <div
      className={css(styles.window, isOpened && styles.windowOpened)}
      style={{
        flexDirection,
        alignItems,
        top: top || 'auto',
        bottom: bottom || 'auto',
        left: left || 'auto',
        right: right || 'auto',
      }}
    >
      <Button onClick={handleToggle}>{isOpened ? '-' : '+'}</Button>
      <div
        className={css(styles.content, isOpened && styles.contentOpened)}
        style={{ width: width || 'auto', height: height || 'auto' }}
      >
        {children}
      </div>
    </div>
  );
};

const styles = StyleSheet.create({
  window: {
    position: 'absolute',
    display: 'flex',
    border: '1px solid rgba(85, 85, 85, 0)',
    transition: '0.2s',
  },
  windowOpened: {
    borderColor: '#555',
    background: 'rgba(30, 30, 30, 0.8)',
  },
  content: {
    margin: '2px 4px',
    display: 'none',
  },
  contentOpened: {
    display: 'block',
  },
});
