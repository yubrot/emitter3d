import { h, Component } from 'preact';
import StatsJS = require('stats.js');

export type Props = {
  visible?: boolean;
};

export class Stats extends Component<Props, {}> {
  private container!: HTMLDivElement;
  private stats!: StatsJS;

  get internal(): StatsJS {
    return this.stats;
  }

  componentDidMount() {
    this.stats = new StatsJS();
    this.stats.showPanel(0);

    this.container.appendChild(this.stats.dom);
  }

  componentWillUnmount() {
    this.container.removeChild(this.stats.dom);
  }

  render() {
    const { visible } = this.props;
    return (
      <div
        style={{ display: visible != false ? 'block' : 'none' }}
        ref={d => this.container = d!}
      />
    );
  }
}
