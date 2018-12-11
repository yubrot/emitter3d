import * as dsl from './dsl';
import * as p from './aux/parser-combinator';

export type Parser<T> = p.Parser<T>;

export const ParseError = p.ParseError;

// spaces <- (' ' / '\t')+
// newlines <- ('\r' / '\n')+
// comment <- '/*' (!'*/' any)* '*/'
// lineComment <- '//' (!newlines any)*

export const spaces: Parser<void> = p.pattern(`[ \t]+`);
export const newlines: Parser<void> = p.pattern(`[\r\n]+`);
export const comment: Parser<void> = p.pattern(`/\\*[\\s\\S]*?\\*/`);
export const lineComment: Parser<void> = p.pattern(`//.*`);

export function lex<T>(q: Parser<T>, lineSensitive: boolean = false): Parser<T> {
  return p.map(
    p.sequence(q, lineSensitive ? amb1 : amb),
    ([v, _]) => v);
}

export const amb1: Parser<void> = p.many(p.choice(spaces, comment));
export const amb: Parser<void> = p.many(p.choice(spaces, comment, newlines, lineComment));

export function parseExact<T>(q: Parser<T>, text: string): T {
  const input = p.input(text);
  const [_1, result, _2] = p.sequence(amb, lex(q), p.eof)(input);
  return result;
}

// expr <- num / sym / list / each / random / block

export const expr: Parser<dsl.AST> = p.lazy(() =>
  p.choice<dsl.AST>(num, sym, list, each, random, block));

// num <- '-'? (digit* '.' digit+ / digit+) (('e' / 'E') ('+' / '-')? digit+)?
// digit <- '0' / .. / '9'

export const num: Parser<dsl.Number> = p.map(
  p.pattern(`-?(?:\\d*\\.\\d+|\\d+)(?:[eE][+-]?\\d+)?`),
  s => new dsl.Number(parseFloat(s[0])));

// sym <- .. # omitted

export const sym: Parser<dsl.Symbol> = p.map(
  p.pattern(`[!?\$@a-zA-Z_][-+*/%^!?\$@a-zA-Z0-9_]*`),
  s => new dsl.Symbol(s[0]));

// list <- '(' expr* ')'

export const list: Parser<dsl.List> = p.map(
  p.sequence(lex(p.string('(')), p.many(lex(expr)), p.string(')')),
  ([_1, elements, _2]) => new dsl.List(elements));

// each <- '[' (expr '..' expr / expr+)? ']'

export const each: Parser<dsl.AST> = p.map(
  p.sequence(
    lex(p.string('[')),
    meta(dsl.Symbol.eachChoice, dsl.Symbol.eachRange, dsl.Symbol.eachAngle),
    p.string(']')),
  ([_1, v, _2]) => v);

// random <- '<' (expr '..' expr / expr+)? '>'

export const random: Parser<dsl.AST> = p.map(
  p.sequence(
    lex(p.string('<')),
    meta(dsl.Symbol.randomChoice, dsl.Symbol.randomRange, dsl.Symbol.randomAngle),
    p.string('>')),
  ([_1, v, _2]) => v);

function meta(choice: dsl.Symbol, range: dsl.Symbol, angle: dsl.Symbol): Parser<dsl.AST> {
  return p.choice<dsl.AST>(
    p.bind(lex(expr), head => p.choice(
      p.map(
        p.sequence(lex(p.string('..')), lex(expr)),
        ([_, last]) => new dsl.List([range, head, last])),
      p.map(
        p.many(lex(expr)),
        tail => new dsl.List([choice, head, ...tail])))),
    p.pure(angle));
}

// stmt <- expr+ ';'* # no newline

export const stmt: Parser<dsl.AST> = p.map(
  p.sequence(p.some(lex(expr, true)), p.many(lex(p.string(';')))),
  ([ls, _]) => (ls.length == 1) ? ls[0] : new dsl.List(ls));

// program <- stmt*

export const program: Parser<dsl.AST[]> = p.many(lex(stmt));

// block <- '{' program ('|' program)* '}'

export const block: Parser<dsl.List> = p.map(
  p.sequence(
    lex(p.string('{')),
    program,
    p.many(p.sequence(lex(p.string('|')), program)),
    p.string('}')
  ),
  ([_1, a, bs, _2]) => new dsl.List([
    dsl.Symbol.block,
    new dsl.List(a),
    ...bs.map(([_, b]) => new dsl.List(b)),
  ]));
