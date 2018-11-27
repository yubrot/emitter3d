export class Easing {
  constructor(private readonly f: (t: number) => number) {}

  at(a: number, n: number = 1): number {
    if (n == 0) return (a <= 0) ? 0 : 1;
    return this.f(Math.max(0, Math.min(1, a / n)));
  }

  delta(a: number, b: number, n: number = 1): number {
    if (n == 0) return (a <= 0 && 0 < b) ? 1 : (b <= 0 && 0 < a) ? -1 : 0;
    return this.at(b, n) - this.at(a, n);
  }

  static readonly linear = new Easing(t => t);
  static readonly easeIn = new Easing(t => t * t);
  static readonly easeOut = new Easing(t => t * (2 - t));
  static readonly easeInOut = new Easing(t => (t < 0.5) ? (2 * t * t) : ((4 - 2 * t) * t - 1));
}

