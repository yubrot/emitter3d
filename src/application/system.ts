import { useEffect, useCallback, useRef } from 'preact/hooks';
import { useAnimationFrame } from './hooks';
import { useStore } from './effects/store';
import { useStats } from './effects/stats';
import { useExplorer } from './effects/explorer';
import { useSimulator } from './effects/simulator';
import { useViewer } from './effects/viewer';
import { copyParticle } from '../bridge';

export function useSystem(): void {
  useExplorerInitialization();
  useCompileRequestHandler();
  useViewerOptionApplier();
  useAnimationFrame(useSystemUpdater());
}

function useExplorerInitialization(): void {
  const store = useStore();
  const explorer = useExplorer();

  const update = store.update;

  useEffect(() => {
    (async () => {
      const storages = explorer.explore();
      const state = await Promise.all(storages.map(async storage => {
        const items = await explorer.items(storage.path);
        return { ...storage, items };
      }));
      update({ explorer: state });
    })();
  }, []);
}

function useCompileRequestHandler(): void {
  const store = useStore();
  const simulator = useSimulator();
  const compileTimeout = useRef(0);

  const update = store.update;

  const { editingCode, editorCompilation } = store.state;

  const commit = useCallback((code: string) => {
    const { message } = simulator.compilePattern(code, true);
    update({ editorNotification: message });
  }, [update, simulator]);

  useEffect(() => {
    switch (editorCompilation[0]) {
      case 'none':
        break;
      case 'required':
        const defer = editorCompilation[1];
        update({ editorCompilation: ['none'], editorNotification: '...' });
        clearTimeout(compileTimeout.current);
        compileTimeout.current = window.setTimeout(commit.bind(null, editingCode), defer);
        break;
      case 'cancelRequired':
        update({ editorCompilation: ['none'] });
        clearTimeout(compileTimeout.current);
        break;
    }
  }, [update, editingCode, editorCompilation]);
}

function useViewerOptionApplier(): void {
  const store = useStore();
  const viewer = useViewer();

  const { antialias, bloomEffect, bloomStrength, bloomThreshold, bloomRadius } = store.state;

  useEffect(() => {
    viewer.renderer.antialias = antialias;
    viewer.renderer.bloom = bloomEffect;
    viewer.renderer.bloomStrength = bloomStrength;
    viewer.renderer.bloomThreshold = bloomThreshold;
    viewer.renderer.bloomRadius = bloomRadius;
  }, [antialias, bloomEffect, bloomStrength, bloomThreshold, bloomRadius]);

  const {
    particlePoint, particlePrism, particleSaturation, particleLightness, particlePointSize,
    particlePointCoreWidth, particlePointCoreSharpness, particlePointShellLightness, particlePointSizeAttenuation,
    trailLength, trailStep, trailFluctuationScale, trailFluctuationBias, trailAttenuationBias,
  } = store.state;

  useEffect(() => {
    viewer.scene.points.visible = particlePoint;
    viewer.scene.prisms.visible = particlePrism;
    viewer.scene.particleSaturation = particleSaturation;
    viewer.scene.particleLightness = particleLightness;
    viewer.scene.points.mat.size = particlePointSize;
    viewer.scene.points.mat.coreWidth = particlePointCoreWidth;
    viewer.scene.points.mat.coreSharpness = particlePointCoreSharpness;
    viewer.scene.points.mat.shellLightness = particlePointShellLightness;
    viewer.scene.points.mat.needsUpdate =
      viewer.scene.points.mat.needsUpdate ||
      viewer.scene.points.mat.sizeAttenuation != particlePointSizeAttenuation;
    viewer.scene.points.mat.sizeAttenuation = particlePointSizeAttenuation;
    viewer.scene.trailLength = trailLength;
    viewer.scene.trailStep = trailStep;
    viewer.scene.trailFluctuationScale = trailFluctuationScale;
    viewer.scene.trailFluctuationBias = trailFluctuationBias;
    viewer.scene.trailAttenuationBias = trailAttenuationBias;
    viewer.scene.needsUpdate = true;
  }, [
    particlePoint, particlePrism, particleSaturation, particleLightness, particlePointSize,
    particlePointCoreWidth, particlePointCoreSharpness, particlePointShellLightness, particlePointSizeAttenuation,
    trailLength, trailStep, trailFluctuationScale, trailFluctuationBias, trailAttenuationBias,
  ]);
}

