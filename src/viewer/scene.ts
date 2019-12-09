import * as THREE from 'three';

import { History } from './aux/history';
import { Space } from './3d/space';
import { Points } from './3d/points';
import { Instances } from './3d/instances';
import * as models from './3d/models';

export type ParticleMode = 'points' | 'crystal' | 'prism';

export const particleModes: ParticleMode[] = ['points', 'crystal', 'prism'];

export type ObjectModel = 'missile' | 'claw' | 'arrow' | 'meta';

export type Particle = {
  lifeTime: number;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  fluctuation: THREE.Vector3;
  opacity: number;
  hue: number;
  objectModel: ObjectModel;
};

function allocateParticle(): Particle {
  return {
    lifeTime: 0,
    position: new THREE.Vector3(),
    rotation: new THREE.Quaternion(),
    fluctuation: new THREE.Vector3(),
    objectModel: 'meta',
    hue: 0,
    opacity: 0,
  };
}

export class Scene extends THREE.Scene {
  readonly history: History<Particle>;
  readonly space: Space;
  readonly points: Points;
  readonly missiles: Instances;
  readonly claws: Instances;
  readonly arrows: Instances;
  readonly prisms: Instances;

  needsUpdate = false;

  particleMode: ParticleMode = 'points';
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

    this.space = new Space(600, 4000, 10000, 200, 2);
    this.add(this.space);

    this.points = new Points(40000);
    this.add(this.points);

    this.missiles = new Instances(10000, models.missile());
    this.add(this.missiles);

    this.claws = new Instances(10000, models.claw());
    this.add(this.claws);

    this.arrows = new Instances(10000, models.arrow());
    this.add(this.arrows);

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
    switch (this.particleMode) {
      case 'points': {
        this.points.visible = true;
        this.arrows.visible = this.missiles.visible = this.claws.visible = this.prisms.visible = false;
        const points = this.points.beginUpdate();
        this.iterateParticles((particle, position, color) => {
          if (particle.objectModel == 'meta') return;
          points.put(position, color);
        });
        points.complete();
        break;
      }
      case 'crystal': {
        this.arrows.visible = this.missiles.visible = this.claws.visible = true;
        this.points.visible = this.prisms.visible = false;
        const missiles = this.missiles.beginUpdate();
        const claws = this.claws.beginUpdate();
        const arrows = this.arrows.beginUpdate();
        const p = new THREE.Quaternion();
        const q = new THREE.Quaternion();
        const e = new THREE.Euler();
        this.iterateParticles((particle, position, color) => {
          switch (particle.objectModel) {
            case 'missile':
              p.copy(particle.rotation).multiply(q.setFromEuler(e.set(0, 0, Math.PI * 0.02 * particle.lifeTime)));
              missiles.put(position, p, color);
              break;
            case 'arrow':
              p.copy(particle.rotation).multiply(q.setFromEuler(e.set(0, 0, Math.PI * 0.01 * particle.lifeTime)));
              arrows.put(position, p, color);
              break;
            case 'claw':
              p.copy(particle.rotation).multiply(q.setFromEuler(e.set(0, 0, Math.PI * 0.01 * particle.lifeTime)));
              claws.put(position, p, color);
              break;
          }
        });
        missiles.complete();
        arrows.complete();
        claws.complete();
        break;
      }
      case 'prism': {
        this.prisms.visible = true;
        this.points.visible = this.arrows.visible = this.missiles.visible = this.claws.visible = false;
        const prisms = this.prisms.beginUpdate();
        const p = new THREE.Quaternion();
        const q = new THREE.Quaternion();
        const e = new THREE.Euler();
        this.iterateParticles((particle, position, color) => {
          if (particle.objectModel == 'meta') return;
          p.copy(particle.rotation).multiply(q.setFromEuler(e.set(0, 0, Math.PI * 0.02 * particle.lifeTime)));
          prisms.put(position, p, color);
        });
        prisms.complete();
        break;
      }
    }
  }

  private iterateParticles(handler: (particle: Particle, position: THREE.Vector3, color: THREE.Color) => void): void {
    const position = new THREE.Vector3();
    const color = new THREE.Color();

    for (let i = 0; i < this.trailLength; i += Math.floor(this.trailStep)) {
      const t = i / (this.trailLength - 0.9);
      for (const particle of this.history.snapshot(i)) {
        const fluctuation = this.trailFluctuationScale * t ** Math.exp(this.trailFluctuationBias);
        const opacity = 1 - t ** Math.exp(this.trailAttenuationBias);
        position.copy(particle.position).addScaledVector(particle.fluctuation, fluctuation);
        color.setHSL(
          (1 + particle.hue / 360 + position.y * 0.001) % 1,
          this.particleSaturation,
          this.particleLightness * particle.opacity * opacity * Math.min(1, particle.lifeTime * 0.03));
        handler(particle, position, color);
      }
    }
  }
}
