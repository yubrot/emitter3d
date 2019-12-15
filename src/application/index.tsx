import { h, FunctionalComponent } from 'preact';
import { RunStats, Stats } from './effects/stats';
import { RunExplorer, Explorer } from './effects/explorer';
import { RunStore } from './effects/store';
import { RunSimulator, Simulator } from './effects/simulator';
import { RunViewer, Viewer } from './effects/viewer';
import { Main } from './main';

export type Props = {
  simulator: Simulator;
  viewer: Viewer;
  explorer: Explorer;
  stats: Stats;
};

export const EntryPoint: FunctionalComponent<Props> = props => (
  <RunStats stats={props.stats}>
    <RunExplorer explorer={props.explorer}>
      <RunSimulator simulator={props.simulator}>
        <RunStore>
          <RunViewer viewer={props.viewer}>
            <Main />
          </RunViewer>
        </RunStore>
      </RunSimulator>
    </RunExplorer>
  </RunStats>
);