function useSystemUpdater(): (deltaTime: number) => void {
  const store = useStore();
  const simulator = useSimulator();
  const viewer = useViewer();
  const stats = useStats();
  const codeGenerate = useCodeGenerate(false);

  const { stepsPerSecond, isPaused, cameraRevolve, generateAutomatically } = store.state;

  return useCallback((deltaTime: number) => {
    stats.begin();
    const deltaStep = deltaTime * stepsPerSecond;
    if (cameraRevolve) viewer.camera.targetPosition.x += 0.05;
    if (!isPaused) {
      simulator.update(deltaStep);
      viewer.scene.history.putSnapshot(simulator.particles, copyParticle);
      viewer.scene.needsUpdate = true;

      if (simulator.closed) {
        if (generateAutomatically) codeGenerate();
        simulator.emitRootParticle();
      }
    }
    viewer.update(deltaStep);
    stats.end();
  }, [
    simulator, viewer, stats, codeGenerate,
    stepsPerSecond, isPaused, cameraRevolve, generateAutomatically
  ]);
}

export function useCodeSave(): () => void {
  const store = useStore();
  const explorer = useExplorer();

  const update = store.update;
  const { editingItem, editingCode } = store.state;

  return useCallback(async () => {
    const firstWritableStorage = explorer.explore().find(storage => storage.writable);
    if (!firstWritableStorage) return;
    await explorer.write(firstWritableStorage.path, editingItem, editingCode);
    const items = await explorer.items(firstWritableStorage.path);
    update(state => ({
      ...state,
      explorer: state.explorer.map(storage =>
        (storage.path == firstWritableStorage.path)
          ? { ...storage, items }
          : storage
      ),
    }));
  }, [update, editingItem, editingCode, explorer]);
}

export function useCodeDelete(): (path: string, item: string) => void {
  const store = useStore();
  const explorer = useExplorer();

  const update = store.update;

  return useCallback(async (path: string, item: string) => {
    await explorer.delete(path, item);
    update(state => ({
      ...state,
      explorer: state.explorer.map(storage =>
        (storage.path == path)
          ? { ...storage, items: storage.items.filter(i => i != item) }
          : storage
      )
    }));
  }, [update, explorer]);
}

export function useCodeLoad(): (path: string, item: string) => void {
  const store = useStore();
  const explorer = useExplorer();

  const update = store.update;

  return useCallback(async (path: string, item: string) => {
    const code = await explorer.read(path, item);
    update({
      editingItem: item,
      editingCode: code,
      editorCompilation: ['required', 0],
      generateAutomatically: false,
    });
  }, [update, explorer]);
}

export function useCodeGenerate(clear: boolean): () => void {
  const store = useStore();
  const explorer = useExplorer();
  const simulator = useSimulator();

  const update = store.update;
  const { generatorGeneration, generatorStrength } = store.state;

  return useCallback(async () => {
    const { code } = simulator.generatePattern(generatorStrength, clear);
    const generation = generatorGeneration + 1;
    const item = `Generation ${generation}`
    update(state => ({
      ...state,
      editingItem: item,
      editingCode: code,
      editorCompilation: ['cancelRequired'],
      explorer: state.explorer.map(storage =>
        (storage.path == 'history')
          ? { ...storage, items: storage.items.concat([item]) }
          : storage
      ),
      generatorGeneration: generation,
    }));
    await explorer.write('history', item, code);
  }, [update, clear, explorer, simulator, generatorGeneration, generatorStrength]);
}
