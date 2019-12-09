import { h, FunctionalComponent } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import { useTimeout } from './hooks';
import { StyleSheet, css } from 'aphrodite';
import { Window, Accordion, Toggle, Slider, Button, TextField } from './components';
import { EditorState } from './state';

export type Props = {
  onChange(diff: Partial<EditorState>): void;
  onSave(store: string, item: string, code: string): void;
  onLoad(store: string, item: string): void;
  onDelete(store: string, item: string): void;
  onCommitCodeChange(): void;
  onGenerate(): void;
  onReset(): void;
} & EditorState;

export const Editor: FunctionalComponent<Props> = props => {
  const {
    onChange, onSave, onLoad, onDelete, onCommitCodeChange, onGenerate, onReset,
    explorer, editingItem, editingCode, editorNotification, generatorStrength, generateAutomatically,
  } = props;

  const handleItemNameChange = useCallback((editingItem: string) => {
    onChange({
      editingItem,
      generateAutomatically: false,
    });
  }, [onChange]);

  const commitCodeChangeTimeout = useTimeout([]);

  const handleCodeChange = useCallback((editingCode: string) => {
    onChange({
      editingCode,
      generateAutomatically: false,
      editorNotification: '...',
    });
    commitCodeChangeTimeout(onCommitCodeChange, 500);
  }, [onChange, onCommitCodeChange]);

  const handleGeneratorStrengthChange = useCallback((generatorStrength: number) => {
    onChange({ generatorStrength });
  }, [onChange]);

  const handleGenerateAutomaticallyChange = useCallback((generateAutomatically: boolean) => {
    onChange({ generateAutomatically });
  }, [onChange]);

  const handleSave = useCallback(() => {
    const firstWritableStore = explorer.find(store => store.writable);
    if (!firstWritableStore) return;
    onSave(firstWritableStore.name, editingItem, editingCode);
  }, [explorer, editingItem, editingCode, onSave]);

  const [showExplorer, setShowExplorer] = useState(false);
  const toggleShowExplorer = useCallback(() => setShowExplorer(show => !show), []);

  return (
    <Window bottom="5px" left="5px">
      <div className={css(styles.items)}>
        <TextField
          value={editingItem}
          onChange={handleItemNameChange}
          style={{ flex: "1" }}
        />
        <Button onClick={handleSave}>Save</Button>
        <Button onClick={toggleShowExplorer}>{showExplorer ? "Open -" : "Open +"}</Button>
      </div>
      <div className={css(styles.explorer, showExplorer && styles.explorerOpened)}>
        {explorer.map(({ name: store, items, writable }) => (
          <Accordion header={store} initiallyOpened={false}>
            <ul className={css(styles.store)}>
              {items.map(item => (
                <li className={css(styles.storeItem)}>
                  <div className={css(styles.storeItemOpen)} onClick={() => onLoad(store, item)}>
                    {item}
                  </div>
                  {writable ? (
                    <div className={css(styles.storeItemDelete)} onClick={() => onDelete(store, item)}>
                      x
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </Accordion>
        ))}
      </div>
      <div className={css(styles.notification)}>
        {editorNotification}
      </div>
      <TextField
        value={editingCode}
        onChange={handleCodeChange}
        multiline={true}
        style={{ width: '440px', height: '350px' }}
      />
      <div className={css(styles.control)}>
        <Slider
          range={[10, 1000, 1]}
          value={generatorStrength}
          onChange={handleGeneratorStrengthChange}
          style={{ flex: "1" }}
        >
          strength
        </Slider>
        <Toggle
          value={generateAutomatically}
          onChange={handleGenerateAutomaticallyChange}
          style={{ flex: "1" }}
        >
          automatically
        </Toggle>
        <Button onClick={onGenerate}>Generate!</Button>
        <Button onClick={onReset}>Reset</Button>
      </div>
    </Window>
  );
};

const styles = StyleSheet.create({
  items: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '6px 3px',
  },
  explorer: {
    position: 'absolute',
    top: '0',
    right: '-210px',
    width: '200px',
    maxHeight: '400px',
    padding: '3px',
    overflow: 'auto',
    background: 'rgba(30, 30, 30, 0.8)',
    border: '1px solid #555',
    display: 'none',
  },
  explorerOpened: {
    display: 'block',
  },
  store: {
    margin: 0,
    padding: 0,
  },
  storeItem: {
    display: 'flex',
    alignItems: 'center',
    margin: '2px 0',
    padding: '2px 8px',
    cursor: 'pointer',
    transition: '0.2s',
    color: '#aaa',
    border: '1px solid rgba(255, 255, 255, 0)',
    ':hover': {
      color: '#fff',
      background: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    ':active': {
      color: '#fff',
      background: 'rgba(255, 255, 255, 0.3)',
      borderColor: 'rgba(255, 255, 255, 0.7)',
    },
  },
  storeItemOpen: {
    flex: "1",
  },
  storeItemDelete: {
    padding: '0 3px',
    transition: '0.2s',
    ':hover': {
      color: '#faa',
    },
  },
  notification: {
    margin: '10px 10px 6px',
    lineHeight: '100%',
    minHeight: '14px',
    textAlign: 'right',
    color: '#aaa',
  },
  control: {
    display: 'flex',
    margin: '6px 3px',
  },
});
