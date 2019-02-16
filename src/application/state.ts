import { AntialiasMode, antialiasModes, ParticleType, particleTypes } from '../viewer';
export { AntialiasMode, antialiasModes, ParticleType, particleTypes };

export type ApplicationState = CoreState & EditorState & RendererState & SceneState;

export function initialApplicationState(): ApplicationState {
  return {
    ...initialCoreState,
    ...initialEditorState,
    ...initialRendererState,
    ...initialSceneState,
    ...presetStates['wisp'],
  };
}

export type CoreState = {
  isPaused: boolean;
  showStats: boolean;
  showEditor: boolean;
  stepsPerSecond: number;
  cameraRevolve: boolean;
};

export const initialCoreState: CoreState = {
  isPaused: false,
  showStats: true,
  showEditor: false,
  stepsPerSecond: 60,
  cameraRevolve: true,
};

export type EditorState = {
  editingItem: string;
  editingCode: string;
  editorNotification: string;
  generatorStrength: number;
  generateAutomatically: boolean;
  explorer: ExplorerState;
};

export type ExplorerState = {
  name: string;
  items: string[];
  writable: boolean;
}[];

export const initialEditorState: EditorState = {
  editingItem: '',
  editingCode: '',
  editorNotification: '',
  generatorStrength: 400,
  generateAutomatically: true,
  explorer: [],
};

export type RendererState = {
  antialiasMode: AntialiasMode;
  focusEffect: boolean;
  bloomEffect: boolean;
  bloomStrength: number;
  bloomThreshold: number;
  bloomRadius: number;
};

export const initialRendererState: RendererState = {
  antialiasMode: antialiasModes[0],
  focusEffect: false,
  bloomEffect: true,
  bloomStrength: 0.7,
  bloomThreshold: 0.5,
  bloomRadius: 0,
};

export type SceneState = {
  particleType: ParticleType;
  particleSaturation: number;
  particleLightness: number;
  trailLength: number;
  trailStep: number;
  trailOpacity: number;
  trailAttenuation: number;
  trailFluctuation: number;
  showSpace: boolean;
};

export const initialSceneState: SceneState = {
  particleType: particleTypes[0],
  particleSaturation: 0.9,
  particleLightness: 0.7,
  trailLength: 1,
  trailStep: 1,
  trailOpacity: 1,
  trailAttenuation: 0,
  trailFluctuation: 0,
  showSpace: false,
};

export type PresetName = 'wisp' | 'crystal';

export const presetNames: PresetName[] = ['wisp', 'crystal'];

export const presetStates: { [P in PresetName]: Partial<ApplicationState> } = {
  wisp: {
    bloomRadius: 1,
    particleType: 'points',
    showSpace: true,
    trailLength: 32,
    trailStep: 1,
    trailAttenuation: 0.88,
    trailFluctuation: 0.96,
  },
  crystal: {
    bloomRadius: 0.2,
    particleType: 'objects',
    showSpace: true,
    trailLength: 40,
    trailStep: 2,
    trailAttenuation: 0.75,
    trailFluctuation: 1,
  },
};
