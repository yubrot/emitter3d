import * as THREE from 'three';

import { Behavior } from '../Bullet.ts';

export const none: Behavior = () => {};

// xy
export function yaw(strength: number, start: number = 0, dampFactor: number = 0.97): Behavior {
  return function() {
    if (start <= this.frame)
      this.yaw(strength * (dampFactor ** (this.frame - start)));
  };
}

// xz
export function pitch(strength: number, start: number = 0, dampFactor: number = 0.97): Behavior {
  return function() {
    if (start <= this.frame)
      this.pitch(strength * (dampFactor ** (this.frame - start)));
  };
}

export function home(strength: number, start: number = 0, dampFactor: number = 0.97): Behavior {
  const rotationToTarget = new THREE.Quaternion();
  return function() {
    if (start <= this.frame && this.nearestTarget) {
      rotationToTarget.setToLookAt(this.position, this.nearestTarget, this.up);
      this.rotateTowards(rotationToTarget, strength * (dampFactor ** (this.frame - start)));
    }
  };
}
