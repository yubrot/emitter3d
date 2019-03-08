import { Store, InMemoryStore, StorageStore } from './store';
import { ExplorerState } from './state';
import * as presets from '../simulator/presets';

export class Explorer {
  private stores = [
    {
      name: 'local',
      store: new StorageStore(localStorage, 'e3d-user-'),
      writable: true,
    },
    {
      name: 'examples',
      store: presets.install(new InMemoryStore, presets.examples),
      writable: false,
    },
    {
      name: 'reference',
      store: presets.install(new InMemoryStore, presets.reference),
      writable: false,
    },
    {
      name: 'history',
      store: new InMemoryStore,
      writable: true,
    },
  ];

  load(store: string, item: string): string {
    return this.stores.find(s => s.name == store)!.store.read(item);
  }

  save(store: string, item: string, code: string): void {
    this.stores.find(s => s.name == store)!.store.write(item, code);
  }

  delete(store: string, item: string): void {
    return this.stores.find(s => s.name == store)!.store.delete(item);
  }

  get state(): ExplorerState {
    return this.stores.map(
      ({ name, store, writable }) => ({ name, items: store.items(), writable }));
  }
}
