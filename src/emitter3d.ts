import * as THREE from 'three';
import './three/extensions';
import Stats = require('stats.js');

import { Config, Input } from './control/config';
import { Satellite } from './control/satellite';
import * as viewer from './viewer';
import * as simulator from './simulator';

type Metadata = {
  objectModel: 'meta' | 'missile' | 'arrow' | 'claw';
  colorIndex: number;
};

function copyParticle(source: simulator.Particle<Metadata>, dest: viewer.Particle): void {
  dest.frame = source.frame;
  dest.objectModel = source.metadata.objectModel;
  dest.position.copy(source.position);
  dest.rotation.copy(source.rotation);
  dest.fluctuation.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(5);
  dest.colorIndex = source.metadata.colorIndex;
  dest.opacity = source.opacity;
}

class Composer extends simulator.Composer<Metadata> {
  patternFeatures(p: simulator.Pattern<Metadata>): simulator.Feature<Metadata>[] {
    const features = super.patternFeatures(p);
    if (!p.emission) features.push(simulator.feature.vanisher(180, 60));
    return features;
  }
}

class Generator extends simulator.Generator<Metadata> {
  constructor(private baseIndex: number) {
    super();
  }

  metadata(pattern: simulator.Pattern, spec: simulator.Spec): Metadata {
    const objectModel: Metadata['objectModel'] =
      (spec.generation.length == 0) ? 'meta' :
      (pattern.acceleration && pattern.rotation) ? 'missile' :
      (pattern.acceleration) ? Math.random() < 0.7 ? 'arrow' : 'missile' :
      (pattern.rotation) ? Math.random() < 0.7 ? 'claw' : 'missile' :
      (Math.random() < 0.7) ? 'arrow' : 'missile';

    const colorIndex = this.baseIndex + spec.generation.reduce((a, b) => a + 2 + b, 0);
    return { objectModel, colorIndex };
  }
}

type PresetType = 'wisp' | 'crystal';

const presetTypes: PresetType[] = ['wisp', 'crystal'];

type Preset = {
  bloomRadius: number;
  particleType: viewer.ParticleType;
  showSurface: boolean;
  showSpace: boolean;
  trailLength: number;
  trailStep: number;
  trailAttenuation: number;
  trailFluctuation: number;
};

const presets: { [P in PresetType]: Preset } = {
  wisp: {
    bloomRadius: 1,
    particleType: 'points',
    showSurface: true,
    showSpace: false,
    trailLength: 32,
    trailStep: 1,
    trailAttenuation: 0.88,
    trailFluctuation: 0.96,
  },
  crystal: {
    bloomRadius: 0.2,
    particleType: 'objects',
    showSurface: false,
    showSpace: true,
    trailLength: 40,
    trailStep: 2,
    trailAttenuation: 0.75,
    trailFluctuation: 1,
  },
};

class Emitter3d {
  readonly stats: Stats;
  readonly config: Config;
  readonly satellite: Satellite;
  readonly view: viewer.View;
  readonly field: simulator.Field<Metadata>;
  readonly root: simulator.Particle<Metadata>;

  emissionRefresh!: boolean;
  emissionStrength!: number;
  emissionInterval!: number;
  isPaused!: boolean;
  currentPattern?: simulator.Pattern<Metadata>;

  constructor(container: HTMLElement) {
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);

