import { h, FunctionalComponent, createContext } from 'preact';
import { useContext, useState, useCallback } from 'preact/hooks';

export interface Store {
  readonly state: ApplicationState;
  update(updater: Updater<ApplicationState>): void;
}

const Context = createContext(undefined as unknown as Store);

export const RunStore: FunctionalComponent<{}> = props => {
  const [state, setState] = useState(initialApplicationState);
  const update = useCallback((updater: Updater<ApplicationState>) => {
    setState(s => ({
      ...s,
      ...updater instanceof Function ? updater(s) : updater
    }));
  }, [setState]);

  return (
    <Context.Provider value={{ state, update }}>
      {props.children}
    </Context.Provider>
  );
};

export const useStore: () => Store = () => useContext(Context);

type Updater<S> = Partial<S> | ((s: S) => Partial<S>);

export type ApplicationState = CoreState & EditorState & RendererState & SceneState;

export function initialApplicationState(): ApplicationState {
  return {
    ...initialCoreState,
    ...initialEditorState,
    ...initialRendererState,
    ...initialSceneState,
    ...presetStates[presetNames[Math.floor(Math.random() * presetNames.length)]],
  };
}

export type CoreState = {
  isPaused: boolean;
  showStats: boolean;
  stepsPerSecond: number;
  cameraRevolve: boolean;
};

export const initialCoreState: CoreState = {
  isPaused: false,
  showStats: false,
  stepsPerSecond: 60,
  cameraRevolve: true,
};

export type EditorState = {
  editingItem: string;
  editingCode: string;
  editorNotification: string;
  editorCompilation: ['required', number] | ['cancelRequired'] | ['none'];
  generatorGeneration: number;
  generatorStrength: number;
  generateAutomatically: boolean;
  explorer: ExplorerState;
};

export type ExplorerState = {
  path: string;
  items: string[];
  writable: boolean;
}[];

export const initialEditorState: EditorState = {
  editingItem: '',
  editingCode: '',
  editorNotification: '',
  editorCompilation: ['none'],
  generatorGeneration: 0,
  generatorStrength: 400,
  generateAutomatically: true,
  explorer: [],
};

export type RendererState = {
  antialias: boolean;
  bloomEffect: boolean;
  bloomStrength: number;
  bloomThreshold: number;
  bloomRadius: number;
};

export const initialRendererState: RendererState = {
  antialias: false,
  bloomEffect: false,
  bloomStrength: 0.5,
  bloomThreshold: 0.5,
  bloomRadius: 0.5,
};

export type SceneState = {
  particlePoint: boolean;
  particlePrism: boolean;
  particleSaturation: number;
  particleLightness: number;
  particlePointSize: number;
  particlePointSizeAttenuation: boolean;
  particlePointCoreWidth: number;
  particlePointCoreSharpness: number;
  particlePointShellLightness: number;
  trailLength: number;
  trailStep: number;
  trailFluctuationScale: number;
  trailFluctuationBias: number;
  trailAttenuationBias: number;
};

export const initialSceneState: SceneState = {
  particlePoint: true,
  particlePrism: true,
  particleSaturation: 0.5,
  particleLightness: 0.5,
  particlePointSize: 3,
  particlePointSizeAttenuation: true,
  particlePointCoreWidth: 0.5,
  particlePointCoreSharpness: 0,
  particlePointShellLightness: 0.5,
  trailLength: 1,
  trailStep: 1,
  trailFluctuationScale: 0,
  trailFluctuationBias: 0,
  trailAttenuationBias: 0,
};

export type PresetName = 'stardust' | 'prism';

export const presetNames: PresetName[] = ['stardust', 'prism'];

export const presetStates: { [P in PresetName]: Partial<ApplicationState> } = {
  stardust: {
    antialias: false,
    bloomEffect: false,
    particlePoint: true,
    particlePrism: false,
    particleSaturation: 1.0,
    particleLightness: 0.8,
    particlePointSize: 14,
    particlePointCoreWidth: 0.05,
    particlePointCoreSharpness: 3,
    particlePointShellLightness: 0.1,
    trailLength: 45,
    trailStep: 1,
    trailFluctuationScale: 15,
    trailFluctuationBias: 0,
    trailAttenuationBias: 1,
  },
  prism: {
    antialias: true,
    bloomEffect: true,
    bloomStrength: 1.2,
    bloomThreshold: 0.0,
    bloomRadius: 1.0,
    particlePoint: false,
    particlePrism: true,
    particleSaturation: 0.9,
    particleLightness: 0.7,
    trailLength: 24,
    trailStep: 1,
    trailFluctuationScale: 0,
    trailAttenuationBias: -2,
  },
};
