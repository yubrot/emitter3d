import { h, FunctionalComponent, createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { Viewer } from '../../viewer';
export { Viewer };

const Context = createContext(undefined as unknown as Viewer);

export const RunViewer: FunctionalComponent<{ viewer: Viewer }> = props => {
  return (
    <Context.Provider value={props.viewer}>
      {props.children}
    </Context.Provider>
  );
};

export const useViewer: () => Viewer = () => useContext(Context);
