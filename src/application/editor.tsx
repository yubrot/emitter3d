import { h, Component } from 'preact';

import { Accordion, Toggle, Slider, Button, TextField } from './components';
import { EditorState } from './state';

export type Props = {
  onChange(diff: Partial<EditorState>): void;
  onSave(store: string, item: string, code: string): void;
  onLoad(store: string, item: string): void;
  onDelete(store: string, item: string): void;
  onCommitCodeChange(code: string): void;
  onGenerate(): void;
  onReset(): void;
} & EditorState;

type InternalState = {
  showExplorer: boolean;
};

export class Editor extends Component<Props, InternalState> {
  constructor(props: Props) {
    super(props);
    this.state = { showExplorer: false };
  }

  private handleItemNameChange = (editingItem: string) => {
    this.props.onChange({ editingItem });
  };

  private commitCodeChangeTimer?: any;

  private handleCodeChange = (editingCode: string) => {
    this.props.onChange({
      editingCode,
      generateAutomatically: false,
      editorNotification: '...',
    });

    clearTimeout(this.commitCodeChangeTimer);
    this.commitCodeChangeTimer = setTimeout(() => {
      this.props.onCommitCodeChange(this.props.editingCode);
    }, 500);
  };

  private handleSave = () => {
    const { explorer, editingItem, editingCode, onSave } = this.props;

    const firstWritableStore = explorer.find(store => store.writable);
    if (!firstWritableStore) return;
    onSave(firstWritableStore.name, editingItem, editingCode);
  };

  private toggleShowExplorer = () => {
    this.setState({ showExplorer: !this.state.showExplorer });
  };

  componentWillUnmount() {
    clearTimeout(this.commitCodeChangeTimer);
  }

  render() {
    const props = this.props;
    const { showExplorer } = this.state;

    return (
      <div className="editor">
        <div className="item">
          <TextField
            className="name"
            value={props.editingItem}
            onChange={this.handleItemNameChange}
          />
          <Button onClick={this.handleSave}>Save</Button>
          <Button onClick={this.toggleShowExplorer}>{showExplorer ? "Open -" : "Open +"}</Button>
        </div>
        <div className={`explorer ${showExplorer ? 'opened' : ''}`}>
          {props.explorer.map(({ name: store, items, writable }) => (
            <Accordion header={store} initiallyOpened={false}>
              <ul>
                {items.map(item => (
                  <li>
                    <div className="item-open" onClick={() => props.onLoad(store, item)}>
                      {item}
                    </div>
                    { writable ? (
                      <div className="item-delete" onClick={ev => props.onDelete(store, item)}>
                        x
                      </div>
                    ) : null }
                  </li>
                ))}
              </ul>
            </Accordion>
          ))}
        </div>
        <div className="notification">
          {props.editorNotification}
        </div>
        <TextField
          className="code"
          value={props.editingCode}
          onChange={this.handleCodeChange}
          multiline={true}
        />
        <div className="control">
          <Slider
            range={[10, 1000, 1]}
            value={props.generatorStrength}
            onChange={generatorStrength => props.onChange({ generatorStrength })}
          >
            strength
          </Slider>
          <Toggle
            value={props.generateAutomatically}
            onChange={generateAutomatically => props.onChange({ generateAutomatically })}
          >
            automatically
          </Toggle>
          <Button onClick={props.onGenerate}>Generate!</Button>
          <Button onClick={props.onReset}>Reset</Button>
        </div>
      </div>
    );
  }
}
