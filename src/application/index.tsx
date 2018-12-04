import { h, Component } from 'preact';

import { Stats } from './aux/stats';
import { Updater } from './aux/updater';
import { Screen } from './screen';
import { Options } from './options';
import { ApplicationState, initialApplicationState } from './state';
import { copyParticle } from './bridge';
import * as simulator from '../simulator';

export class Application extends Component<{}, ApplicationState> {
  constructor(props: {}) {
    super(props);
    this.state = initialApplicationState();
  }

  private stats!: Stats;
  private screen!: Screen;
  private field!: simulator.Field;

  componentDidMount() {
    this.field = new simulator.Field();
  }

  private update = (deltaStep: number) => {
    this.stats.internal.begin();

    if (!this.screen.control.isDragging) {
      if (this.state.cameraRevolve) this.screen.camera.targetPosition.x += 0.1;

      if (!this.state.isPaused) {
        this.field.update(deltaStep);
        this.screen.scene.history.putSnapshot(this.field, copyParticle);
        this.screen.scene.needsUpdate = true;

        if (this.field.isEmpty) {
          const behavior = temporaryPattern([0, 1]);
          this.field.add(new simulator.Particle(behavior));
        }
      }
    }

    this.screen.update(deltaStep);

    this.stats.internal.end();
  };

  private handleContextMenu = (ev: MouseEvent) => {
    ev.preventDefault();
    this.setState({
      isPaused: !this.state.isPaused,
      cameraRevolve: !this.state.cameraRevolve,
    });
  };

  render() {
    const { showStats, stepsPerSecond } = this.state;
    return (
      <div className="application" onContextMenu={this.handleContextMenu}>
        <Stats ref={s => this.stats = s} visible={showStats} />
        <Updater stepsPerSecond={stepsPerSecond} onUpdate={this.update} />
        <Screen ref={s => this.screen = s} {...this.state} />
        <Options onChange={s => this.setState(s as any)} {...this.state} />
      </div>
    );
  }
}

const temporaryProgram = simulator.parse(`
  32 emit 1 4 16 {
    speed 2.5
    model missile
    rotate 0 [] 0
    hue []
    10 nop
    30 speed* 0.3
    80 nop
    40 nop
    30 ease-out opacity 0
  }
`);
const temporaryPattern = simulator.compile(temporaryProgram);
