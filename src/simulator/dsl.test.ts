import * as p from './aux/parser-combinator';
import * as dsl from './dsl';
import * as dslParser from './dsl-parser';
import * as dslPrinter from './dsl-printer';

const success = 'success';
const failure = 'failure';

function parse<T>(rule: dslParser.Parser<T>, text: string): any {
  try {
    const result = dslParser.parseExact(rule, text);
    return [success, result];
  } catch (e) {
    if (!(e instanceof dslParser.ParseError)) throw e;
    return [failure, `${e.input.line}:${e.input.col}`];
  }
}

function testPrintAndParse(text: string): void {
  const e = dslParser.parseExact(dslParser.expr, text);
  for (const allowIndention of [true, false]) {
    for (const useSyntaxSugar of [true, false]) {
      const printer = new dslPrinter.Printer();
      printer.allowIndention = allowIndention;
      printer.useSyntaxSugar = useSyntaxSugar;
      const text = printer.print(e);
      expect(parse(dslParser.expr, text)).toEqual([success, e]);
    }
  }
}

function ast(v: any): dsl.AST {
  return dsl.AST.fromPlain(v);
}

describe('parser', () => {
  test('parseExact', () => {
    expect(parse(p.pure({}), '')).toEqual([success, {}]);
    expect(parse(p.pure({}), '   \t \n \n ')).toEqual([success, {}]);
    expect(parse(p.pure({}), '  /* foo \n bar */ // hello \n ')).toEqual([success, {}]);
    expect(parse(p.pure({}), '  /* foo \n bar */ a // hello')).toEqual([failure, '2:9']);
  });

  test('num', () => {
    expect(parse(dslParser.num, '123.4e+3')).toEqual([success, ast(123.4e+3)]);
    expect(parse(dslParser.num, 'foo')).toEqual([failure, '1:1']);
  });

  test('sym', () => {
    expect(parse(dslParser.sym, 'foo')).toEqual([success, ast('foo')]);
    expect(parse(dslParser.sym, 'roll+')).toEqual([success, ast('roll+')]);
    expect(parse(dslParser.sym, 'f0')).toEqual([success, ast('f0')]);
    expect(parse(dslParser.sym, '0x0')).toEqual([failure, '1:1']); // TODO this should be parsed successfully
  });

  test('list', () => {
    expect(parse(dslParser.list, '')).toEqual([failure, '1:1']);
    expect(parse(dslParser.list, '(')).toEqual([failure, '1:2']);
    expect(parse(dslParser.list, '()')).toEqual([success, ast([])]);
    expect(parse(dslParser.list, '(foo)')).toEqual([success, ast(['foo'])]);
    expect(parse(dslParser.list, '(foo bar)')).toEqual([success, ast(['foo', 'bar'])]);
    expect(parse(dslParser.list, '( 1 3.4 )')).toEqual([success, ast([1, 3.4])]);
    expect(parse(dslParser.list, '(foo (x y) 5)')).toEqual([success, ast(['foo', ['x', 'y'], 5])]);
  });

  test('each', () => {
    expect(parse(dslParser.each, '[]')).toEqual([success, dsl.Symbol.eachAngle]);
    expect(parse(dslParser.each, '[1]')).toEqual([success, ast([dsl.Symbol.eachChoice, 1])]);
    expect(parse(dslParser.each, '[1 2]')).toEqual([success, ast([dsl.Symbol.eachChoice, 1, 2])]);
    expect(parse(dslParser.each, '[1 2 3]')).toEqual([success, ast([dsl.Symbol.eachChoice, 1, 2, 3])]);
    expect(parse(dslParser.each, '[1..3]')).toEqual([success, ast([dsl.Symbol.eachRange, 1, 3])]);
  });

  test('random', () => {
    expect(parse(dslParser.random, '<>')).toEqual([success, dsl.Symbol.randomAngle]);
    expect(parse(dslParser.random, '<1>')).toEqual([success, ast([dsl.Symbol.randomChoice, 1])]);
    expect(parse(dslParser.random, '<1 2>')).toEqual([success, ast([dsl.Symbol.randomChoice, 1, 2])]);
    expect(parse(dslParser.random, '<1 2 3>')).toEqual([success, ast([dsl.Symbol.randomChoice, 1, 2, 3])]);
    expect(parse(dslParser.random, '<1..3>')).toEqual([success, ast([dsl.Symbol.randomRange, 1, 3])]);
  });

  test('program', () => {
    expect(parse(dslParser.program, '')).toEqual([success, []]);
    expect(parse(dslParser.program, 'foo')).toEqual([success, [ast('foo')]]);
    expect(parse(dslParser.program, 'foo bar')).toEqual([success, [ast(['foo', 'bar'])]]);
    expect(parse(dslParser.program, 'foo bar // comment\n bar /* comment \n comment */ baz \n hoge')).toEqual([success, [ast(['foo', 'bar']), ast(['bar', 'baz']), ast('hoge')]]);
    expect(parse(dslParser.program, 'x; y z')).toEqual([success, [ast('x'), ast(['y', 'z'])]]);
  });

  test('block', () => {
    expect(parse(dslParser.block, '{}')).toEqual([success, ast([dsl.Symbol.block, []])]);
    expect(parse(dslParser.block, '{|}')).toEqual([success, ast([dsl.Symbol.block, [], []])]);
    expect(parse(dslParser.block, '{ foo }')).toEqual([success, ast([dsl.Symbol.block, ['foo']])]);
    expect(parse(dslParser.block, '{ foo ; bar | baz }')).toEqual([success, ast([dsl.Symbol.block, ['foo', 'bar'], ['baz']])]);
    expect(parse(dslParser.block, '{ foo bar }')).toEqual([success, ast([dsl.Symbol.block, [['foo', 'bar']]])]);
    expect(parse(dslParser.block, '{ (foo) }')).toEqual([success, ast([dsl.Symbol.block, [['foo']]])]);
    expect(parse(dslParser.block, '{ (foo bar) }')).toEqual([success, ast([dsl.Symbol.block, [['foo', 'bar']]])]);
  });
});

