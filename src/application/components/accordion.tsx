import { h, FunctionalComponent } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import { StyleSheet, css } from 'aphrodite';

export type Props = {
  initiallyOpened?: boolean;
  header: any;
};

export const Accordion: FunctionalComponent<Props> = props => {
  const { initiallyOpened, header, children } = props;

  const [isOpened, setIsOpened] = useState(initiallyOpened || false);
  const handleToggle = useCallback(() => setIsOpened(isOpened => !isOpened), []);

  return (
    <div>
      <div
        className={css(styles.header, isOpened && styles.headerOpened)}
        onClick={handleToggle}
      >
        {header}
      </div>
      <div className={css(styles.content, isOpened && styles.contentOpened)}>
        {children}
      </div>
    </div>
  );
};

const styles = StyleSheet.create({
  header: {
    cursor: 'pointer',
    padding: '4px 4px 1px',
    transition: '0.2s',
    color: '#aaa',
    borderBottom: '1px solid #555',
    ':hover': {
      color: '#fff',
      borderColor: '#fff',
    },
    ':before': {
      content: '""',
      display: 'inline-block',
      margin: '0 2px 0 2px',
      borderStyle: 'solid',
      borderWidth: '4px',
      borderColor: 'transparent transparent transparent rgba(255, 255, 255, 0.3)',
      transition: '0.2s',
    },
    ':hover:before': {
      borderColor: 'transparent transparent transparent #ffffff',
    },
  },
  headerOpened: {
    ':before': {
      margin: '2px 4px 0 0',
      borderColor: 'rgba(255, 255, 255, 0.7) transparent transparent transparent',
    },
    ':hover:before': {
      borderColor: '#ffffff transparent transparent transparent',
    },
  },
  content: {
    margin: '4px 0',
    display: 'none',
  },
  contentOpened: {
    display: 'block',
  },
});
