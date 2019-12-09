import { Particle, Behavior, Field } from './particle';

export class NopBehavior extends Behavior { }

export class SetBehavior extends Behavior {
  constructor(
    readonly targetValue: number,
    readonly getValue: (p: Particle) => number,
    readonly setValue: (p: Particle, value: number) => void,
  ) {
    super();
  }

  private initialValue!: number;

  update(field: Field, particle: Particle, start: number, end: number): number {
    if (start == 0) this.initialValue = this.getValue(particle);
    const r = this.easing.at(end, this.lifespan);
    this.setValue(particle, this.initialValue * (1 - r) + this.targetValue * r);
    return super.update(field, particle, start, end);
  }
}

export class AddBehavior extends Behavior {
  constructor(
    readonly value: number,
    readonly addValue: (p: Particle, value: number) => void,
  ) {
    super();
  }

  update(field: Field, particle: Particle, start: number, end: number): number {
    const r = this.easing.delta(start, end, this.lifespan);
    this.addValue(particle, this.value * r);
    return super.update(field, particle, start, end);
  }
}

export class MultiplyBehavior extends Behavior {
  constructor(
    readonly scale: number,
    readonly multiplyScale: (p: Particle, scale: number) => void,
  ) {
    super();
  }

  update(field: Field, particle: Particle, start: number, end: number): number {
    const r = this.easing.delta(start, end, this.lifespan);
    this.multiplyScale(particle, this.scale ** r);
    return super.update(field, particle, start, end);
  }
}

export class SwitchBehavior extends Behavior {
  constructor(readonly on: (p: Particle) => void) {
    super();
  }

  update(field: Field, particle: Particle, start: number, end: number): number {
    const r = this.easing.at(end, this.lifespan);
    if (r == 1) this.on(particle);
    return super.update(field, particle, start, end);
  }
}

export class TranslateBehavior extends Behavior {
  constructor(readonly x: number, readonly y: number, readonly z: number) {
    super();
  }

  update(field: Field, particle: Particle, start: number, end: number): number {
    const r = this.easing.delta(start, end, this.lifespan);
    particle.translate(this.x * r, this.y * r, this.z * r);
    return super.update(field, particle, start, end);
  }
}

export class RotateBehavior extends Behavior {
  constructor(readonly xdeg: number, readonly ydeg: number, readonly zdeg: number) {
    super();
  }

  update(field: Field, particle: Particle, start: number, end: number): number {
    const r = this.easing.delta(start, end, this.lifespan);
    particle.rotate(this.xdeg * r, this.ydeg * r, this.zdeg * r);
    return super.update(field, particle, start, end);
  }
}

export class EmitBehavior extends Behavior {
  constructor(
    count: number,
    times: number,
    parallel: number,
    readonly behaviorGen: (index: number) => Behavior
  ) {
    super();

    this.indices =
      [...Array(Math.floor(times))].map((_, t) =>
        [...Array(Math.floor(count))].map((_, n) =>
          [...Array(Math.floor(parallel))].map((_, p) =>
            n + count * t + times * count * p)));
  }

  readonly indices: number[][][];

  update(field: Field, particle: Particle, start: number, end: number): number {
    const l = this.easing.at(start, this.lifespan) * this.indices.length;
    const r = this.easing.at(end, this.lifespan) * this.indices.length;
    for (let i = Math.floor(r); l < i; --i) {
      for (const indices of this.indices[i - 1]) {
        for (const index of indices) {
          const behavior = this.behaviorGen(index);
          field.add(particle.clone(behavior));
        }
      }
    }
    return super.update(field, particle, start, end);
  }
}

abstract class ContinuousBehavior extends Behavior {
  constructor() {
    super();

    // Defaults to complete all provided behaviors
    this.lifespan = Infinity;
  }

  abstract getNext(first: boolean): Behavior | null;

  private offset!: number;
  private current!: Behavior | null;

  update(field: Field, particle: Particle, start: number, end: number): number {
    if (start == 0) {
      this.offset = 0;
      this.current = this.getNext(true);
    }

    const term = Math.min(this.lifespan, end);

    for (let i = 0; i < 100 && this.current != null; ++i) {
      // There is no more time for this update call
      if (start >= term) break;

      const t = this.current.update(field, particle, start - this.offset, term - this.offset);

      // `current` execution continues to next update call
      if (t < 0) break;

      start = term - t;
      this.offset = start;
      this.current = this.getNext(false);
    }

    return this.current ? super.update(field, particle, start, end) : (end - start);
  }
}

export class LoopBehavior extends ContinuousBehavior {
  constructor(readonly body: Behavior) {
    super();
  }

  getNext(first: boolean): Behavior | null {
    return this.body;
  }
}

export class RepeatBehavior extends ContinuousBehavior {
  constructor(readonly body: Behavior, readonly limit: number) {
    super();
  }

  private count!: number;

  getNext(first: boolean): Behavior | null {
    this.count = first ? 0 : this.count + 1;
    return this.count < this.limit ? this.body : null;
  }
}

export class SequentialBehavior extends ContinuousBehavior {
  constructor(readonly behaviors: Behavior[]) {
    super();
  }

  private index!: number;

  getNext(first: boolean): Behavior | null {
    this.index = first ? 0 : this.index + 1;
    return (this.index < this.behaviors.length) ? this.behaviors[this.index] : null;
  }
}

export class ParallelBehavior extends Behavior {
  readonly jobs: { behavior: Behavior, remainingTime: number }[];

  constructor(behaviors: Behavior[]) {
    super();
    this.jobs = behaviors.map(behavior => ({ behavior, remainingTime: -1 }));
  }

  update(field: Field, particle: Particle, start: number, end: number): number {
    for (const j of this.jobs) {
      if (start == 0) j.remainingTime = -1;
      if (j.remainingTime < 0) j.remainingTime = j.behavior.update(field, particle, start, end);
    }

    return this.jobs.reduce(
      (a, b) => Math.min(a, b.remainingTime),
      super.update(field, particle, start, end));
  }
}
