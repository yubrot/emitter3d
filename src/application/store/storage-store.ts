import { Store } from './store';

export class StorageStore implements Store {
  constructor(private storage: Storage, private prefix: string = '') { }

  read(item: string): string {
    const result = this.storage.getItem(this.prefix + item);
    if (!result) throw new Error(`No item named ${item}`);
    return result;
  }

  write(item: string, body: string): void {
    this.storage.setItem(this.prefix + item, body);
  }

  delete(item: string): void {
    if (this.storage.getItem(this.prefix + item) == null) return;
    this.storage.removeItem(this.prefix + item);
  }

  items(): string[] {
    const result = [];
    for (let i = 0; i < this.storage.length; ++i) {
      const item = this.storage.key(i)!;
      if (item.startsWith(this.prefix)) result.push(item.substring(this.prefix.length));
    }
    return result;
  }
}
