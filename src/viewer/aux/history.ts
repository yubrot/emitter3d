export class History<A> {
  // payload[head], payload[head-1], payload[head-2], ..
  private head: number;
  private payload: { array: A[]; length: number }[];

  get capacity(): number {
    return this.payload.length;
  }

  constructor(private alloc: () => A, capacity: number) {
    this.head = 0;
    this.payload = new Array(capacity);
    for (let i = 0; i < this.payload.length; ++i) this.payload[i] = { array: [], length: 0 };
  }

  putSnapshot<I>(items: Iterable<I>, write: (item: I, dest: A) => void): void {
    this.head = (this.head + 1) % this.payload.length;
    const snapshot = this.payload[this.head];

    let i = 0;
    for (const item of items) {
      if (snapshot.array.length <= i) snapshot.array.push(this.alloc());
      write(item, snapshot.array[i]);
      ++i;
    }
    snapshot.length = i;
  }

  clear(release = false): void {
    for (let i = 0; i < this.payload.length; ++i) {
      this.payload[i].length = 0;
      if (release) this.payload[i].array = [];
    }
  }

  *snapshot(index: number): Iterable<A> {
    console.assert(index < this.payload.length);
    const snapshot = this.payload[(this.head - index + this.payload.length) % this.payload.length];
    for (let i = 0; i < snapshot.length; ++i) yield snapshot.array[i];
  }
}
