import { h, Component } from 'preact';
import { useAnimationFrame } from './hooks';
import { Stats } from './stats';
import { Screen } from './screen';
import { Options } from './options';
import { Editor } from './editor';
import { Explorer } from './explorer';
import { ApplicationState, initialApplicationState } from './state';

import * as bridge from '../bridge';
import * as simulator from '../simulator';

export class Application extends Component<{}, ApplicationState> {
  private explorer = new Explorer();

  constructor(props: {}) {
    super(props);
    this.state = {
      ...initialApplicationState(),
      explorer: this.explorer.state,
    };
  }

  private stats!: Stats;
  private screen!: Screen;
  private field!: simulator.Field;
  private pattern = simulator.compile(simulator.parse(''));

  componentDidMount() {
    this.field = new simulator.Field();
  }

  private update = (deltaStep: number) => {
    this.stats.internal.begin();

    if (!this.screen.control.isDragging) {
      if (this.state.cameraRevolve) this.screen.camera.targetPosition.x += 0.05;

      if (!this.state.isPaused) {
        this.field.update(deltaStep);
        this.screen.scene.history.putSnapshot(this.field, bridge.copyParticle);
        this.screen.scene.needsUpdate = true;

        if (this.field.closed) {
          if (this.state.generateAutomatically) this.generatePattern(false);
          const behavior = this.pattern([0, 1]);
          this.field.add(new simulator.Particle(behavior));
        }
      }
    }

    this.screen.update(deltaStep);

    this.stats.internal.end();
  };

  private togglePauseAndCameraRevolve = (ev: MouseEvent) => {
    ev.preventDefault();
    this.setState({
      isPaused: !this.state.isPaused,
      cameraRevolve: !this.state.cameraRevolve,
    });
  };

  private generationCount = 0;

  private generatePattern = (clear = true) => {
    ++this.generationCount;
    const program = simulator.generate(this.state.generatorStrength);
    const item = `Generation ${this.generationCount}`;
    const code = simulator.print(program);
    this.explorer.save('history', item, code);
    this.setState({ explorer: this.explorer.state, editingItem: item, editingCode: code });
    this.updatePattern(code, clear);
  };

  private updatePattern = (code = this.state.editingCode, clear = true) => {
    try {
      const program = simulator.parse(code);
      this.pattern = simulator.compile(program);
      if (clear) this.field.clear();
      this.setState({ editorNotification: 'Successfully compiled.' });

    } catch (e) {
      const message =
        (e instanceof simulator.ParseError) ? `Parse error: ${e.message}` :
          (e instanceof simulator.CompileError) ? `Compile error: ${e.message}` :
            `Unknown error: ${e.message}`;
      this.setState({ editorNotification: message });
    }
  };

  private handleSave = (store: string, item: string, code: string) => {
    this.explorer.save(store, item, code);
    this.setState({ explorer: this.explorer.state });
  };

  private handleLoad = (store: string, item: string) => {
    const code = this.explorer.load(store, item);
    this.setState({ editingItem: item, editingCode: code, generateAutomatically: false });
    this.updatePattern(code);
  };

  private handleDelete = (store: string, item: string) => {
    this.explorer.delete(store, item);
    this.setState({ explorer: this.explorer.state });
  };

  private handleReset = () => {
    this.field.clear();
  };

  private handleChange = (s: Partial<ApplicationState>) => {
    this.setState(s as any);
  };

  render() {
    const { showStats, stepsPerSecond } = this.state;

    useAnimationFrame(deltaTime => this.update(deltaTime * stepsPerSecond));

    return (
      <div
        style={{
          fontSize: '12px',
          userSelect: 'none',
          MozUserSelect: 'none',
          MsUserSelect: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        onContextMenu={this.togglePauseAndCameraRevolve}
      >
        <Stats ref={s => this.stats = s} visible={showStats} />
        <Screen
          ref={s => this.screen = s}
          {...this.state}
        />
        <Options
          onChange={this.handleChange}
          {...this.state}
        />
        <Editor
          onChange={this.handleChange}
          onSave={this.handleSave}
          onLoad={this.handleLoad}
          onDelete={this.handleDelete}
          onCommitCodeChange={this.updatePattern}
          onGenerate={this.generatePattern}
          onReset={this.handleReset}
          {...this.state}
        />
      </div>
    );
  }
}
