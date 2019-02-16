import * as THREE from 'three';

import { History } from './aux/history';
import { Space } from './3d/space';
import { Points } from './3d/points';
import { Objects, Model as ObjectModel } from './3d/objects';

export type ParticleType = 'points' | 'objects';

export const particleTypes: ParticleType[] = ['points', 'objects'];

export type Particle = {
  lifeTime: number;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  fluctuation: THREE.Vector3;
  opacity: number;
  hue: number;
  objectModel: ObjectModel | 'meta';
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
  readonly objects: Objects;

  needsUpdate = false;

  trailLength = 1;
  trailStep = 1;
  trailOpacity = 1;
  trailAttenuation = 1;
  trailFluctuation = 1;
  saturation = 0.9;
  lightness = 0.7;

  set particleType(type: ParticleType) {
    this.points.visible = type == 'points';
    this.objects.visible = type == 'objects';
  }

  constructor() {
    super();
    this.fog = new THREE.FogExp2(0x000000, 0.0003);
    this.history = new History(allocateParticle, 60);

    this.space = new Space(600, 4000, 10000, 100, 2);
    this.add(this.space);

    this.points = new Points(40000);
    this.points.visible = false;
    this.add(this.points);

    this.objects = new Objects(10000);
    this.objects.visible = false;
    this.add(this.objects);
  }

  update(deltaTime: number): void {
    if (this.needsUpdate) {
      this.needsUpdate = false;
      if (this.points.visible) this.updatePoints();
      if (this.objects.visible) this.updateObjects();
    }
  }

  private updatePoints(): void {
    const updater = this.points.beginUpdate();
    this.iterateParticles((particle, position, color) => updater.put(position, color));
    updater.complete();
  }

  private updateObjects(): void {
    const updater = this.objects.beginUpdate();
    this.iterateParticles((particle, position, color) => updater.put(particle.objectModel as ObjectModel, particle.lifeTime, position, particle.rotation, color));
    updater.complete();
  }

  private iterateParticles(handler: (particle: Particle, position: THREE.Vector3, color: THREE.Color) => void): void {
    const position = new THREE.Vector3();
    const color = new THREE.Color();
    let opacity = 1;
    let fluctuation = 1;
    for (const snapshot of this.history.snapshots(0, this.trailLength, Math.floor(this.trailStep))) {
      for (const particle of snapshot) {
        if (particle.objectModel == 'meta') continue;

        position.copy(particle.position).addScaledVector(particle.fluctuation, 1 - fluctuation);
        color.setHSL(
          (1 + particle.hue/360 + position.y * 0.001) % 1,
          this.saturation,
          this.lightness * Math.min(1, 0.1 + particle.lifeTime*0.03) * particle.opacity * opacity);
        handler(particle, position, color);
      }
      if (opacity == 1) opacity *= this.trailOpacity;
      opacity *= this.trailAttenuation;
      fluctuation *= this.trailFluctuation;
    }
  }
}
