import * as THREE from 'three';

import { History } from './aux/history';
import { Particles } from './particles';
import { Prisms } from './prisms';

export type Dot = {
  lifeTime: number;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  diffusion: THREE.Vector3;
  opacity: number;
  hue: number;
};

function allocateDot(): Dot {
  return {
    lifeTime: 0,
    position: new THREE.Vector3(),
    rotation: new THREE.Quaternion(),
    diffusion: new THREE.Vector3(),
    hue: 0,
    opacity: 0,
  };
}

export class Scene extends THREE.Scene {
  readonly history: History<Dot>;
  readonly prisms: Prisms;
  readonly particles: Particles;

  readonly prismOptions = {
    saturation: 0.5,
    lightness: 0.5,
    snapshotOffset: 0,
    trailLength: 1,
    trailStep: 1,
    trailAttenuation: (x: number) => 1 - x,
  };

  readonly particleOptions = {
    saturation: 0.5,
    lightness: 0.5,
    snapshotOffset: 10,
    trailLength: 1,
    trailAttenuation: (x: number) => 1 - x,
    trailDiffusionScale: 0,
    trailDiffusionTransition: (x: number) => 1 - x,
  };

  needsUpdate = false;

  constructor() {
    super();
    this.fog = new THREE.FogExp2(0x000000, 0.0003);
    this.history = new History(allocateDot, 240);

    this.particles = new Particles(40000);
    this.add(this.particles);

    this.prisms = new Prisms(40000);
    this.add(this.prisms);
  }

  update(): void {
    if (this.needsUpdate) {
      this.needsUpdate = false;
      this.updateParticles();
    }
  }

  private updateParticles(): void {
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const color = new THREE.Color();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();

    if (this.prisms.visible) {
      const prisms = this.prisms.beginUpdate();
      const prismOptions = this.prismOptions;
      for (let i = 0; i < prismOptions.trailLength; i += Math.floor(prismOptions.trailStep)) {
        const t = i / (prismOptions.trailLength - 0.9);
        const a = prismOptions.trailAttenuation(t);
        for (const dot of this.history.snapshot(i + prismOptions.snapshotOffset)) {
          if (dot.opacity == 0) continue;
          position.copy(dot.position);
          color.setHSL(
            (1 + dot.hue / 360 + position.y * 0.001) % 1,
            prismOptions.saturation,
            prismOptions.lightness * dot.opacity * a * Math.min(1, dot.lifeTime * 0.1));
          rotation
            .copy(dot.rotation)
            .multiply(q.setFromEuler(e.set(0, 0, Math.PI * 0.02 * dot.lifeTime)));
          prisms.put(position, rotation, color);
        }
      }
      prisms.complete();
    }

    if (this.particles.visible) {
      const particles = this.particles.beginUpdate();
      const particleOptions = this.particleOptions;
      for (let i = 0; i < particleOptions.trailLength; i++) {
        const t = i / (particleOptions.trailLength - 0.9);
        const a = particleOptions.trailAttenuation(t);
        const f = (1 - particleOptions.trailDiffusionTransition(t)) * particleOptions.trailDiffusionScale;
        for (const dot of this.history.snapshot(i + particleOptions.snapshotOffset)) {
          if (dot.opacity == 0) continue;
          position.copy(dot.position).addScaledVector(dot.diffusion, f);
          color.setHSL(
            (1 + dot.hue / 360 + position.y * 0.001) % 1,
            particleOptions.saturation,
            particleOptions.lightness * dot.opacity * a * Math.min(1, dot.lifeTime * 0.1));
          particles.put(position, color);
        }
      }
      particles.complete();
    }
  }
}
