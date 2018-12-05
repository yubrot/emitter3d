export interface Store {
  read(item: string): string;
  write(item: string, body: string): void;
  delete(item: string): void;
  items(): string[];
}
