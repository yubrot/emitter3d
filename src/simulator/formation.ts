export type Formation = {
  units: { pitch?: number, yaw?: number, roll?: number }[];
  order?: string;
};

export function id(n: number): Formation {
  return {
    units: create(n, _ => ({})),
  };
}

export function horizontal(n: number, r: number): Formation {
  return {
    units: createAngles(n, r, yaw => ({ yaw }))
  };
}

export function vertical(n: number, r: number): Formation {
  // r should be < Math.PI
  return {
    units: createAngles(n, r, pitch => ({ pitch }))
  };
}

export function split(n: number, pitch: number): Formation {
  return {
    units: createAngles(n, Math.PI*2, roll => ({ pitch, roll })),
    order: 'ZXY',
  };
}

export function splash(n: number, pitchRange: number): Formation {
  return {
    units: create(n, _ => ({ pitch: Math.random()*pitchRange, roll: Math.random()*Math.PI*2 })),
    order: 'ZXY',
  };
}

function create<A>(n: number, f: (i: number) => A): A[] {
  const ret = new Array(n);
  for (let i=0; i<n; ++i) ret[i] = f(i);
  return ret;
}

function createAngles<A>(n: number, r: number, f: (angle: number) => A): A[] {
  if (n == 1) return [f(0)];
  if (r % Math.PI*2 == 0) r = r / n * (n-1);
  return create(n, i => f(-r/2 + r/(n-1) * i));
}
