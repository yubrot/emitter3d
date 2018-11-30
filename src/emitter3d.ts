import Stats = require('stats.js');

import { Config, Input } from './control/config';
import { Satellite } from './control/satellite';
import * as viewer from './viewer';
import * as simulator from './simulator';

function copyParticle(source: simulator.Particle, dest: viewer.Particle): void {
  dest.lifeTime = source.lifeTime;
  dest.position.set(source.position[0], source.position[1], source.position[2]);
  dest.rotation.set(source.rotation[0], source.rotation[1], source.rotation[2], source.rotation[3]);
  dest.fluctuation.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(5);
  dest.opacity = source.opacity;
  dest.hue = source.hue;
  dest.objectModel = source.model || 'meta';
}

type PresetName = 'wisp' | 'crystal';

const presetNames: PresetName[] = ['wisp', 'crystal'];

class Emitter3d {
  readonly stats: Stats;
  readonly config: Config;
  readonly satellite: Satellite;
  readonly view: viewer.View;
  readonly field: simulator.Field;

  emissionRefresh!: boolean;
  emissionStrength!: number;
  emissionInterval!: number;
  isPaused!: boolean;
  stepPerSecond!: number;

  constructor(container: HTMLElement) {
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);

    this.config = new Config();
    this.satellite = new Satellite(container, 200);
    this.view = new viewer.View(container);
    this.field = new simulator.Field();

    this.initializeConfig();
  }

  initializeConfig(): void {
    const initialPresetName = presetNames[Math.floor(Math.random() * presetNames.length)];
    const initialPreset = this.getPreset(initialPresetName);

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
    const particleSaturation = v.range('particle saturation', 0.9, [0, 1]).step(0.01).bind(this.view, 'saturation');
    const particleLightness = v.range('particle lightness', 0.7, [0, 1]).step(0.01).bind(this.view, 'lightness');
    const trailLength = v.range('trail length', initialPreset.trailLength, [1, 60]).step(1).bind(this.view, 'trailLength');
    const trailStep = v.range('trail step', initialPreset.trailStep, [1, 4]).step(1).bind(this.view, 'trailStep');
    const trailOpacity = v.range('trail opacity', 1, [0, 1]).step(0.01).bind(this.view, 'trailOpacity');
    const trailAttenuation = v.range('trail attenuation', initialPreset.trailAttenuation, [0, 1]).step(0.01).bind(this.view, 'trailAttenuation');
    const trailFluctuation = v.range('trail fluctuation', initialPreset.trailFluctuation, [0.8, 1]).step(0.01).bind(this.view, 'trailFluctuation');
    const showSurface = v.toggle('show surface', initialPreset.showSurface).bind(this.view.surface, 'visible');
    const showSpace = v.toggle('show space', initialPreset.showSpace).bind(this.view.space, 'visible');

    const pause = core.toggle('pause', false).bind(this, 'isPaused');
    const showStats = core.toggle('show stats', true).handle(show => this.stats.dom.style.visibility = show ? 'visible' : 'hidden');
    const cameraRevolve = core.toggle('camera revolve', true).bind(this.satellite, 'autoRevolve');
    const stepPerSecond = core.range('step per second', 60, [20, 180]).handle(sps => this.stepPerSecond = sps);

    const emissionRefresh = sim.toggle('emission refresh', true).bind(this, 'emissionRefresh');
    const emissionStrength = sim.range('emission strength', 400, [10, 1000]).step(1).bind(this, 'emissionStrength');
    const emissionInterval = sim.range('emission interval', 240, [60, 600]).step(1).bind(this, 'emissionInterval');

    core.options<PresetName>('preset', initialPresetName, presetNames).handle(name => {
      const preset = this.getPreset(name);
      bloomRadius.value = preset.bloomRadius;
      particleType.value = preset.particleType;
      trailLength.value = preset.trailLength;
      trailStep.value = preset.trailStep;
      trailAttenuation.value = preset.trailAttenuation;
      trailFluctuation.value = preset.trailFluctuation;
      showSurface.value = preset.showSurface;
      showSpace.value = preset.showSpace;
    });

    for (const controller of [particleType, particleSaturation, particleLightness, trailLength, trailStep, trailOpacity, trailAttenuation, trailFluctuation] as Input<any>[]) {
      controller.handle(() => this.view.needsUpdate = true);
    }

    window.addEventListener('contextmenu', ev => {
      pause.value = !pause.value;
      cameraRevolve.value = !cameraRevolve.value;
      ev.preventDefault();
    });
  }

  getPreset(name: PresetName): {
    bloomRadius: number;
    particleType: viewer.ParticleType;
    showSurface: boolean;
    showSpace: boolean;
    trailLength: number;
    trailStep: number;
    trailAttenuation: number;
    trailFluctuation: number;
  } {
    switch (name) {
      case 'wisp':
        return {
          bloomRadius: 1,
          particleType: 'points',
          showSurface: true,
          showSpace: false,
          trailLength: 32,
          trailStep: 1,
          trailAttenuation: 0.88,
          trailFluctuation: 0.96,
        };
      case 'crystal':
        return {
          bloomRadius: 0.2,
          particleType: 'objects',
          showSurface: false,
          showSpace: true,
          trailLength: 40,
          trailStep: 2,
          trailAttenuation: 0.75,
          trailFluctuation: 1,
        };
      default:
        throw new TypeError();
    }
  }

  private cooldown = 0;
  private currentPattern?: (index: [number, number]) => simulator.Behavior;

  update(deltaTime: number): void {
    deltaTime *= this.stepPerSecond;

    this.stats.begin();
    this.satellite.update(this.view.camera);

    if (!this.satellite.isDragging && !this.isPaused) {
      if ((this.cooldown -= deltaTime) < 0) {
        this.cooldown = this.emissionInterval;
        this.emit();
      }
      this.field.update(deltaTime);
      this.view.history.putSnapshot(this.field, copyParticle);
      this.view.needsUpdate = true;
    }

    this.view.render();
    this.stats.end();
  }

  emit(): void {
    if (!this.currentPattern || this.emissionRefresh) {
      const program = simulator.parse(`
        32 emit 1 4 16 {
          speed 2.5
          model missile
          rotate 0 [] 0
          hue []
          10 nop
          30 speed* 0.3
          80 nop
          40 nop
          30 ease-out opacity 0
        }
      `);
      this.currentPattern = simulator.compile(program);
    }

    const particle = new simulator.Particle(this.currentPattern([0, 1]));
    this.field.add(particle);
  }
}

function main(): void {
  const container = document.getElementById('emitter3d')!;
  const emitter3d = new Emitter3d(container);

  let lastTime = performance.now();

  function animate(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    emitter3d.update(deltaTime / 1000);
    requestAnimationFrame(animate);
  }

  animate();
}

export = main;
