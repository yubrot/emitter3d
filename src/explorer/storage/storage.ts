export interface Storage {
  readonly writable: boolean;

  read(item: string): Promise<string>;
  write(item: string, body: string): Promise<void>;
  delete(item: string): Promise<boolean>;
  items(): Promise<string[]>;
}
