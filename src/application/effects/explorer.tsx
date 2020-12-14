import { h, FunctionalComponent, createContext } from 'preact';
import { useContext } from 'preact/hooks';

export interface Explorer {
  explore(): { path: string; writable: boolean }[];
  read(path: string, item: string): Promise<string>;
  write(path: string, item: string, body: string): Promise<void>;
  delete(path: string, item: string): Promise<boolean>;
  items(path: string): Promise<string[]>;
}

const Context = createContext((undefined as unknown) as Explorer);

export const RunExplorer: FunctionalComponent<{ explorer: Explorer }> = props => (
  <Context.Provider value={props.explorer}>{props.children}</Context.Provider>
);

export const useExplorer: () => Explorer = () => useContext(Context);
