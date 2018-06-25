import * as dat from 'dat.gui';

export class Config {
  constructor(private gui: dat.GUI = new dat.GUI(), private params: any = {}) {
    this.gui.close();
  }

  open(): this {
    this.gui.open();
    return this;
  }

  close(): this {
    this.gui.close();
    return this;
  }

  folder(name: string): Config {
    return new Config(this.gui.addFolder(name));
  }

  toggle(name: string, init: boolean): Input<boolean> {
    return this.add<boolean>(name, init, []);
  }

  options<A>(name: string, init: A, items: A[]): Input<A> {
    return this.add<A>(name, init, [items]);
  }

  range(name: string, init: number, [min, max]: [number, number]): Input<number> {
    return this.add<number>(name, init, [min, max]);
  }

  private add<A>(name: string, init: any, args: any[]): Input<A> {
    this.params[name] = init;
    const controller = (this.gui.add as any)(this.params, name, ...args);
    return new Input<A>(controller);
  }
}

export class Input<A> {
  private handlers = new Set<(value: A) => void>();

  constructor(private controller: dat.GUIController) {
    this.controller.onChange(this.onChange.bind(this));
  }

  private onChange(value: A): void {
    for (const handler of this.handlers) handler(value);
  }

  get value(): A {
    return this.controller.getValue();
  }

  set value(value: A) {
    this.controller.setValue(value);
  }

  handle(f: (value: A) => void): this {
    this.handlers.add(f);
    f(this.value);
    return this;
  }

  bind<K extends string>(target: { [P in K]: A }, key: K): this {
    this.handle(value => target[key] = value);
    return this;
  }

  step(value: number): this {
    this.controller.step(value);
    return this;
  }
}
