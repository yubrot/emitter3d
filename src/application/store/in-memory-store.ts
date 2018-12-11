import { Store } from './store';

export class InMemoryStore implements Store {
  private payload = new Map<string, string>();

  read(item: string): string {
    const result = this.payload.get(item);
    if (!result) throw new Error(`No item named ${item}`);
    return result;
  }

  write(item: string, body: string): void {
    const oldBody = this.payload.get(item);
    if (oldBody == body) return;
    this.payload.set(item, body);
  }

  delete(item: string): void {
    if (!this.payload.has(item)) return;
    this.payload.delete(item);
  }

  items(): string[] {
    return Array.from(this.payload.keys());
  }
}