describe('printer', () => {
  test('num', () => {
    testPrintAndParse('123');
    testPrintAndParse('123.4e+3');
  });

  test('sym', () => {
    testPrintAndParse('foo');
    testPrintAndParse('roll+');
    testPrintAndParse('f0');
  });

  test('list', () => {
    testPrintAndParse('()');
    testPrintAndParse('(123)');
    testPrintAndParse('(foo)');
    testPrintAndParse('(foo 123)');
    testPrintAndParse('(())');
    testPrintAndParse('((123 foo))');
    testPrintAndParse('((123 bar) 7 (8 9))');
  });

  test('each', () => {
    testPrintAndParse('[]');
    testPrintAndParse('[123]');
    testPrintAndParse('[1 2]');
    testPrintAndParse('[foo bar baz]');
    testPrintAndParse('[[foo bar] baz [hoge fuga]]');
    testPrintAndParse('[12..34]');
    testPrintAndParse('[12.3..45.6]');
    testPrintAndParse('[[1 2]..[3 4]]');
  });

  test('random', () => {
    testPrintAndParse('<>');
    testPrintAndParse('<123>');
    testPrintAndParse('<1 2>');
    testPrintAndParse('<foo bar baz>');
    testPrintAndParse('<<foo bar> baz <hoge fuga>>');
    testPrintAndParse('<12..34>');
    testPrintAndParse('<12.3..45.6>');
    testPrintAndParse('<<1 2>..<3 4>>');
  });

  test('block', () => {
    testPrintAndParse('{}');
    testPrintAndParse('{|}');
    testPrintAndParse('{ foo }');
    testPrintAndParse('{ foo bar }');
    testPrintAndParse('{ foo bar; baz }');
    testPrintAndParse('{ foo | }');
    testPrintAndParse('{ | foo }');
    testPrintAndParse('{ foo | bar }');
    testPrintAndParse('{ foo; bar | hoge; fuga }');
    testPrintAndParse('{ (foo) }');
    testPrintAndParse('{ (foo bar) }');
    testPrintAndParse('{ ((foo bar) baz) qux }');
  });

  test('mixed', () => {
    testPrintAndParse(`
      (a
        (b (c d))
        (e
          (f g)
          (h i)
        )
        (
          (j k l)
          (m (n o
          p) q r)
        )
        s
      )
    `);
    testPrintAndParse(`
      // comment
      {
        speed 5.5; model missile
        hue 100
        {
          /* comment */
          10 [ease-in ease-out] pitch+ 10
        |
          [3..10] ease-in rotate <> 10 []
        }
        repeat <3..5> {
          10 hue+ <5 30>
          10 hue+ -30
        }
      }
    `);
  });
});