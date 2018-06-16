import * as THREE from 'three';

import * as easing from './easing';
import { TranslateParams, RotateParams, Feature, Particle } from './entity';

export const none: Feature = particle => {};

export function vanisher(defer: number, duration: number): Feature {
  return particle => {
    if (particle.frame <= defer) return;
    particle.opacity *= 0.005 ** (1 / duration);
    particle.dead = particle.dead || (particle.frame > defer + duration);
  };
}

export function accelerator(scale: number, duration = 1, defer = 0): Feature {
  return particle => {
    if (particle.frame <= defer) return;
    if (particle.frame > defer + duration) return;
    particle.speed *= scale ** (1 / duration);
  };
}

export function translator(params: TranslateParams, duration = 1, defer = 0, ef = easing.linear): Feature {
  return particle => {
    if (particle.frame <= defer) return;
    if (particle.frame > defer + duration) return;
    particle.translate(params, easing.diff(ef, particle.frame - defer, duration));
  };
}

export function rotator(params: RotateParams, duration = 1, defer = 0, ef = easing.linear): Feature {
  return particle => {
    if (particle.frame <= defer) return;
    if (particle.frame > defer + duration) return;
    particle.rotate(params, easing.diff(ef, particle.frame - defer, duration));
  };
}

export function radar(target: THREE.Vector3, power = 0.04, decay = 0.97, defer = 0): Feature {
  const up = new THREE.Vector3();
  const rotationToTarget = new THREE.Quaternion();

  return particle => {
    if (particle.frame <= defer) return;
    up.set(0, 1, 0).applyQuaternion(particle.rotation);
    rotationToTarget.setToLookAt(particle.position, target, up);
    particle.rotation.rotateTowards(rotationToTarget, power * (decay ** (particle.frame - defer - 1)));
  };
}

export function compose<A>(...features: Feature<A>[]): Feature<A> {
  return particle => {
    for (const feature of features) feature(particle);
  };
}

export function trigger<A>(features: Feature<A>[], duration = 1, defer = 0, die = true): Feature<A> {
  const span = Math.ceil(duration / features.length) - 1;
  return particle => {
    if (particle.frame <= defer) return;
    if (particle.frame > defer + duration) return;

    const frame = particle.frame - defer;
    const a = features.length * (frame-1) * (duration - span) / (duration * duration);
    const b = features.length * frame * (duration - span) / (duration * duration);

    for (let i = Math.ceil(a); i < b; ++i) {
      features[i](particle);
    }

    particle.dead = particle.dead || (die && Math.ceil(b) == features.length);
  };
}