    this.config = new Config();
    this.satellite = new Satellite(container, 200);
    this.view = new viewer.View(container);
    this.field = new simulator.Field();
    this.root = new simulator.Particle<Metadata>(this.field, simulator.feature.none, { objectModel: 'meta', colorIndex: 0 });
    this.root.rotation.setToLookAt(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0));

    this.initializeConfig();
  }

  initializeConfig(): void {
    const initialPresetType = presetTypes[Math.floor(Math.random() * presetTypes.length)];
    const initialPreset = presets[initialPresetType];

    const r = this.config.folder('Renderer');
    const v = this.config.folder('Viewer');
    const sim = this.config.folder('Simulator');
    const core = this.config.folder('Core').open();

    const antialiasMode = r.options('antialias', 'OFF', viewer.antialiasModes).bind(this.view.renderer, 'antialiasMode');
    const focus = r.toggle('focus', true).bind(this.view.renderer, 'focus');
    const bloom = r.toggle('bloom', true).bind(this.view.renderer, 'bloom');
    const bloomStrength = r.range('bloom strength', 0.7, [0, 3]).step(0.1).bind(this.view.renderer, 'bloomStrength');
    const bloomThreshold = r.range('bloom threshold', 0.5, [0, 1]).step(0.1).bind(this.view.renderer, 'bloomThreshold');
    const bloomRadius = r.range('bloom radius', initialPreset.bloomRadius, [0, 1]).step(0.1).bind(this.view.renderer, 'bloomRadius');

    const particleType = v.options('particle type', initialPreset.particleType, viewer.particleTypes).bind(this.view, 'particleType');
    const particleHue = v.range('particle hue', 0.9, [0, 1]).step(0.01).bind(this.view, 'hue');
    const particleLightness = v.range('particle lightness', 0.7, [0, 1]).step(0.01).bind(this.view, 'lightness');
    const trailLength = v.range('trail length', initialPreset.trailLength, [1, 60]).step(1).bind(this.view, 'trailLength');
    const trailStep = v.range('trail step', initialPreset.trailStep, [1, 4]).step(1).bind(this.view, 'trailStep');
    const trailOpacity = v.range('trail opacity', 1, [0, 1]).step(0.01).bind(this.view, 'trailOpacity');
    const trailAttenuation = v.range('trail attenuation', initialPreset.trailAttenuation, [0, 1]).step(0.01).bind(this.view, 'trailAttenuation');
    const trailFluctuation = v.range('trail fluctuation', initialPreset.trailFluctuation, [0.8, 1]).step(0.01).bind(this.view, 'trailFluctuation');
    const showSurface = v.toggle('show surface', initialPreset.showSurface).bind(this.view.surface, 'visible');
    const showSpace = v.toggle('show space', initialPreset.showSpace).bind(this.view.space, 'visible');

    for (const controller of [particleType, particleHue, particleLightness, trailLength, trailStep, trailOpacity, trailAttenuation, trailFluctuation] as Input<any>[]) {
      controller.handle(() => this.view.needsUpdate = true);
    }

    const pause = core.toggle('pause', false).bind(this, 'isPaused');
    const showStats = core.toggle('show stats', true).handle(show => this.stats.dom.style.visibility = show ? 'visible' : 'hidden');
    const cameraRevolve = core.toggle('camera revolve', true).bind(this.satellite, 'autoRevolve');

    window.addEventListener('contextmenu', ev => {
      pause.value = !pause.value;
      cameraRevolve.value = !cameraRevolve.value;
      ev.preventDefault();
    });

    const emissionRefresh = sim.toggle('emission refresh', true).bind(this, 'emissionRefresh');
    const emissionStrength = sim.range('emission strength', 400, [10, 1000]).step(1).bind(this, 'emissionStrength');
    const emissionInterval = sim.range('emission interval', 240, [60, 600]).step(1).bind(this, 'emissionInterval');

    core.options<PresetType>('preset', initialPresetType, presetTypes).handle(name => {
      const preset = presets[name];
      bloomRadius.value = preset.bloomRadius;
      particleType.value = preset.particleType;
      trailLength.value = preset.trailLength;
      trailStep.value = preset.trailStep;
      trailAttenuation.value = preset.trailAttenuation;
      trailFluctuation.value = preset.trailFluctuation;
      showSurface.value = preset.showSurface;
      showSpace.value = preset.showSpace;
    });
  }

  update(): void {
    this.stats.begin();
    this.satellite.update(this.view.camera);

    if (!this.satellite.isDragging && !this.isPaused) {
      if (this.root.frame % this.emissionInterval == 10) this.emit();
      this.field.update();
      this.view.history.putSnapshot(this.field, copyParticle);
      this.view.needsUpdate = true;
    }

    this.view.render();
    this.stats.end();
  }

  emit(): void {
    if (!this.currentPattern || this.emissionRefresh) {
      const generator = new Generator(Math.floor(Math.random() * 32));
      this.currentPattern = generator.pattern(this.emissionStrength);
    }

    const composer = new Composer();
    composer.pattern(this.currentPattern)(this.root);
  }
}

function main(): void {
  const container = document.getElementById('emitter3d')!;
  const emitter3d = new Emitter3d(container);

  function animate(): void {
    emitter3d.update();
    requestAnimationFrame(animate);
  }

  animate();
}

export = main;
