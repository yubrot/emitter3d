import { h, render } from 'preact';
import Stats = require('stats.js');
import { Explorer, NativeStorage, MapStorage } from './explorer';
import { Simulator } from './simulator';
import * as simulatorPresets from './simulator/presets';
import { Viewer } from './viewer';
import { EntryPoint } from './application';
import { initialApplicationState, deserializeState } from './application/effects/store';

function emitter3d(container: HTMLElement): void {
  const explorer = new Explorer();
  explorer.mount('local', new NativeStorage(localStorage, 'e3d-user-'));
  explorer.mount('examples', new MapStorage(simulatorPresets.examples, false));
  explorer.mount('reference', new MapStorage(simulatorPresets.reference, false));
  explorer.mount('history', new MapStorage(new Map<string, string>(), true));

  const stats = new Stats();
  stats.showPanel(0);

  const simulator = new Simulator();

  const viewer = new Viewer();

  let state = initialApplicationState();
  if (location.hash.length) {
    const data = decodeURIComponent(location.hash.slice(1));
    state = { ...state, ...deserializeState(data) };
  }

  render(
    <EntryPoint
      simulator={simulator}
      viewer={viewer}
      initialState={state}
      explorer={explorer}
      stats={stats}
    />,
    container
  );
}

export = emitter3d;
