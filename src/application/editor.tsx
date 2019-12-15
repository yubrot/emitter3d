import { h, FunctionalComponent } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import { StyleSheet, css } from 'aphrodite';
import { Window, Accordion, Toggle, Slider, Button, TextField } from './components';
import { useStore } from './effects/store';
import { useSimulator } from './effects/simulator';
import { useCodeSave, useCodeDelete, useCodeLoad, useCodeGenerate } from './system';

export const Editor: FunctionalComponent<{}> = props => {
  const store = useStore();
  const simulator = useSimulator();
  const codeSave = useCodeSave();
  const codeDelete = useCodeDelete();
  const codeLoad = useCodeLoad();
  const codeGenerate = useCodeGenerate();

  const update = store.update;
  const {
    editorNotification, editingItem, editingCode, explorer,
    generatorStrength, generateAutomatically
  } = store.state;

  const itemNameChange = useCallback((editingItem: string) => {
    update({
      editingItem,
      generateAutomatically: false,
    });
  }, [update]);

  const codeChange = useCallback((editingCode: string) => {
    update({
      editingCode,
      generateAutomatically: false,
      editorNotification: '...',
      editorCompilation: ['required', 500],
    });
  }, [update]);

  const generatorStrengthChange = useCallback((generatorStrength: number) => {
    update({ generatorStrength });
  }, [update]);

  const generateAutomaticallyChange = useCallback((generateAutomatically: boolean) => {
    update({ generateAutomatically });
  }, [update]);

  const reset = useCallback(() => {
    simulator.reset();
  }, [simulator]);

  const [showExplorer, setShowExplorer] = useState(false);
  const toggleShowExplorer = useCallback(() => setShowExplorer(show => !show), []);

  return (
    <Window bottom="5px" left="5px">
      <div className={css(styles.items)}>
        <TextField
          value={editingItem}
          onChange={itemNameChange}
          style={{ flex: "1" }}
        />
        <Button onClick={codeSave}>Save</Button>
        <Button onClick={toggleShowExplorer}>{showExplorer ? "Open -" : "Open +"}</Button>
      </div>
      <div className={css(styles.explorer, showExplorer && styles.explorerOpened)}>
        {explorer.map(storage => (
          <Accordion header={storage.path} initiallyOpened={false}>
            <ul className={css(styles.storage)}>
              {storage.items.map(item => (
                <li className={css(styles.storageItem)}>
                  <div className={css(styles.storageItemOpen)} onClick={() => codeLoad(storage.path, item)}>
                    {item}
                  </div>
                  {storage.writable ? (
                    <div className={css(styles.storageItemDelete)} onClick={() => codeDelete(storage.path, item)}>
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
        onChange={codeChange}
        multiline={true}
        style={{ width: '440px', height: '350px' }}
      />
      <div className={css(styles.control)}>
        <Slider
          range={[10, 1000, 1]}
          value={generatorStrength}
          onChange={generatorStrengthChange}
          style={{ flex: "1" }}
        >
          strength
        </Slider>
        <Toggle
          value={generateAutomatically}
          onChange={generateAutomaticallyChange}
          style={{ flex: "1" }}
        >
          automatically
        </Toggle>
        <Button onClick={codeGenerate}>Generate!</Button>
        <Button onClick={reset}>Reset</Button>
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
  storage: {
    margin: 0,
    padding: 0,
  },
  storageItem: {
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
  storageItemOpen: {
    flex: "1",
  },
  storageItemDelete: {
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
