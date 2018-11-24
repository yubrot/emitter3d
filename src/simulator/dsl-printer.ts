import * as dsl from './dsl';

export class Printer {
  allowIndention = true;
  useSyntaxSugar = true;
  private indent = '';

  private printBlock<T>(open: string, close: string, sep: string, items: T[], printer: (item: T) => string): string {
    if (this.allowIndention) open = open.replace(/\s$/, '') + '\n';
    if (this.allowIndention) close = '\n' + this.indent + close.replace(/^\s/, '');
    if (this.allowIndention) sep = '\n' + (sep.trim() == '' ? '' : this.indent + sep.trim() + '\n');
    const indent = this.indent;
    this.indent = indent + '  ';
    const itemIndent = this.allowIndention ? this.indent : '';
    const ret = open + items.map(item => itemIndent + printer(item)).join(sep) + close;
    this.indent = indent;
    return ret;
  }

  private printList(open: string, close: string, items: dsl.AST[], head?: dsl.AST): string {
    const headIsList = head instanceof dsl.List;
    const itemsContainList = items.some(e => e instanceof dsl.List);

    if (head) {
      if (!headIsList && itemsContainList) {
        return this.printBlock(open + this.print(head) + ' ', close, ' ', items, e => this.print(e));
      }
      items = [head, ...items];
    }

    if (headIsList || itemsContainList) {
      return this.printBlock(open, close, ' ', items, e => this.print(e));
    }

    return open + items.map(e => this.print(e)).join(' ') + close;
  }

  printProgram(program: dsl.AST[]): string {
    return program
      .map(e => this.print(e, 'stmt'))
      .join(this.allowIndention ? '\n' + this.indent : '; ');
  }

  print(expr: dsl.AST, format?: 'stmt'): string {
    return expr.visit({
      number: v => String(v.value),
      symbol: v => {
        if (this.useSyntaxSugar) {
          if (v.value == dsl.Symbol.eachAngle.value) {
            return '[]';
          } else if (v.value == dsl.Symbol.randomAngle.value) {
            return '<>';
          }
        }
        return v.value;
      },
      list: v => {
        if (v.elements.length == 0) return '()';
        var callee = v.elements[0];
        var args = v.elements.slice(1);

        if (this.useSyntaxSugar && callee instanceof dsl.Symbol) {
          if (callee.value == dsl.Symbol.block.value && args.every(e => e instanceof dsl.List)) {
            return this.printBlock('{ ', ' }', ' | ', args, p => this.printProgram((p as dsl.List).elements));

          } else if (callee.value == dsl.Symbol.eachChoice.value && args.length >= 1) {
            return this.printList('[', ']', args);

          } else if (callee.value == dsl.Symbol.eachRange.value && args.length == 2) {
            return this.printList('[', ']', [args[0], new dsl.Symbol('..'), args[1]]);

          } else if (callee.value == dsl.Symbol.randomChoice.value && args.length >= 1) {
            return this.printList('<', '>', args);

          } else if (callee.value == dsl.Symbol.randomRange.value && args.length == 2) {
            return this.printList('<', '>', [args[0], new dsl.Symbol('..'), args[1]]);
          }
        }

        if (format == 'stmt' && v.elements.length >= 2) {
          return v.elements.map(e => this.print(e)).join(' ');
        } else {
          return this.printList('(', ')', args, callee);
        }
      },
    });
  }
}
