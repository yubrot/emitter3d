export type Input = { line: number; col: number; loc: number; head: string };

export function input(head: string): Input {
  return { line: 1, col: 1, loc: 0, head };
}

function eat(input: Input, length: number): void {
  let ate = input.head.substring(0, length);
  input.head = input.head.substring(length);
  input.loc += length;

  let index = 0;
  while ((index = ate.indexOf('\n')) != -1) {
    input.line += 1;
    input.col = 1;
    ate = ate.substring(index + 1);
  }
  input.col += ate.length;
}

export type Parser<T> = (input: Input) => T;

export class ParseError extends Error {
  constructor(readonly expect: string, readonly input: Input) {
    super(`Expected ${expect} at ${input.line}:${input.col}`);
  }
}

export function pure<T>(result: T): Parser<T> {
  return _ => result;
}

export function bind<T, S>(p: Parser<T>, m: (v: T) => Parser<S>): Parser<S> {
  return input => {
    const v = p(input);
    return m(v)(input);
  };
}

export function fail(e: string): Parser<any> {
  return input => {
    throw new ParseError(e, input);
  };
}

export function lazy<T>(f: () => Parser<T>): Parser<T> {
  let p: Parser<T> | undefined;
  return input => {
    if (!p) p = f();
    return p(input);
  };
}

export function string(s: string): Parser<string> {
  return input => {
    if (!input.head.startsWith(s)) throw new ParseError(`"${s}"`, input);
    eat(input, s.length);
    return s;
  };
}

export function pattern(pat: string): Parser<RegExpMatchArray> {
  const re = new RegExp('^' + pat);
  return input => {
    const m = input.head.match(re);
    if (!m) throw new ParseError(pat, input);
    eat(input, m[0].length);
    return m;
  };
}

export const eof: Parser<void> = input => {
  if (input.head.length != 0) throw new ParseError('eof', input);
};

export type Parsers<T> = { [P in keyof T]: Parser<T[P]> };

export function sequence<T extends any[]>(...ps: Parsers<T>): Parser<T> {
  return input => (ps as any).map((p: Parser<any>) => p(input));
}

export function choice<T>(...ps: Parser<T>[]): Parser<T> {
  return input => {
    const loc = input.loc;
    const expects: string[] = [];
    for (const p of ps) {
      try {
        return p(input);
      } catch (e) {
        if (input.loc != loc) throw e;
        if (!(e instanceof ParseError)) throw e;
        expects.push(e.expect);
      }
    }
    throw new ParseError(expects.join(' or '), input);
  };
}

export function many<T>(p: Parser<T>): Parser<T[]> {
  return input => {
    const rs = [];

    while (true) {
      const loc = input.loc;
      try {
        rs.push(p(input));
      } catch (e) {
        if (input.loc != loc) throw e;
        if (!(e instanceof ParseError)) throw e;
        return rs;
      }
    }
  };
}

export function some<T>(p: Parser<T>): Parser<T[]> {
  return map(sequence(p, many(p)), ([a, bs]) => [a, ...bs]);
}

export function map<T, S>(p: Parser<T>, f: (v: T) => S): Parser<S> {
  return input => f(p(input));
}
