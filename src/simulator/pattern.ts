export type Pattern = string[];

export function selectPattern(num: number, depth: number): Pattern {
  return select(flattenPatternChoices(1, [], patternChoices(num, depth)));
}

type PatternChoice = {
  name: string;
  rate?: number;
  subs?: PatternChoice[];
};

function patternChoices(num: number, depth: number): PatternChoice[] {
  const c12: PatternChoice[] = [{ name: '1' }, { name: '2' }];

  const c123: PatternChoice[] = [{ name: '1' }, { name: '2' }, { name: '3' }];

  const c1_2: PatternChoice[] = [
    { name: '1' },
    { name: '2', rate: (num%2 == 0 && 6 <= num ? 1 : 0) },
  ];

  const c1_23: PatternChoice[] = [
    { name: '1' },
    { name: '2', rate: (num%2 == 0 && 6 <= num ? 1 : 0) },
    { name: '3', rate: (num%3 == 0 && 12 <= num ? 1 : 0) },
  ];

  const xy_xz: PatternChoice[] = [
    { name: '360', rate: (num <= 5 ? 0.3 : 1), subs: [
        { name: 'straight', rate: 5, subs: c1_23 },
        { name: 'lspin', subs: c1_23 },
        { name: 'rspin', subs: c1_23 },
        { name: 'lrspin', rate: (num%2 == 0 && 6 <= num ? 1 : 0) },
        { name: 'udspin', rate: (num%2 == 0 && 6 <= num ? 1 : 0) },
    ] },
    { name: 'way', rate: (6 <= num ? 0.3 : 1) * (depth == 0 ? 0 : 1), subs: [
        { name: 'straight', rate: 5 },
        { name: 'inner', rate: (num%2 == 0 ? 1 : 0) },
        { name: 'outer', rate: (num%2 == 0 ? 1 : 0) },
    ] },
    { name: 'back', rate: (num%2 == 0 ? 0.3 : 0) * (depth == 0 ? 0 : 1), subs: [
        { name: 'straight', rate: 5 },
        { name: 'outer' },
    ] }
  ];

  const yz: PatternChoice[] = [
    { name: '90', subs: [
        { name: 'straight', rate: 5, subs: c1_23 },
        { name: 'lspin', subs: c1_23 },
        { name: 'rspin', subs: c1_23 },
        { name: 'inner', subs: c1_2 },
    ] },
    { name: '45', rate: (depth == 0 ? 0 : 1), subs: [
        { name: 'straight', rate: 5, subs: c1_23 },
        { name: 'lspin', subs: c1_23 },
        { name: 'rspin', subs: c1_23 },
    ] },
    { name: '0', rate: (depth == 0 ? 0 : 1), subs: [
        { name: 'outer', subs: c1_2 },
    ] }
  ];

  const rapid: PatternChoice[] = [
    { name: 'straight', subs: [
        { name: 'forward', rate: 3, subs: c123 },
        { name: 'back', rate: 0.5, subs: c123 },
    ] },
    { name: 'splash', rate: (9 <= num ? 1 : 0), subs: [
        { name: 'forward', rate: 3, subs: c12 },
        { name: 'back', rate: 0.5, subs: c12 },
    ] },
  ];

  return [
    { name: 'xy', subs: xy_xz },
    { name: 'xz', subs: xy_xz },
    { name: 'yz', rate: (num % 2 == 0 ? 2 : 0), subs: yz },
    { name: 'rapid', rate: (depth == 1 ? 1 : 0), subs: rapid },
  ];
}

function flattenPatternChoices(w: number, prefix: Pattern, cases: PatternChoice[]): { weight: number, value: Pattern }[] {
  return flatten(cases.map(c => {
    const rate = w * (c.rate === undefined ? 1 : c.rate);
    const name = [...prefix, c.name];
    if (c.subs) return flattenPatternChoices(rate, name, c.subs);
    return [{ weight: rate, value: name }];
  }));
}

export function flatten<A>(ls: A[][]): A[] {
  return Array.prototype.concat.apply([], ls);
}

export function range(l: string): number[] {
  const r = new Array<number>(Number(l));
  for (let i=0; i<r.length; ++i) r[i] = i + 1;
  return r;
}

export function select<T>(options: { weight: number, value: T }[]): T {
  const t = Math.random() * options.reduce((a, b) => a + b.weight, 0);
  let n = 0;
  for (let option of options) {
    n += option.weight;
    if (t < n) return option.value;
  }
  throw 'unreachable';
}
