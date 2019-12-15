import * as THREE from 'three';

import { History } from './aux/history';
import { Points } from './3d/points';
import { Instances } from './3d/instances';
import * as models from './3d/models';

export type Particle = {
  lifeTime: number;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  fluctuation: THREE.Vector3;
  opacity: number;
  hue: number;
};

function allocateParticle(): Particle {
  return {
    lifeTime: 0,
    position: new THREE.Vector3(),
    rotation: new THREE.Quaternion(),
    fluctuation: new THREE.Vector3(),
    hue: 0,
    opacity: 0,
  };
}

export class Scene extends THREE.Scene {
  readonly history: History<Particle>;
  readonly points: Points;
  readonly prisms: Instances;

  needsUpdate = false;

  particleSaturation = 0.9;
  particleLightness = 0.7;
  trailLength = 1;
  trailStep = 1;
  trailFluctuationScale = 0;
  trailFluctuationBias = 0;
  trailAttenuationBias = 0;

  constructor() {
    super();
    this.fog = new THREE.FogExp2(0x000000, 0.0003);
    this.history = new History(allocateParticle, 60);

    this.points = new Points(40000);
    this.add(this.points);

    this.prisms = new Instances(40000, models.prism());
    this.add(this.prisms);
  }

  update(deltaTime: number): void {
    if (this.needsUpdate) {
      this.needsUpdate = false;
      this.updateParticles();
    }
  }

  private updateParticles(): void {
    const position = new THREE.Vector3();
    const color = new THREE.Color();
    const p = new THREE.Quaternion();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const points = this.points.beginUpdate();
    const prisms = this.prisms.beginUpdate();
    for (let i = 0; i < this.trailLength; i += Math.floor(this.trailStep)) {
      const t = i / (this.trailLength - 0.9);
      for (const particle of this.history.snapshot(i)) {
        if (particle.opacity == 0) continue;
        const fluctuation = this.trailFluctuationScale * t ** Math.exp(this.trailFluctuationBias);
        const opacity = 1 - t ** Math.exp(this.trailAttenuationBias);
        position.copy(particle.position);
        color.setHSL(
          (1 + particle.hue / 360 + position.y * 0.001) % 1,
          this.particleSaturation,
          this.particleLightness * particle.opacity * opacity * Math.min(1, particle.lifeTime * 0.03));
        if (this.prisms.visible) {
          p.copy(particle.rotation).multiply(q.setFromEuler(e.set(0, 0, Math.PI * 0.02 * particle.lifeTime)));
          prisms.put(position, p, color);
        }
        if (this.points.visible) {
          position.addScaledVector(particle.fluctuation, fluctuation);
          points.put(position, color);
        }
      }
    }
    points.complete();
    prisms.complete();
  }
}
