export type Pattern<M = {}> = {
  speed?: number;
  direction?: Direction;
  acceleration?: Acceleration | Acceleration[];
  translation?: Translation | Translation[];
  rotation?: Rotation | Rotation[];
  emission?: Emission<M> | Emission<M>[];
} & M;

export type Direction = 'forward' | 'backward';

export type Acceleration = {
  scale: number;
  duration?: number;
  defer?: number;
};

export type Translation = {
  x?: number;
  y?: number;
  z?: number;
  duration?: number;
  defer?: number;
  easing?: Easing;
};

export type Rotation = {
  pitch?: number;
  yaw?: number;
  roll?: number;
  order?: string;
  duration?: number;
  defer?: number;
  easing?: Easing;
};

export type Emission<M = {}> = {
  num: number;
  formation?: Formation;
  range?: number;
  pattern: Pattern<M> | Pattern<M>[];
  duration?: number;
  chunk?: number;
  parallel?: number;
  defer?: number;
};

export type Formation = 'id' | 'horizontal' | 'vertical' | 'split' | 'splash';

export type Easing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

export function each<A>(a?: A | A[]): A[] {
  return Array.isArray(a) ? a : a ? [a] : [];
}

export function completionTime({ duration, defer }: { duration?: number, defer?: number }): number {
  return (duration || 1) + (defer || 0);
}

export function minify(pattern: Pattern): void {
  optional(pattern, 'speed', undefined);
  optional(pattern, 'direction', 'forward');
  optionalList(pattern, 'acceleration', minifyAcceleration);
  optionalList(pattern, 'translation', minifyTranslation);
  optionalList(pattern, 'rotation', minifyRotation);
  optionalList(pattern, 'emission', minifyEmission);
}

function minifyAcceleration(acceleration: Acceleration): boolean {
  if (acceleration.scale == 1) return false;
  optional(acceleration, 'duration', 1);
  optional(acceleration, 'defer', 0);
  return true;
}

function minifyTranslation(translation: Translation): boolean {
  optional(translation, 'x', 0);
  optional(translation, 'y', 0);
  optional(translation, 'z', 0);
  if (!translation.x && !translation.y && !translation.z) return false;
  optional(translation, 'duration', 1);
  optional(translation, 'defer', 0);
  optional(translation, 'easing', 'linear');
  return true;
}

function minifyRotation(rotation: Rotation): boolean {
  optional(rotation, 'pitch', 0);
  optional(rotation, 'yaw', 0);
  optional(rotation, 'roll', 0);
  // optional(rotation, 'order', 'XYZ');
  if (!rotation.pitch && !rotation.yaw && !rotation.roll) return false;
  optional(rotation, 'duration', 1);
  optional(rotation, 'defer', 0);
  optional(rotation, 'easing', 'linear');
  return true;
}

function minifyEmission(emission: Emission): boolean {
  // optional(emission, 'formation', 'id');
  // for (const pattern of each(emission.pattern)) minify(pattern);
  if (Array.isArray(emission.pattern) && emission.pattern.length == 1) emission.pattern = emission.pattern[0];
  optional(emission, 'duration', 1);
  if (!emission.duration) {
    delete emission.chunk;
    delete emission.parallel;
  } else {
    optional(emission, 'chunk', 0);
    optional(emission, 'chunk', 1);
    optional(emission, 'parallel', 0);
    optional(emission, 'parallel', 1);
  }
  optional(emission, 'defer', 0);
  return true;
}

function optional<A, Key extends string>(record: { [P in Key]?: A }, key: Key, defval?: A): void {
  if (record[key] == defval) delete record[key];
}

function optionalList<A, Key extends string, Record extends { [P in Key]?: A | A[] }>(record: Record, key: Key, filter: (a: A) => boolean): void {
  const values = each<A>(record[key]).filter(filter);
  if (values.length == 0) delete record[key];
  else if (values.length == 1) record[key] = values[0];
  else record[key] = values;
}
