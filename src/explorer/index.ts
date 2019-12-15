import { Storage, NativeStorage, MapStorage } from './storage';
export { Storage, NativeStorage, MapStorage };

export class Explorer {
  private mounts: { path: string, storage: Storage }[] = [];

  explore(): { path: string, writable: boolean }[] {
    return this.mounts
      .map(({ path, storage }) => ({ path, writable: storage.writable }));
  }

  private storage(path: string): Storage {
    const mount = this.mounts.find(mount => mount.path == path);
    if (!mount) throw new Error(`Cannot read path ${path}`);
    return mount.storage;
  }

  mount(path: string, storage: Storage): void {
    if (this.mounts.find(mount => mount.path == path)) {
      throw new Error(`Cannot mount storage at ${path}: path already taken`);
    }
    this.mounts.push({ path, storage });
  }

  async read(path: string, item: string): Promise<string> {
    return await this.storage(path).read(item);
  }

  async write(path: string, item: string, body: string): Promise<void> {
    return await this.storage(path).write(item, body);
  }

  async delete(path: string, item: string): Promise<boolean> {
    return await this.storage(path).delete(item);
  }

  async items(path: string): Promise<string[]> {
    return await this.storage(path).items();
  }
}
