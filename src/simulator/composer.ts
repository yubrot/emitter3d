import * as easing from './easing';
import * as formation from './formation';
import { RotateParams, Particle, Feature, Field } from './entity';
import * as feature from './feature';
import * as pattern from './pattern';

export type Launcher<M = {}> = (parent: Particle<M>) => Particle<M>;

export class Composer<M = {}> {
  pattern(data: pattern.Pattern<M>): Launcher<M> {
    const speed = data.speed;
    const baseRotation = this.direction(data.direction);
    const features = feature.compose(...this.patternFeatures(data));

    return parent => {
      const child = new Particle(parent.field, features, data /* M extends Pattern<M> */);
      child.position.copy(parent.position);
      child.rotation.copy(parent.rotation);
      child.speed = speed === undefined ? parent.speed : speed;
      child.rotate(baseRotation);
      return child;
    };
  }

  patternFeatures(p: pattern.Pattern<M>): Feature<M>[] {
    const features: Feature<M>[] = [];

    for (const a of pattern.each(p.acceleration)) features.push(this.acceleration(a));
    for (const t of pattern.each(p.translation)) features.push(this.translation(t));
    for (const r of pattern.each(p.rotation)) features.push(this.rotation(r));

    const completionTime = Math.max(...pattern.each(p.emission).map(pattern.completionTime));

    for (const e of pattern.each(p.emission)) features.push(this.emission(e, pattern.completionTime(e) == completionTime));

    return features;
  }

  direction(type?: pattern.Direction): RotateParams {
    switch (type) {
      case 'backward':
        return { pitch: Math.PI };
      case 'forward':
      default:
        return {};
    }
  }

  acceleration({ scale, duration, defer }: pattern.Acceleration): Feature {
    return feature.accelerator(scale, duration, defer);
  }

  translation({ x, y, z, duration, defer, easing }: pattern.Translation): Feature {
    return feature.translator({ x, y, z }, duration, defer, this.easing(easing));
  }

  rotation({ pitch, yaw, roll, order, duration, defer, easing }: pattern.Rotation): Feature {
    return feature.rotator({ pitch, yaw, roll, order }, duration, defer, this.easing(easing));
  }

  emission({ num, formation, chunk, parallel, range, pattern, duration, defer }: pattern.Emission<M>, die = true): Feature<M> {
    if (!Array.isArray(pattern)) pattern = [pattern];
    if (num == 0 || pattern.length == 0) return feature.none;

    const launchers = pattern.map(p => this.pattern(p));
    const rotations = this.formation(num, formation, range);

    let features = rotations.map((rotation, index) => {
      const launcher = launchers[index % launchers.length];
      return (parent: Particle<M>) => {
        const child = launcher(parent);
        child.rotate(rotation);
      };
    });

    if (chunk && 1 < chunk)
      features = arrayChunk(features, chunk, 0.4).map(features => feature.compose(...features));

    if (parallel && 1 < parallel)
      features = arrayParallel(features, parallel).map(features => feature.compose(...features));

    return feature.trigger(features, duration, defer, die);
  }

  formation(num: number, type?: pattern.Formation, range?: number): RotateParams[] {
    function getFormation(): formation.Formation {
      switch (type) {
        case 'horizontal':
          return formation.horizontal(num, range === undefined ? Math.PI*2 : range);
        case 'vertical':
          return formation.vertical(num, range === undefined ? Math.PI*0.3 : range);
        case 'split':
          return formation.split(num, range === undefined ? Math.PI*0.49 : range);
        case 'splash':
          return formation.splash(num, range === undefined ? Math.PI*0.25 : range);
        case 'id':
        default:
          return formation.id(num);
      }
    }

    const { units, order } = getFormation();
    if (!order) return units;
    return units.map(unit => ({ order, ...unit }));
  }

  easing(type?: pattern.Easing): easing.Function | undefined {
    switch (type) {
      case 'ease-in':
        return easing.easeIn;
      case 'ease-out':
        return easing.easeOut;
      case 'ease-in-out':
        return easing.easeInOut;
      case 'linear':
        return easing.linear;
      default:
        return undefined;
    }
  }
}

function arrayChunk<A>(array: A[], count: number, unifyingRemainderThreshold = 0): A[][] {
  const result: A[][] = [];

  for (let i = 0; i < array.length; i += count) {
    result.push(array.slice(i, i + count));
  }

  const remainder = array.length % count;
  if (2 <= result.length && 0 < remainder && remainder <= count*unifyingRemainderThreshold) {
    const remainders = result.pop();
    result[result.length-1].push(...remainders!);
  }

  return result;
}

function arrayParallel<A>(array: A[], count: number): A[][] {
  const span = Math.ceil(array.length / count);
  const chunks = arrayChunk(array, span);
  const remainder = array.length % span;
  return chunks[0].map((_, i) => {
    const chunk = chunks.map(chunk => chunk[i]);
    if (remainder && remainder <= i) chunk.pop();
    return chunk;
  });
}
