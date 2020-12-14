import { h, FunctionalComponent, createContext } from 'preact';
import { useContext } from 'preact/hooks';

export interface Stats {
  readonly dom: HTMLElement;
  begin(): void;
  end(): void;
}

const Context = createContext((undefined as unknown) as Stats);

export const RunStats: FunctionalComponent<{ stats: Stats }> = props => (
  <Context.Provider value={props.stats}>{props.children}</Context.Provider>
);

export const useStats: () => Stats = () => useContext(Context);
