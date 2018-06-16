import * as THREE from 'three';

export type TranslateParams = {
  x?: number;
  y?: number;
  z?: number;
};

export type RotateParams = {
  pitch?: number;
  yaw?: number;
  roll?: number;
  order?: string;
};

export class Particle<A = any> {
  readonly position = new THREE.Vector3();
  readonly rotation = new THREE.Quaternion();
  frame = 0;
  speed = 0;
  opacity = 1;
  dead = false;

  constructor(readonly field: Field<A>, readonly feature: Feature<A>, readonly metadata: A) {
    field.onCreate(this);
  }

  private static readonly temporaryVector = new THREE.Vector3();

  translate({ x, y, z }: TranslateParams, s = 1): this {
    Particle.temporaryVector.set(x ? x*s : 0, y ? y*s : 0, z ? z*s : 0).applyQuaternion(this.rotation);
    this.position.add(Particle.temporaryVector);
    return this;
  }

  private static readonly temporaryQuaternion = new THREE.Quaternion();

  rotate({ pitch, yaw, roll, order }: RotateParams, s = 1): this {
    Particle.temporaryQuaternion.setFromEulerAngles(pitch ? pitch*s : 0, yaw ? yaw*s : 0, roll ? roll*s : 0, order);
    this.rotation.multiply(Particle.temporaryQuaternion);
    return this;
  }

  update(): void {
    ++this.frame;
    this.feature(this);
    this.translate({ z: this.speed });
  }
}

export type Feature<A = any> = (particle: Particle<A>) => void;

export class Field<A = any> implements Iterable<Particle<A>> {
  private living = new Set<Particle<A>>();
  private created = new Set<Particle<A>>();
  private died = new Set<Particle<A>>();

  onCreate(particle: Particle<A>): void {
    this.created.add(particle);
  }

  [Symbol.iterator](): IterableIterator<Particle<A>> {
    return this.living[Symbol.iterator]();
  }

  update(): void {
    for (const particle of this.created) this.living.add(particle);
    this.created.clear();

    for (const particle of this.living) {
      particle.update();
      if (particle.dead) this.died.add(particle);
    }

    for (const particle of this.died) this.living.delete(particle);
    this.died.clear();
  }
}
