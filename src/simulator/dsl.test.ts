import * as p from './aux/parser-combinator';
import * as dsl from './dsl';
import * as dslParser from './dsl-parser';
import * as dslPrinter from './dsl-printer';
import * as dslBuilder from './dsl-builder';

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

describe('core', () => {
  expect(dsl.AST.fromPlain('foo')).toEqual(new dsl.Symbol('foo'));
  expect(dsl.AST.fromPlain(123)).toEqual(new dsl.Number(123));
  expect(dsl.AST.fromPlain(['foo', [new dsl.Number(12), 34]])).toEqual(
    new dsl.List([new dsl.Symbol('foo'), new dsl.List([new dsl.Number(12), new dsl.Number(34)])])
  );
  expect(ast('foo').toPlain()).toEqual('foo');
  expect(ast(123).toPlain()).toEqual(123);
  expect(ast([12, ['bar', 'baz']]).toPlain()).toEqual([12, ['bar', 'baz']]);
});

describe('parser', () => {
  test('parseExact', () => {
    expect(parse(p.pure({}), '')).toEqual([success, {}]);
    expect(parse(p.pure({}), '   \t \n \n ')).toEqual([success, {}]);
    expect(parse(p.pure({}), '  /* foo \n bar */ // hello \n ')).toEqual([success, {}]);
    expect(parse(p.pure({}), '  /* foo \n bar */ a // hello')).toEqual([failure, '2:9']);
  });

  test('num', () => {
    expect(parse(dslParser.num, '123.4e+3')).toEqual([success, ast(123.4e3)]);
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
    expect(parse(dslParser.each, '[1 2 3]')).toEqual([
      success,
      ast([dsl.Symbol.eachChoice, 1, 2, 3]),
    ]);
    expect(parse(dslParser.each, '[1..3]')).toEqual([success, ast([dsl.Symbol.eachRange, 1, 3])]);
  });

  test('random', () => {
    expect(parse(dslParser.random, '<>')).toEqual([success, dsl.Symbol.randomAngle]);
    expect(parse(dslParser.random, '<1>')).toEqual([success, ast([dsl.Symbol.randomChoice, 1])]);
    expect(parse(dslParser.random, '<1 2>')).toEqual([
      success,
      ast([dsl.Symbol.randomChoice, 1, 2]),
    ]);
    expect(parse(dslParser.random, '<1 2 3>')).toEqual([
      success,
      ast([dsl.Symbol.randomChoice, 1, 2, 3]),
    ]);
    expect(parse(dslParser.random, '<1..3>')).toEqual([
      success,
      ast([dsl.Symbol.randomRange, 1, 3]),
    ]);
  });

  test('program', () => {
    expect(parse(dslParser.program, '')).toEqual([success, []]);
    expect(parse(dslParser.program, 'foo')).toEqual([success, [ast('foo')]]);
    expect(parse(dslParser.program, 'foo bar')).toEqual([success, [ast(['foo', 'bar'])]]);
    expect(
      parse(dslParser.program, 'foo bar // comment\n bar /* comment \n comment */ baz \n hoge')
    ).toEqual([success, [ast(['foo', 'bar']), ast(['bar', 'baz']), ast('hoge')]]);
    expect(parse(dslParser.program, 'x; y z')).toEqual([success, [ast('x'), ast(['y', 'z'])]]);
  });

  test('block', () => {
    expect(parse(dslParser.block, '{}')).toEqual([success, ast([dsl.Symbol.block, []])]);
    expect(parse(dslParser.block, '{|}')).toEqual([success, ast([dsl.Symbol.block, [], []])]);
    expect(parse(dslParser.block, '{ foo }')).toEqual([success, ast([dsl.Symbol.block, ['foo']])]);
    expect(parse(dslParser.block, '{ foo ; bar | baz }')).toEqual([
      success,
      ast([dsl.Symbol.block, ['foo', 'bar'], ['baz']]),
    ]);
    expect(parse(dslParser.block, '{ foo bar }')).toEqual([
      success,
      ast([dsl.Symbol.block, [['foo', 'bar']]]),
    ]);
    expect(parse(dslParser.block, '{ (foo) }')).toEqual([
      success,
      ast([dsl.Symbol.block, [['foo']]]),
    ]);
    expect(parse(dslParser.block, '{ (foo bar) }')).toEqual([
      success,
      ast([dsl.Symbol.block, [['foo', 'bar']]]),
    ]);
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
        speed 5.5; hue 100
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

describe('builder', () => {
  const Code = dslBuilder.Code;

  test('serial', () => {
    expect(new Code().toProgram()).toEqual([]);
    expect(new Code().put('foo', 'bar').toProgram()).toEqual([ast(['foo', 'bar'])]);
    expect(new Code().put('foo', 'bar').put('baz').toProgram()).toEqual([
      ast(['foo', 'bar']),
      ast('baz'),
    ]);
    expect(new Code().put('foo', 'bar').put('baz').put('hoge', 'fuga').toProgram()).toEqual([
      ast(['foo', 'bar']),
      ast('baz'),
      ast(['hoge', 'fuga']),
    ]);
    expect(new Code().toAST()).toEqual(ast([dsl.Symbol.block, []]));
    expect(new Code().put('foo', 'bar').toAST()).toEqual(ast(['foo', 'bar']));
    expect(new Code().put('foo', 'bar').put('baz').toAST()).toEqual(
      ast([dsl.Symbol.block, [['foo', 'bar'], 'baz']])
    );
    expect(
      new Code().put('foo', 'bar').putCode(new Code().put('baz').put('hoge', 'fuga')).toProgram()
    ).toEqual([ast(['foo', 'bar']), ast('baz'), ast(['hoge', 'fuga'])]);
  });

  test('parallel', () => {
    expect(new Code().join().toProgram()).toEqual([]);
    expect(new Code().join().put('foo', 'bar').toAST()).toEqual(ast(['foo', 'bar']));
    expect(new Code().join().put('foo', 'bar').put('baz').toAST()).toEqual(
      ast([dsl.Symbol.block, [['foo', 'bar'], 'baz']])
    );
    expect(new Code().put('foo', 'bar').join().put('baz').toAST()).toEqual(
      ast([dsl.Symbol.block, [['foo', 'bar']], ['baz']])
    );
    expect(new Code().put('a').put('b').join().put('c').put('d').join().put('e').toAST()).toEqual(
      ast([dsl.Symbol.block, ['a', 'b'], ['c', 'd'], ['e']])
    );
    expect(
      new Code().put('foo', 'bar').join().putCode(new Code().put('hoge').put('fuga')).toAST()
    ).toEqual(ast([dsl.Symbol.block, [['foo', 'bar']], ['hoge', 'fuga']]));
    // expect(new Code().put('foo', 'bar').join().putCode(new Code().put('hoge').join().put('fuga')).toAST()).toEqual(ast([dsl.Symbol.block, [['foo', 'bar']], ['hoge'], ['fuga']]));
    expect(
      new Code().put('foo', 'bar').join().putCode(new Code().put('hoge').join().put('fuga')).toAST()
    ).toEqual(ast([dsl.Symbol.block, [['foo', 'bar']], [[dsl.Symbol.block, ['hoge'], ['fuga']]]]));
    expect(new Code().put('a').join().put('b').putCode(new Code().put('c')).toAST()).toEqual(
      ast([dsl.Symbol.block, ['a'], ['b', 'c']])
    );
    expect(
      new Code().put('a').join().put('b').putCode(new Code().put('c').join().put('d')).toAST()
    ).toEqual(ast([dsl.Symbol.block, ['a'], ['b', [dsl.Symbol.block, ['c'], ['d']]]]));
  });

  test('nested', () => {
    expect(new Code().put('a').put('b').join().begin().put('c').put('d').end().toAST()).toEqual(
      ast([dsl.Symbol.block, ['a', 'b'], ['c', 'd']])
    );
    // expect(new Code().put('a').put('b').join().begin().put('c').join().put('d').end().toAST()).toEqual(ast([dsl.Symbol.block, ['a', 'b'], ['c'], ['d']]));
    expect(
      new Code().put('a').put('b').join().begin().put('c').join().put('d').end().toAST()
    ).toEqual(ast([dsl.Symbol.block, ['a', 'b'], [[dsl.Symbol.block, ['c'], ['d']]]]));
    expect(new Code().put('a').put('b').join().put('c').begin().put('d').end().toAST()).toEqual(
      ast([dsl.Symbol.block, ['a', 'b'], ['c', 'd']])
    );
    expect(
      new Code().put('a').put('b').join().put('c').begin().put('d').join().put('e').end().toAST()
    ).toEqual(ast([dsl.Symbol.block, ['a', 'b'], ['c', [dsl.Symbol.block, ['d'], ['e']]]]));
    expect(() =>
      new Code().put('a').begin().put('b').begin().put('c').join().put('d').end().toAST()
    ).toThrow(Error);
    expect(
      new Code()
        .put('a')
        .begin()
        .put('b')
        .begin()
        .put('c')
        .join()
        .putCode(new Code().put('d').put('e'))
        .end()
        .end()
        .toAST()
    ).toEqual(ast([dsl.Symbol.block, ['a', 'b', [dsl.Symbol.block, ['c'], ['d', 'e']]]]));
  });

  test('util', () => {
    expect(ast(Code.eachChoice(1, 2, 3))).toEqual(ast([dsl.Symbol.eachChoice, 1, 2, 3]));
    expect(ast(Code.eachRange(2, 5))).toEqual(ast([dsl.Symbol.eachRange, 2, 5]));
    expect(ast(Code.eachAngle)).toEqual(ast(dsl.Symbol.eachAngle));
    expect(ast(Code.randomChoice(1, 2, 3))).toEqual(ast([dsl.Symbol.randomChoice, 1, 2, 3]));
    expect(ast(Code.randomRange(2, 5))).toEqual(ast([dsl.Symbol.randomRange, 2, 5]));
    expect(ast(Code.randomAngle)).toEqual(ast(dsl.Symbol.randomAngle));
    expect(new Code().putEachChoice(new Code().put('a')).toAST()).toEqual(ast('a'));
    expect(new Code().putRandomChoice(new Code().put('a')).toAST()).toEqual(ast('a'));
    expect(new Code().putEachChoice(new Code().put('a'), new Code().put('b')).toAST()).toEqual(
      ast([dsl.Symbol.eachChoice, 'a', 'b'])
    );
    expect(new Code().putRandomChoice(new Code().put('a'), new Code().put('b')).toAST()).toEqual(
      ast([dsl.Symbol.randomChoice, 'a', 'b'])
    );
    expect(
      new Code()
        .putEachChoice(new Code().put('a').put('b'), new Code().put('c').join().put('d'))
        .toAST()
    ).toEqual(
      ast([dsl.Symbol.eachChoice, [dsl.Symbol.block, ['a', 'b']], [dsl.Symbol.block, ['c'], ['d']]])
    );
    expect(
      new Code()
        .putRandomChoice(new Code().put('a').put('b'), new Code().put('c').join().put('d'))
        .toAST()
    ).toEqual(
      ast([
        dsl.Symbol.randomChoice,
        [dsl.Symbol.block, ['a', 'b']],
        [dsl.Symbol.block, ['c'], ['d']],
      ])
    );
    expect(
      new Code()
        .put('x')
        .putEachChoice(new Code().put('a').put('b'), new Code().put('c').join().put('d'))
        .put('y')
        .toAST()
    ).toEqual(
      ast([
        dsl.Symbol.block,
        [
          'x',
          [dsl.Symbol.eachChoice, [dsl.Symbol.block, ['a', 'b']], [dsl.Symbol.block, ['c'], ['d']]],
          'y',
        ],
      ])
    );
    expect(
      new Code()
        .put('x')
        .putRandomChoice(new Code().put('a').put('b'), new Code().put('c').join().put('d'))
        .put('y')
        .toAST()
    ).toEqual(
      ast([
        dsl.Symbol.block,
        [
          'x',
          [
            dsl.Symbol.randomChoice,
            [dsl.Symbol.block, ['a', 'b']],
            [dsl.Symbol.block, ['c'], ['d']],
          ],
          'y',
        ],
      ])
    );
  });
});
