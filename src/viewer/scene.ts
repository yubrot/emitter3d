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
    hueOffset: 0,
    hueTransition: 0,
    trailLength: 1,
    trailStep: 1,
    trailAttenuation: (x: number) => 1 - x,
  };

  readonly particleOptions = {
    saturation: 0.5,
    lightness: 0.5,
    snapshotOffset: 10,
    hueOffset: 0,
    hueTransition: 0,
    trailLength: 1,
    trailAttenuation: (x: number) => 1 - x,
    trailDiffusionScale: 0,
    trailDiffusionTransition: (x: number) => 1 - x,
  };

  needsUpdate = false;

  constructor() {
    super();
    this.fog = new THREE.FogExp2(0x000000, 0.0003);
    this.history = new History(allocateDot, 180);

    this.particles = new Particles(40000);
    this.add(this.particles);

    this.prisms = new Prisms(40000);
    this.add(this.prisms);
  }

  update(): void {
    if (!this.needsUpdate) return;
    this.needsUpdate = false;

    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const hsla = new THREE.Vector4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();

    if (this.prisms.visible) {
      const prisms = this.prisms.beginUpdate();
      const {
        trailLength, trailStep, trailAttenuation,
        snapshotOffset, hueOffset, hueTransition, saturation, lightness
      } = this.prismOptions;
      for (let i = 0; i < trailLength; i += Math.floor(trailStep)) {
        const t = i / (trailLength - 0.9);
        const l = trailAttenuation(t);
        for (const dot of this.history.snapshot(i + snapshotOffset)) {
          if (dot.opacity == 0) continue;
          position.copy(dot.position);
          rotation
            .copy(dot.rotation)
            .multiply(q.setFromEuler(e.set(0, 0, Math.PI * 0.02 * dot.lifeTime)));
          const hue = (1 + (dot.hue + hueOffset + hueTransition * i / trailLength) / 360) % 1;
          const alpha = dot.opacity * Math.min(1, dot.lifeTime * 0.1);
          hsla.set(hue, saturation, lightness * l, alpha);
          prisms.put(position, rotation, hsla);
        }
      }
      prisms.complete();
    }

    if (this.particles.visible) {
      const particles = this.particles.beginUpdate();
      const {
        trailLength, trailAttenuation, trailDiffusionScale, trailDiffusionTransition,
        snapshotOffset, hueOffset, hueTransition, saturation, lightness,
      } = this.particleOptions;
      for (let i = 0; i < trailLength; i++) {
        const t = i / (trailLength - 0.9);
        const l = trailAttenuation(t);
        const f = (1 - trailDiffusionTransition(t)) * trailDiffusionScale;
        for (const dot of this.history.snapshot(i + snapshotOffset)) {
          if (dot.opacity == 0) continue;
          position.copy(dot.position).addScaledVector(dot.diffusion, f);
          const hue = (1 + (dot.hue + hueOffset + hueTransition * i / trailLength) / 360) % 1;
          const alpha = dot.opacity * Math.min(1, dot.lifeTime * 0.1);
          hsla.set(hue, saturation, lightness * l, alpha);
          particles.put(position, hsla);
        }
      }
      particles.complete();
    }
  }

  setSize(width: number, height: number): void {
    this.particles.setSize(width, height);
  }
}
