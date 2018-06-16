export type Function = (t: number) => number;

export function diff(f: Function, i: number, n: number): number {
  if (i <= 0 || n < i) throw 'out of range';
  return f(i / n) - f((i - 1) / n);
}

export const linear: Function = t => t;
export const easeIn: Function = t => t*t;
export const easeOut: Function = t => t*(2-t);
export const easeInOut: Function = t => t < 0.5 ? 2*t*t : (4-2*t)*t-1;
