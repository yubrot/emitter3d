import { h, FunctionalComponent } from 'preact';
import { useCallback } from 'preact/hooks';
import { StyleSheet, css } from 'aphrodite';
import { Mount } from './components';
import { useStats } from './effects/stats';
import { useStore } from './effects/store';
import { Options } from './options';
import { Editor } from './editor';
import { Screen } from './screen';
import { useSystem } from './system';

export const Main: FunctionalComponent<{}> = props => {
  const stats = useStats();
  const store = useStore();

  const update = store.update;
  const { showStats } = store.state;

  const togglePauseAndCameraRevolve = useCallback(
    (ev: MouseEvent) => {
      ev.preventDefault();
      update(state => ({
        isPaused: !state.isPaused,
        cameraRevolve: !state.cameraRevolve,
      }));
    },
    [update]
  );

  useSystem();

  return (
    <div className={css(styles.container)} onContextMenu={togglePauseAndCameraRevolve}>
      <Screen />
      <Mount className={css(styles.stats, showStats && styles.statsShow)} dom={stats.dom} />
      <Options />
      <Editor />
    </div>
  );
};

const styles = StyleSheet.create({
  container: {
    fontSize: '12px',
    userSelect: 'none',
    MozUserSelect: 'none',
    MsUserSelect: 'none',
    position: 'fixed',
    background: '#000',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  stats: {
    display: 'none',
  },
  statsShow: {
    display: 'block',
  },
});
