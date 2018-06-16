import * as THREE from 'three';

import * as pattern from './pattern';

export type Spec = {
  generation: number[];
  omni?: boolean;
  overlap?: boolean;
};

export abstract class Generator<M = {}> {
  abstract metadata(data: pattern.Pattern, spec: Spec): M;

  hasConflict(a?: { duration?: number, defer?: number }, b?: { duration?: number, defer?: number }): boolean {
    if (!a || !b || !a.duration || !b.duration) return false;
    const aa = a.defer || 0;
    const ba = b.defer || 0;
    const ab = aa + (a.duration || 1);
    const bb = ba + (b.duration || 1);
    return (aa <= ba && ba < ab) || (ba <= aa && aa < bb);
  }

  pattern(power: number, spec: Spec = { generation: [] }): pattern.Pattern<M> {
    const emits = 2 <= power;
    const baseSpeed = this.speed(emits, spec);
    const direction = this.direction(emits, spec);
    const [acceleration, speed] = this.acceleration(baseSpeed, emits, spec);
    const rotation = this.rotation(acceleration, spec);
    const emission = this.emission(power, spec);

    if (this.hasConflict(emission, acceleration) ||
        this.hasConflict(emission, rotation)) return this.pattern(power, spec);

    const data = { speed, direction, acceleration, rotation, emission };
    pattern.minify(data);
    const metadata = this.metadata(data, spec);
    return Object.assign(data, metadata);
  }

  speed(emits: boolean, spec: Spec): number {
    if (spec.generation.length == 0) return 0;
    return randf(1, 1.4) * (1 - spec.generation[0]*0.1);
  }

  direction(emits: boolean, spec: Spec): pattern.Direction {
    if (!emits || spec.generation.length == 0 || spec.omni) return 'forward';
    return randf() < 0.3 ? 'backward' : 'forward';
  }

  acceleration(baseSpeed: number, emits: boolean, spec: Spec): [pattern.Acceleration, number] {
    if (spec.generation.length == 0) return [{ scale: 1 }, baseSpeed];

    const r = randf();
    const s = 1 + spec.generation[0] * 0.2;

    if (r < 0.05) {
      const defer = randi(40, 120);
      const scale = 20;
      return [{ scale, defer }, baseSpeed * 1.4 / scale];

    } else if (r < 0.2) {
      const defer = randi(0, 20) + (emits ? 20 : 0);
      const scale = randf(4, 5, 3) - (emits ? 1.5 : 0);
      const duration = randi(20, 40, 3);
      return [{ scale, defer, duration }, baseSpeed * 1.2 / scale];

    } else if (r < 0.3*s && emits) {
      const defer = randi(5, 20);
      const scale = 0.01;
      return [{ scale, defer }, baseSpeed * 2];

    } else if (r < 0.4*s) {
      const defer = randi(0, 20);
      const scale = randf(0.2 + defer*0.01, 0.6, 3);
      const duration = randi(20, 40, 3);
      return [{ scale, defer, duration }, baseSpeed * (emits ? 0.7 : 0.8) / scale];
    }

    return [{ scale: 1 }, baseSpeed];
  }

  rotation(acceleration: pattern.Acceleration, spec: Spec): pattern.Rotation {
    if (spec.generation.length == 0) return {};
    if (randf() < 0.5) return {};

    const pitch = (randf() < 0.3) ? 0 : randf(0, Math.PI*2, 1, 6);
    const yaw = (randf() < 0.3) ? 0 : randf(0, Math.PI*2, 1, 4);
    const roll = (randf() < 0.3) ? 0 : randf(0, Math.PI*2, 1, 4);
    const large = Math.abs(pitch) > Math.PI/2 || Math.abs(yaw) > Math.PI/2 || Math.abs(roll) > Math.PI;

    return {
      pitch, yaw, roll,
      duration: large ? randi(60, 120) : randi(30, 60),
      easing: 'ease-out',
    };
  }

