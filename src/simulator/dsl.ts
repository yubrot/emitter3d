export type ASTVisitor<T> = {
  number(v: Number): T;
  symbol(v: Symbol): T;
  list(v: List): T;
};

export abstract class AST {
  abstract visit<T>(visitor: ASTVisitor<T>): T;

  toPlain(): any {
    return this.visit<any>({
      number: v => v.value,
      symbol: v => v.value,
      list: v => v.elements.map(e => e.toPlain()),
    });
  }

  static fromPlain(v: any): AST {
    if (v instanceof AST) return v;
    if (v instanceof Array) return new List(v.map(AST.fromPlain));
    if (typeof v == 'number') return new Number(v);
    if (typeof v == 'string') return new Symbol(v);
    throw new TypeError();
  }
}

export class Number extends AST {
  constructor(readonly value: number) {
    super();
  }

  visit<T>(visitor: ASTVisitor<T>): T {
    return visitor.number(this);
  }
}

export class Symbol extends AST {
  constructor(readonly value: string) {
    super();
  }

  visit<T>(visitor: ASTVisitor<T>): T {
    return visitor.symbol(this);
  }

  static readonly block = new Symbol('block');
  static readonly eachChoice = new Symbol('$each-choice');
  static readonly eachRange = new Symbol('$each-range');
  static readonly eachAngle = new Symbol('$each-angle');
  static readonly randomChoice = new Symbol('$random-choice');
  static readonly randomRange = new Symbol('$random-range');
  static readonly randomAngle = new Symbol('$random-angle');
}

export class List extends AST {
  constructor(readonly elements: AST[]) {
    super();
  }

  visit<T>(visitor: ASTVisitor<T>): T {
    return visitor.list(this);
  }
}
