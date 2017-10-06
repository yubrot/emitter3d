import * as dat from 'dat-gui';

export class ConfigUI {
  constructor(
    private gui: dat.GUI = new dat.GUI(),
    private params: any = {},
  ) {
    this.gui.close();
  }

  private add<T>(name: string, init: any, args: any[], handler?: (val: any) => void): Input<T> {
    this.params[name] = init;
    const controller = (<any> this.gui.add)(this.params, name, ...args);
    if (handler) {
      controller.onChange(handler);
      handler(init);
    }
    return new Input<T>(controller);
  }

  toggle(name: string, init: boolean, handler?: (val: boolean) => void): Input<boolean> {
    return this.add<boolean>(name, init, [], handler);
  }

  options<T>(name: string, init: T, items: T[], handler?: (val: T) => void): Input<T> {
    return this.add<T>(name, init, [items], handler);
  }

  range(name: string, init: number, [min, max]: [number, number], handler?: (val: number) => void): Input<number> {
    return this.add<number>(name, init, [min, max], handler);
  }

  folder(name: string): ConfigUI {
    return new ConfigUI(this.gui.addFolder(name));
  }
}

export class Input<T> {
  constructor(private controller: dat.GUIController) {}

  get value(): T {
    return this.controller.getValue();
  }

  set value(v: T) {
    this.controller.setValue(v);
  }
}

export default new ConfigUI();
