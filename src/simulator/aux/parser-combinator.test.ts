import * as p from './parser-combinator';

const success = 'success';
const failure = 'failure';

function parse<T>(rule: p.Parser<T>, text: string): any {
  try {
    const input = p.input(text);
    const result = rule(input);
    return [success, result, input.head];
  } catch (e) {
    if (!(e instanceof p.ParseError)) throw e;
    return [failure, `${e.input.line}:${e.input.col}`];
  }
}

test('pure', () => {
  expect(parse(p.pure('foo'), 'bar')).toEqual([success, 'foo', 'bar']);
});

test('fail', () => {
  expect(parse(p.fail('foo'), 'bar')).toEqual([failure, '1:1']);
});

test('string', () => {
  expect(parse(p.string('foo'), 'foobar')).toEqual([success, 'foo', 'bar']);
  expect(parse(p.string('foo'), 'bar')).toEqual([failure, '1:1']);
});

test('pattern', () => {
  const r = parse(p.pattern(`[ab]+`), 'aababcab');
  expect(r[0]).toEqual(success);
  expect(r[1][0]).toEqual('aabab');
  expect(r[2]).toEqual('cab');
  expect(parse(p.pattern(`[ab]+`), 'cabcb')).toEqual([failure, '1:1']);
});

test('bind', () => {
  const rule = p.bind(p.pattern(`.`), r => p.string(r[0]));
  expect(parse(rule, 'AAB')).toEqual([success, 'A', 'B']);
  expect(parse(rule, 'ABC')).toEqual([failure, '1:2']);
});

test('eof', () => {
  expect(parse(p.eof, '')).toEqual([success, undefined, '']);
  expect(parse(p.eof, 'bar')).toEqual([failure, '1:1']);
});

test('sequence', () => {
  const rule = p.sequence(p.string('A'), p.string('B'));
  expect(parse(rule, 'ABC')).toEqual([success, ['A', 'B'], 'C']);
  expect(parse(rule, 'ACB')).toEqual([failure, '1:2']);
  expect(parse(rule, 'BCA')).toEqual([failure, '1:1']);
});

test('choice', () => {
  const rule = p.choice(
    p.sequence(p.string('A'), p.string('A')),
    p.sequence(p.string('A'), p.string('B')),
    p.sequence(p.string('B'), p.string('B')));
  expect(parse(rule, 'AA')).toEqual([success, ['A', 'A'], '']);
  expect(parse(rule, 'AB')).toEqual([failure, '1:2']);
  expect(parse(rule, 'BA')).toEqual([failure, '1:2']);
  expect(parse(rule, 'BB')).toEqual([success, ['B', 'B'], '']);
  expect(parse(rule, 'CC')).toEqual([failure, '1:1']);
});

test('many', () => {
  const rule = p.many(p.sequence(p.string('A'), p.string('A')));
  expect(parse(rule, 'B')).toEqual([success, [], 'B']);
  expect(parse(rule, 'AB')).toEqual([failure, '1:2']);
  expect(parse(rule, 'AAB')).toEqual([success, [['A', 'A']], 'B']);
  expect(parse(rule, 'AAAB')).toEqual([failure, '1:4']);
  expect(parse(rule, 'AAAAB')).toEqual([success, [['A', 'A'], ['A', 'A']], 'B']);
});

test('some', () => {
  const rule = p.some(p.sequence(p.string('A'), p.string('A')));
  expect(parse(rule, 'B')).toEqual([failure, '1:1']);
  expect(parse(rule, 'AB')).toEqual([failure, '1:2']);
  expect(parse(rule, 'AAB')).toEqual([success, [['A', 'A']], 'B']);
  expect(parse(rule, 'AAAB')).toEqual([failure, '1:4']);
  expect(parse(rule, 'AAAAB')).toEqual([success, [['A', 'A'], ['A', 'A']], 'B']);
});

test('map', () => {
  const rule = p.map(p.pattern(`\\d+`), r => Number(r[0]));
  expect(parse(rule, '123abc')).toEqual([success, 123, 'abc']);
});

test('error-location', () => {
  const rule = p.sequence(p.string('aa\nbb'), p.string('cc'));
  expect(parse(rule, 'aa\nbbdd')).toEqual([failure, '2:3']);
});
