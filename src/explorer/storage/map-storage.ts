import { Storage } from './storage';

export class MapStorage implements Storage {
  constructor(
    private payload: Map<string, string>,
    readonly writable: boolean,
  ) { }

  async read(item: string): Promise<string> {
    const result = this.payload.get(item);
    if (!result) throw new Error(`No item named ${item}`);
    return result;
  }

  async write(item: string, body: string): Promise<void> {
    const oldBody = this.payload.get(item);
    if (oldBody != body) this.payload.set(item, body);
  }

  async delete(item: string): Promise<boolean> {
    if (!this.payload.has(item)) return false;
    this.payload.delete(item);
    return true;
  }

  async items(): Promise<string[]> {
    return Array.from(this.payload.keys());
  }
}
