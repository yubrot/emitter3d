import { h, FunctionalComponent } from 'preact';
import { useRef, useEffect } from 'preact/hooks';
import { StyleSheet, css } from 'aphrodite';
import { Mount } from './components';
import { useViewer } from './effects/viewer';

export const Screen: FunctionalComponent<{}> = props => {
  const viewer = useViewer();
  const container = useRef<HTMLDivElement>();

  useEffect(() => {
    return viewer.setTrackpoint(container.current!);
  }, [viewer]);

  useEffect(() => {
    const propagateSize = () => {
      const width = container.current!.clientWidth;
      const height = container.current!.clientHeight;
      viewer.setSize(width, height);
    };

    window.addEventListener('resize', propagateSize);
    propagateSize();

    return () => window.removeEventListener('resize', propagateSize);
  }, [viewer, container]);

  return (
    <Mount
      dom={viewer.renderer.domElement}
      className={css(styles.container)}
      containerRef={container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});
