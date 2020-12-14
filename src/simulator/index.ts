import * as dsl from './dsl';
import * as dslParser from './dsl-parser';
import * as dslPrinter from './dsl-printer';
import * as dslCompiler from './dsl-compiler';

import { Particle, Behavior, Field } from './particle';
export { Particle, Behavior, Field };
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

export class Simulator {
  private field = new Field();
  private pattern = compile([]);

  get closed(): boolean {
    return this.field.closed;
  }

  get particles(): Iterable<Particle> {
    return this.field;
  }

  reset(): void {
    this.field.clear();
  }

  update(deltaTime: number): void {
    this.field.update(deltaTime);
  }

  emitRootParticle(): void {
    const behavior = this.pattern([0, 1]);
    this.field.add(new Particle(behavior));
  }

  generatePattern(strength: number, clear: boolean): { code: string } {
    const program = generate(strength);
    const code = print(program);
    const { success, message } = this.compilePattern(program, clear);
    console.assert(success, message);
    return { code };
  }

  compilePattern(program: string | Program, clear: boolean): { success: boolean; message: string } {
    try {
      program = typeof program == 'string' ? parse(program) : program;
      this.pattern = compile(program);
      if (clear) this.field.clear();
      return { success: true, message: 'Successfully compiled.' };
    } catch (e) {
      const message =
        e instanceof ParseError
          ? `Parse error: ${e.message}`
          : e instanceof CompileError
          ? `Compile error: ${e.message}`
          : `Unknown error: ${e.message}`;
      return { success: false, message };
    }
  }
}
