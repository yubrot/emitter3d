import { h, FunctionalComponent, createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { Simulator } from '../../simulator';
export { Simulator };

const Context = createContext((undefined as unknown) as Simulator);

export const RunSimulator: FunctionalComponent<{ simulator: Simulator }> = props => {
  return <Context.Provider value={props.simulator}>{props.children}</Context.Provider>;
};

export const useSimulator: () => Simulator = () => useContext(Context);
