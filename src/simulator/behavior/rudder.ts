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
  return function() {
    if (start <= this.frame && this.nearestTarget)
      this.turnTo(
        this.position.quaternionTo(this.nearestTarget, this.up),
        strength * (dampFactor ** (this.frame - start)));
  };
}
