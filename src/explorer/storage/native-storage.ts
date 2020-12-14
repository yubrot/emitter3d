import { Storage as IStorage } from './storage';

// NOTE: This should be replaced with KV Storage
export class NativeStorage implements IStorage {
  readonly writable = true;

  constructor(private storage: Storage, private prefix: string = '') {}

  async read(item: string): Promise<string> {
    const result = this.storage.getItem(this.prefix + item);
    if (!result) throw new Error(`No item named ${item}`);
    return result;
  }

  async write(item: string, body: string): Promise<void> {
    this.storage.setItem(this.prefix + item, body);
  }

  async delete(item: string): Promise<boolean> {
    if (this.storage.getItem(this.prefix + item) == null) return false;
    this.storage.removeItem(this.prefix + item);
    return true;
  }

  async items(): Promise<string[]> {
    const result = [];
    for (let i = 0; i < this.storage.length; ++i) {
      const item = this.storage.key(i)!;
      if (item.startsWith(this.prefix)) result.push(item.substring(this.prefix.length));
    }
    return result;
  }
}
