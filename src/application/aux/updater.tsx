import { h, Component } from 'preact';

export type Props = {
  stepsPerSecond: number;
  onUpdate(deltaStep: number): void;
};

export class Updater extends Component<Props, {}> {
  private lastTime!: number;
  private requestId?: any;

  componentDidMount() {
    this.lastTime = performance.now();
    this.requestId = requestAnimationFrame(this.update);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.requestId);
  }

  private update = () => {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.props.onUpdate(deltaTime / 1000 * this.props.stepsPerSecond);
    this.lastTime = currentTime;
    this.requestId = requestAnimationFrame(this.update);
  };

  render() {
    return null;
  }
}
