import * as math from 'gl-matrix';
import { Easing } from './aux/easing';

export class Particle {
  readonly position = math.vec3.create();
  readonly rotation = math.quat.create();
  lifeTime = 0;
  speed = 0;
  opacity = 1;
  hue = 0;
  closed = false;

  constructor(readonly behavior: Behavior) { }

  clone(behavior: Behavior): Particle {
    const p = new Particle(behavior);
    math.vec3.copy(p.position, this.position);
    math.quat.copy(p.rotation, this.rotation);
    p.speed = this.speed;
    p.hue = this.hue;
    return p;
  }

  private static readonly tmpVec = math.vec3.create();

  translate(x: number, y: number, z: number): this {
    math.vec3.set(Particle.tmpVec, x, y, z);
    math.vec3.transformQuat(Particle.tmpVec, Particle.tmpVec, this.rotation);
    math.vec3.add(this.position, this.position, Particle.tmpVec);
    return this;
  }

  private static readonly tmpQuat = math.quat.create();

  rotate(xdeg: number, ydeg: number, zdeg: number): this {
    math.quat.fromEuler(Particle.tmpQuat, xdeg, ydeg, zdeg);
    math.quat.mul(this.rotation, this.rotation, Particle.tmpQuat);
    return this;
  }
}

export abstract class Behavior {
  easing: Easing = Easing.linear;
  lifespan: number = 0;

  // Constraint:
  // * First a caller must pass start = 0 to (re)initialize the behavior.
  // * A caller must not pass arguments that cannot satisfy `start < end`.
  // * A callee must return the remaining execution time if the execution of
  //   the behavior is completed, otherwise callee must return a negative number.
  update(field: Field, particle: Particle, start: number, end: number): number {
    return end - Math.max(this.lifespan, start);
  }
}

export class Field implements Iterable<Particle> {
  private readonly payload: Particle[] = [];
  private count = 0;

  get closed(): boolean {
    for (let i = 0; i < this.count; ++i) {
      if (!this.payload[i].closed) return false;
    }
    return true;
  }

  [Symbol.iterator](): IterableIterator<Particle> {
    return this.payload.slice(0, this.count)[Symbol.iterator]();
  }

  add(particle: Particle): void {
    if (this.count < this.payload.length) {
      this.payload[this.count] = particle;
    } else {
      this.payload.push(particle);
    }
    ++this.count;
  }

  clear(): void {
    this.count = 0;
  }

  update(deltaTime: number): void {
    if (deltaTime <= 0) return;

    for (let i = 0; i < this.count;) {
      const particle = this.payload[i];
      const start = particle.lifeTime;
      const end = particle.lifeTime = start + deltaTime;
      const dead = particle.behavior.update(this, particle, start, end) >= 0;
      particle.translate(0, 0, particle.speed * deltaTime);

      if (dead) {
        --this.count;
        this.payload[i] = this.payload[this.count];
      } else {
        ++i;
      }
    }
  }
}
