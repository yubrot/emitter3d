import * as THREE from 'three';

import { Behavior, Bullet, CommonBullet } from '../Bullet.ts';
import * as rudder from './rudder.ts';

export const none: Behavior = () => {};

export function range(n: number, angle: number): (idx: number) => number {
  if (n == 1) return _ => 0;
  if (angle == Math.PI*2) angle = Math.PI*2/n*(n-1);
  return i => -angle/2 + angle/(n-1) * i;
}

export function creator(
  bullets: (() => CommonBullet)[],
  gens: number[],
  engines: Behavior[],
  rudders: Behavior[],
  triggers: Behavior[]
): (idx: number) => CommonBullet {
  return idx => {
    const child = bullets[idx % bullets.length]();
    child.generation = gens[idx % gens.length];
    child.engine = engines[idx % engines.length];
    child.rudder = rudders[idx % rudders.length];
    child.trigger = triggers[idx % triggers.length];
    return child;
  };
}

export function xy<E extends Bullet>(creator: (idx: number) => E, frame: number, n: number, base: number, angle: number): Behavior {
  const rad = range(n, angle);
  return function() {
    if (this.frame != frame) return;
    for (let i=0; i<n; ++i) {
      const child = this.emit(creator(i));
      child.yaw(base + rad(i));
    }
    this.die();
  };
}

export function xz<E extends Bullet>(creator: (idx: number) => E, frame: number, n: number, base: number, angle: number): Behavior {
  const rad = range(n, angle);
  return function() {
    if (this.frame != frame) return;
    for (let i=0; i<n; ++i) {
      const child = this.emit(creator(i));
      child.pitch(base + rad(i));
    }
    this.die();
  };
}

export function yz<E extends Bullet>(creator: (idx: number) => E, frame: number, n: number, base: number): Behavior {
  const rad = range(n, Math.PI*2);
  return function() {
    if (this.frame != frame) return;
    for (let i=0; i<n; ++i) {
      const child = this.emit(creator(i));
      child.roll(rad(i));
      child.pitch(base);
    }
    this.die();
  };
}

export function yzs<E extends Bullet>(creator: (idx: number) => E, startFrame: number, n: number, interval: number, n1: number, direction: number): Behavior {
  const rad = range(n, Math.PI*2);
  return function() {
    if (this.frame < startFrame) return;
    if ((this.frame - startFrame) % interval != 0) return;
    const i = (this.frame - startFrame) / interval;
    if (i * n1 < n) {
      for (let j=0; j<n1; ++j) {
        const i1 = i + j*n/n1;
        const child = this.emit(creator(i1));
        child.roll(rad(i1) * direction);
        child.pitch(Math.PI/2);
      }
      if (i * n1 < n - 1) return;
    }
    this.die();
  };
}

function adjust(bullet: Bullet, base: string) {
  switch (base) {
    case 'forward':
      break;
    case 'back':
      bullet.yaw(-Math.PI);
      break;
    case 'target':
      if (bullet.nearestTarget)
        bullet.direction.setToLookAt(bullet.position, bullet.nearestTarget, bullet.up);
      break;
  }
}

export function rapid<E extends Bullet>(creator: (idx: number) => E, startFrame: number, interval: number, n: number, base: string): Behavior {
  return function() {
    if (this.frame < startFrame) return;
    if ((this.frame - startFrame) % interval != 0) return;
    const i = (this.frame - startFrame) / interval;
    if (i < n) {
      const child = this.emit(creator(i));
      adjust(child, base);
      if (i < n - 1) return;
    }
    this.die();
  };
}

export function splash(creator: (idx: number) => CommonBullet, startFrame: number, interval: number, n: number, base: string, angle = Math.PI*0.4, strength = Math.PI*0.02): Behavior {
  return function() {
    if (this.frame < startFrame) return;
    if ((this.frame - startFrame) % interval != 0) return;
    const i = (this.frame - startFrame) / interval;
    if (i < n) {
      const child = this.emit(creator(i));
      adjust(child, base);
      child.roll(THREE.Math.randFloat(0, Math.PI*2));
      child.pitch(THREE.Math.randFloat(0, angle));
      child.rudder = rudder.pitch(-strength * Math.random());
      if (i < n - 1) return;
    }
    this.die();
  };
}
