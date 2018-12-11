import * as dsl from './dsl';
import * as dslParser from './dsl-parser';
import * as dslPrinter from './dsl-printer';
import * as dslCompiler from './dsl-compiler';

import { Model, Particle, Behavior, Field } from './particle';
export { Model, Particle, Behavior, Field };
import * as patternGenerator from './pattern-generator';

const printer = new dslPrinter.Printer();
const compiler = new dslCompiler.Compiler();

export type Program = dsl.AST[];

export function parse(text: string): Program {
  return dslParser.parseExact(dslParser.program, text);
}

export function print(program: Program): string {
  return printer.printProgram(program);
}

export function generate(strength: number): Program {
  return patternGenerator.generate(strength);
}

export function dump(program: Program): any[] {
  return program.map(e => e.toPlain());
}

export function load(program: any[]): Program {
  return program.map(a => dsl.AST.fromPlain(a));
}

export function compile(program: Program): (index: [number, number]) => Behavior {
  return compiler.compileProgram(program);
}

export const ParseError = dslParser.ParseError;
export const CompileError = dslCompiler.CompileError;
