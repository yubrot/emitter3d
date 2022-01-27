import * as THREE from 'three';

import { History } from './aux/history';
import { Particles } from './particles';
import { Prisms } from './prisms';
import { Grid } from './grid';
import { Camera } from './camera';

export type Dot = {
  seed: number;
  lifeTime: number;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  opacity: number;
  hue: number;
};

function allocateDot(): Dot {
  return {
    seed: 0,
    lifeTime: 0,
    position: new THREE.Vector3(),
    rotation: new THREE.Quaternion(),
    hue: 0,
    opacity: 0,
  };
}

export class Scene extends THREE.Scene {
  readonly history: History<Dot>;
  readonly prisms: Prisms;
  readonly particles: Particles;
  readonly grid: Grid;

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
    sizeTransition: (x: number) => 1 - x,
    snapshotOffset: 10,
    hueOffset: 0,
    hueTransition: 0,
    trailLength: 1,
    trailAttenuation: (x: number) => 1 - x,
    trailDiffusionScale: 0,
    trailDiffusionTransition: (x: number) => 1 - x,
    trailDiffusionShakiness: 0,
  };

  stateNeedsUpdate = false;

  constructor(camera: Camera) {
    super();
    this.fog = new THREE.FogExp2(0x000000, 0.003);
    this.history = new History(allocateDot, 300);

    this.particles = new Particles(80000);
    this.add(this.particles);

    this.prisms = new Prisms(80000);
    this.add(this.prisms);

    this.grid = new Grid();
    this.add(this.grid);

    this.particles.mat.setCameraClip(camera.near, camera.far);
  }

  update(): void {
    if (this.stateNeedsUpdate) {
      this.stateNeedsUpdate = false;
      this.updateState();
    }
  }

  updateState(): void {
    const rotation = new THREE.Quaternion();
    const hsla = new THREE.Vector4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();

    if (this.prisms.visible) {
      const {
        trailLength,
        trailStep,
        trailAttenuation,
        snapshotOffset,
        hueOffset,
        hueTransition,
        saturation,
        lightness,
      } = this.prismOptions;

      const prisms = this.prisms.beginUpdateState();
      for (let i = 0; i < trailLength; i += Math.floor(trailStep)) {
        const t = i / (trailLength - 0.9);
        const l = trailAttenuation(t);
        for (const dot of this.history.snapshot(i + snapshotOffset)) {
          if (dot.opacity == 0) continue;
          rotation
            .copy(dot.rotation)
            .multiply(q.setFromEuler(e.set(0, 0, Math.PI * 0.02 * dot.lifeTime)));
          const hue = (dot.hue + hueOffset + (hueTransition * i) / trailLength) / 360;
          hsla.set(hue, saturation, lightness * l, dot.opacity);
          prisms.put(dot.position, rotation, hsla);
        }
      }
      prisms.complete();
    }

    if (this.particles.visible) {
      const {
        saturation,
        lightness,
        sizeTransition,
        snapshotOffset,
        hueOffset,
        hueTransition,
        trailLength,
        trailAttenuation,
        trailDiffusionScale,
        trailDiffusionTransition,
        trailDiffusionShakiness,
      } = this.particleOptions;

      const particles = this.particles.beginUpdateState();
      for (let i = 0; i < trailLength; i++) {
        const t = i / (trailLength - 0.9);
        const l = trailAttenuation(t);
        const f = (1 - trailDiffusionTransition(t)) * trailDiffusionScale;
        const s = sizeTransition(t);
        for (const dot of this.history.snapshot(i + snapshotOffset)) {
          if (dot.opacity == 0) continue;
          const hue = (dot.hue + hueOffset + (hueTransition * i) / trailLength) / 360;
          hsla.set(hue, saturation, lightness * l, dot.opacity);
          particles.put(
            dot.position,
            hsla,
            f,
            dot.lifeTime * trailDiffusionShakiness + dot.seed * 100,
            s
          );
        }
      }
      particles.complete();
    }
  }

  setSize(width: number, height: number): void {
    this.particles.mat.setSize(width, height);
  }

  setYOffset(offset: number): void {
    this.grid.position.set(0, offset, 0);
  }
}
