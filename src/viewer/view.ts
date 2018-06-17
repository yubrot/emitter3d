import * as THREE from 'three';

import { History } from './history';
import { Renderer } from './renderer';
import { Model } from './objects/model';
import { Particles } from './objects/particles';
import { Surface } from './objects/surface';

export type Model = 'missile' | 'arrow' | 'claw' | 'meta';

export type Particle = {
  frame: number;
  model: Model;
  position: THREE.Vector3;
  fluctuation: THREE.Vector3;
  colorIndex: number;
  opacity: number;
};

function allocateParticle(): Particle {
  return {
    frame: 0,
    model: 'meta',
    position: new THREE.Vector3(),
    fluctuation: new THREE.Vector3(),
    colorIndex: 0,
    opacity: 0,
  };
}

export class View {
  readonly history: History<Particle>;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: Renderer;
  readonly surface: Surface;
  readonly particles: Particles;

  needsUpdate = false;

  trailLength = 1;
  trailStep = 1;
  trailAttenuation = 1;
  trailFluctuation = 1;

  get width(): number {
    return this.container.clientWidth;
  }

  get height(): number {
    return this.container.clientHeight;
  }

  constructor(private container: HTMLElement) {
    this.history = new History(allocateParticle, 60);
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.001);
    this.camera = new THREE.PerspectiveCamera(70, 1, 1, 2000);
    this.renderer = new Renderer(this.scene, this.camera);
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.updateSize.bind(this));
    this.updateSize();

    this.surface = new Surface(20, 40, 40);
    this.surface.rotation.set(Math.PI/2, 0, 0);
    this.scene.add(this.surface);

    this.particles = new Particles(50000);
    this.scene.add(this.particles);
  }

  render(): void {
    if (this.needsUpdate) {
      this.needsUpdate = false;

      this.particles.update(put => {
        const hlfs = [[5, 1.08], [20, 1], [70, 1], [110, 1], [150, 1], [230, 1.1], [255, 1.1], [335, 1.05]];
        const pos = new THREE.Vector3();
        const color = new THREE.Color();

        let opacity = 1;
        let fluctuation = 1;
        for (const snapshot of this.history.snapshots(0, this.trailLength, Math.floor(this.trailStep))) {
          for (const particle of snapshot) {
            if (particle.model == 'meta') continue;
            const [h, lf] = hlfs[particle.colorIndex % hlfs.length];
            pos.copy(particle.position).addScaledVector(particle.fluctuation, 1 - fluctuation);
            color.setHSL((1 + h/360 + particle.position.y * 0.001) % 1, 0.9, lf * Math.min(0.7, 0.3 + particle.frame*0.02) * particle.opacity * opacity);
            put(pos, color);
          }
          opacity *= this.trailAttenuation;
          fluctuation *= this.trailFluctuation;
        }
      });
    }

    this.renderer.render();
  }

  updateSize(): void {
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }
}
