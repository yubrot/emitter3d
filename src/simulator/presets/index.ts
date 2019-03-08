export { examples } from './examples';
export { reference } from './reference';

export type Store = {
  write(title: string, body: string): void;
};

export function install<T extends Store>(store: T, text: string): T {
  let title: string | undefined;
  let body = '';

  for (const line of text.split(/\n/)) {
    if (line.startsWith('---')) {
      if (title) store.write(title, body.trim());
      title = line.substring(3).trim();
      body = '';
    } else {
      body += line + '\n';
    }
  }

  return store;
}
