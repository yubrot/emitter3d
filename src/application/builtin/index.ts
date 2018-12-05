import { Store } from '../store';
export { examples } from './examples';
export { reference } from './reference';

export function install(store: Store, text: string): Store {
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