  reverse(rotation: pattern.Rotation): pattern.Rotation {
    const r = { ...rotation };
    if (r.pitch) r.pitch = -r.pitch;
    if (r.yaw) r.yaw = -r.yaw;
    if (r.roll) r.roll = -r.roll;
    return r;
  }

  emission(power: number, spec: Spec): pattern.Emission<M> | undefined {
    if (power < 2) return undefined;

    const isRoot = spec.generation.length == 0;
    const index = isRoot ? 0 : spec.generation[0];
    const depth = spec.generation.reduce((a, b) => a + 1 + b, 0);

    const numMax = THREE.Math.clamp(power / Math.max(1, 3 - depth), 2, 64);
    const numMin = Math.min(2 + depth, numMax);
    let num = randi(numMin, numMax, 1, 1 / (1 + depth*3));
    const formations = this.emissionFormations(spec);
    const formation = formations[randi(0, formations.length)];
    const patternNum = 1 + randi(0, 3, 1, 0.7 + depth*2);
    const sequential = randf() < 0.35 - index*0.1;
    let duration = sequential ? randi(1, 6)*10 : undefined;
    let chunk = (duration && randf() < 0.15) ? patternNum : 1;
    let parallel = (duration && randf() < 0.5) ? randi(1, 5) : 1;
    const defer = isRoot ? 0 : randi(3, 7)*10 + index*40;
    const range = this.emissionRange(formation);

    if (formation == 'id') {
      if (isRoot || spec.overlap || !duration) return this.emission(power, spec);
      if (3 < num) num = 2 + num % 2;
      chunk = 1;
      parallel = 1;
      duration = randi(2, 9, 3) * 10;
    } else {
      if (patternNum != 1 && num / patternNum / parallel < 4) return this.emission(power, spec);
    }

    if ((num % patternNum != 0 /* && num % chunk != 0 */) ||
        (duration && duration < num / (chunk*parallel) * (formation == 'id' ? 5 : 1) * (patternNum == 1 ? 3 : 1)) ||
        (parallel != 1 && (num < parallel*2 || parallel % patternNum != 0 || num % parallel != 0)) ||
        (range && (isRoot || num / range > 6))) return this.emission(power, spec);

    const omni = range == undefined && formation != 'id';
    const overlap = formation == 'id';

    const pattern = new Array(patternNum);
    for (let i=0; i<pattern.length; ++i) {
      pattern[i] = this.pattern(power / num, {
        generation: [i, ...spec.generation],
        omni,
        overlap,
      });
    }

    if (pattern.length == 1 && pattern[0].rotation && num % 2 == 0 && randf() < 0.5) {
      pattern.push({ ...pattern[0], rotation: this.reverse(pattern[0].rotation) });
    }

    return { num, chunk, parallel, formation, range, pattern, duration, defer };
  }

  emissionFormations(spec: Spec): pattern.Formation[] {
    if (spec.generation.length == 0) return ['horizontal'];
    switch (spec.generation[0]) {
      case 0:
        return ['id', 'horizontal', 'vertical', 'split'];
      case 1:
        return ['id', 'horizontal', 'vertical'];
      case 2:
      default:
        return ['horizontal', 'vertical'];
    }
  }

  emissionRange(formation: pattern.Formation): number | undefined {
    if (formation == 'horizontal' && randf() < 0.5) return undefined;
    if (formation == 'split' && randf() < 0.5) return undefined;
    switch (formation) {
      case 'horizontal':
        return Math.PI*randf(0.2, 0.8);
      case 'vertical':
        return Math.PI*randf(0.1, 0.9);
      case 'split':
      case 'splash':
        return Math.PI*randf(0.2, 0.4);
      default:
        return undefined;
    }
  }
}

function randf(l = 0, r = 1, iterations = 1, bias = 1): number {
  let t = 0;
  for (let i = 0; i < iterations; ++i) t += Math.random() ** bias;
  t /= iterations;
  return l + (r - l) * t;
}

function randi(l: number, r: number, iterations = 1, bias = 1): number {
  return Math.floor(randf(l, r, iterations, bias));
}
