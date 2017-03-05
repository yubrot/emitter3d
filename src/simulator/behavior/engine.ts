import { Behavior } from '../Bullet.ts';

export function uniform(speed: number): Behavior {
  return function() {
    this.speed = speed;
  };
}

export function accel(minSpeed: number, maxSpeed: number, start: number = 0, duration: number = 100): Behavior {
  const r = 1 - minSpeed / maxSpeed;
  if (duration < 1) duration = 1;
  return function() {
    this.speed = Math.min(1, Math.max(0, this.frame-start)**2 / duration**2) * maxSpeed * r + minSpeed;
  };
}

export function decel(firstSpeed: number, lowestSpeed: number, end: number = 20): Behavior {
  return function() {
    const damp = 0.97 ** Math.max(0, this.frame - end);
    const leave = Math.min(3, 1.01 ** Math.max(0, this.frame - end - 120));
    this.speed = Math.max(firstSpeed * damp, lowestSpeed * leave);
  };
}

export function quick(firstSpeed: number, lastSpeed: number = firstSpeed, stopStart: number = 10, stopDuration: number = 100): Behavior {
  return function() {
    this.speed =
      this.frame < stopStart ? firstSpeed :
      this.frame < stopStart + stopDuration ? 0 :
      lastSpeed;
  };
}
