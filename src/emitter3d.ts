import * as THREE from 'three';
import './three/extensions';
import Stats = require('stats.js');

import { Config } from './control/config';
import { Satellite } from './control/satellite';
import * as viewer from './viewer';
import * as simulator from './simulator';

type Metadata = {
  model: viewer.Model;
  colorIndex: number;
};

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
    const model: viewer.Model =
      (spec.generation.length == 0) ? 'meta' :
      (pattern.acceleration && pattern.rotation) ? 'missile' :
      (pattern.acceleration) ? Math.random() < 0.7 ? 'arrow' : 'missile' :
      (pattern.rotation) ? Math.random() < 0.7 ? 'claw' : 'missile' :
      (Math.random() < 0.7) ? 'arrow' : 'missile';

    const colorIndex = this.baseIndex + spec.generation.reduce((a, b) => a + 2 + b, 0);
    return { model, colorIndex };
  }
}

function mapParticle(source: simulator.Particle<Metadata>, dest: viewer.Particle): void {
  dest.frame = source.frame;
  dest.model = source.metadata.model;
  dest.position.copy(source.position);
  dest.fluctuation = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(5);
  dest.colorIndex = source.metadata.colorIndex;
  dest.opacity = source.opacity;
}

class Emitter3d {
  readonly stats: Stats;
  readonly config: Config;
  readonly satellite: Satellite;
  readonly view: viewer.View;
  readonly field: simulator.Field<Metadata>;
  readonly root: simulator.Particle<Metadata>;

  private emissionRefresh!: boolean;
  private emissionStrength!: number;
  private emissionInterval!: number;
  private isPaused!: boolean;
  private currentPattern?: simulator.Pattern<Metadata>;

  constructor(container: HTMLElement) {
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);

    this.config = new Config();
    this.satellite = new Satellite(container, 200);
    this.view = new viewer.View(container);
    this.field = new simulator.Field();
    this.root = new simulator.Particle<Metadata>(this.field, simulator.feature.none, { model: 'meta', colorIndex: 0 });
    this.root.rotation.setToLookAt(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0));

    this.initializeConfig();
  }

  initializeConfig(): void {
    const v = this.config.folder('Viewer');
    v.options<viewer.Antialias>('antialias', 'OFF', ['OFF', 'SMAA', 'MSAA x2', 'MSAA x4'], antialias => this.view.renderer.antialias = antialias);
    v.toggle('focus', true, enabled => this.view.renderer.focus = enabled);
    v.toggle('bloom', true, enabled => this.view.renderer.bloom = enabled);
    v.range('bloom strength', 0.7, [0, 5], v => this.view.renderer.bloomStrength = v);
    v.range('bloom radius', 1, [0, 1], v => this.view.renderer.bloomRadius = v);
    v.range('bloom threshold', 0.5, [0, 1], v => this.view.renderer.bloomThreshold = v);
    v.range('trail length', 32, [1, 60], v => { this.view.trailLength = v; this.view.needsUpdate = true; });
    v.range('trail step', 1, [1, 4], v => { this.view.trailStep = v; this.view.needsUpdate = true; });
    v.range('trail attenuation', 0.88, [0, 1], v => { this.view.trailAttenuation = v; this.view.needsUpdate = true; });
    v.range('trail fluctuation', 0.96, [0.8, 1], v => { this.view.trailFluctuation = v; this.view.needsUpdate = true; });

    const s = this.config.folder('Simulator');
    s.toggle('emission refresh', true, v => this.emissionRefresh = v);
    s.range('emission strength', 400, [10, 1000], v => this.emissionStrength = v);
    s.range('emission interval', 240, [60, 600], v => this.emissionInterval = v);

    const core = this.config;
    const pause = core.toggle('pause', false, paused => this.isPaused = paused);
    core.toggle('show stats', true, show => this.stats.dom.style.visibility = show ? 'visible' : 'hidden');
    core.toggle('camera revolve', true, revolve => this.satellite.autoRevolve = revolve);

    window.addEventListener('contextmenu', ev => {
      pause.value = !pause.value;
      ev.preventDefault();
    });
  }

  update(): void {
    this.stats.begin();
    this.satellite.update(this.view.camera);

    if (!this.satellite.isDragging && !this.isPaused) {
      if (this.root.frame % this.emissionInterval == 10) this.emit();
      this.field.update();
      this.view.history.putSnapshot(this.field, (src, dest) => mapParticle(src, dest, ));
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
