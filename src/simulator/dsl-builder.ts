import * as dsl from './dsl';

export class Code {
  private programs: dsl.AST[][] = [[]];
  private pointer = 0;
  private current?: Code;

  put(...line: any[]): this {
    const expr = dsl.AST.fromPlain(line.length == 1 ? line[0] : line);
    return this.putAST(expr);
  }

  putCode(code: Code): this {
    const program = code.toProgram();
    return this.putProgram(program);
  }

  putEachChoice(...codes: Code[]): this {
    if (codes.length == 1) return this.putCode(codes[0]);
    return this.put(Code.eachChoice(...codes.map(c => c.toAST())));
  }

  putRandomChoice(...codes: Code[]): this {
    if (codes.length == 1) return this.putCode(codes[0]);
    return this.put(Code.randomChoice(...codes.map(c => c.toAST())));
  }

  putAST(expr: dsl.AST): this {
    if (this.current) {
      this.current.putAST(expr);
    } else {
      this.programs[this.pointer].push(expr);
    }
    return this;
  }

  putProgram(program: dsl.AST[]): this {
    if (this.current) {
      this.current.putProgram(program);
    } else {
      this.programs[this.pointer].push(...program);
    }
    return this;
  }

  toProgram(): dsl.AST[] {
    if (this.current) throw new Error('begin block is incomplete');
    const programs = this.programs.filter(program => program.length != 0);
    if (programs.length == 0) return [];
    if (programs.length == 1) return programs[0];
    return [new dsl.List([dsl.Symbol.block, ...programs.map(program => new dsl.List(program))])];
  }

  toAST(): dsl.AST {
    const program = this.toProgram();
    if (program.length == 1) return program[0];
    return new dsl.List([dsl.Symbol.block, new dsl.List(program)]);
  }

  tap(f: (code: Code) => void): this {
    f(this);
    return this;
  }

  join(): this {
    if (this.current) {
      this.current.join();
    } else {
      this.programs.push([]);
      this.pointer++;
    }
    return this;
  }

  begin(): this {
    if (this.current) {
      this.current.begin();
    } else {
      this.current = new Code();
    }
    return this;
  }

  end(parent?: Code): this {
    if (this.current) {
      this.current.end(this);
    } else {
      delete parent!.current;
      parent!.putCode(this);
    }
    return this;
  }

  static eachChoice(...values: any): any {
    if (values.length == 1) return values[0];
    return [dsl.Symbol.eachChoice, ...values];
  }

  static eachRange(a: number, b: number): any {
    return [dsl.Symbol.eachRange, a, b];
  }

  static readonly eachAngle = dsl.Symbol.eachAngle;

  static randomChoice(...values: any): any {
    if (values.length == 1) return values[0];
    return [dsl.Symbol.randomChoice, ...values];
  }

  static randomRange(a: number, b: number): any {
    return [dsl.Symbol.randomRange, a, b];
  }

  static readonly randomAngle = dsl.Symbol.randomAngle;
}
