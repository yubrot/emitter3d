import { AntialiasMode, antialiasModes, ParticleMode, particleModes } from '../viewer';
export { AntialiasMode, antialiasModes, ParticleMode, particleModes };

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
  bloomEffect: false,
  bloomStrength: 0.5,
  bloomThreshold: 0.5,
  bloomRadius: 0.5,
};

export type SceneState = {
  particleSaturation: number;
  particleLightness: number;
  particleMode: ParticleMode;
  particlePointSize: number;
  particlePointShellWidth: number;
  particlePointShellLightness: number;
  trailLength: number;
  trailStep: number;
  trailFluctuationScale: number;
  trailFluctuationBias: number;
  trailAttenuationBias: number;
  showSpace: boolean;
};

export const initialSceneState: SceneState = {
  particleSaturation: 0.5,
  particleLightness: 0.5,
  particleMode: particleModes[0],
  particlePointSize: 3,
  particlePointShellWidth: 0.5,
  particlePointShellLightness: 0.5,
  trailLength: 1,
  trailStep: 1,
  trailFluctuationScale: 0,
  trailFluctuationBias: 0,
  trailAttenuationBias: 0,
  showSpace: true,
};

export type PresetName = 'crystal' | 'stardust' | 'wisp' | 'prism';

export const presetNames: PresetName[] = ['crystal', 'stardust', 'wisp', 'prism'];

export const presetStates: { [P in PresetName]: Partial<ApplicationState> } = {
  crystal: {
    bloomEffect: true,
    bloomStrength: 0.7,
    bloomThreshold: 0.5,
    bloomRadius: 0.2,
    particleSaturation: 0.9,
    particleLightness: 0.7,
    particleMode: 'crystal',
    trailLength: 40,
    trailStep: 2,
    trailFluctuationScale: 0,
    trailAttenuationBias: -2,
  },
  stardust: {
    bloomEffect: false,
    particleSaturation: 0.9,
    particleLightness: 0.9,
    particleMode: 'points',
    particlePointSize: 14,
    particlePointShellWidth: 0.92,
    particlePointShellLightness: 0.15,
    trailLength: 45,
    trailStep: 1,
    trailFluctuationScale: 15,
    trailFluctuationBias: 0,
    trailAttenuationBias: 0,
  },
  wisp: {
    bloomEffect: true,
    bloomStrength: 0.7,
    bloomThreshold: 0.5,
    bloomRadius: 1,
    particleSaturation: 0.9,
    particleLightness: 1.0,
    particleMode: 'points',
    particlePointSize: 5,
    particlePointShellWidth: 0.25,
    particlePointShellLightness: 0.85,
    trailLength: 32,
    trailStep: 1,
    trailFluctuationScale: 3,
    trailFluctuationBias: -0.5,
    trailAttenuationBias: -1.5,
  },
  prism: {
    bloomEffect: true,
    bloomStrength: 1.2,
    bloomThreshold: 0.5,
    bloomRadius: 0.2,
    particleSaturation: 0.8,
    particleLightness: 0.6,
    particleMode: 'prism',
    trailLength: 24,
    trailStep: 1,
    trailFluctuationScale: 0,
    trailAttenuationBias: -3,
  },
};
