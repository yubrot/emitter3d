import { BulletUnit } from './BulletPool.ts';

export default class BulletTails {
  private last = 0;
  private tails: { array: BulletUnit[], length: number }[];

  constructor(totalFrame: number, private capacity: number) {
    this.tails = new Array<any>(totalFrame);
    for (let i=0; i<this.tails.length; ++i) {
      const array = new Array<BulletUnit>(this.capacity);
      this.tails[i] = { array, length: 0 };
    }
  }

  beginUpdate() {
    this.last = (this.last + 1) % this.tails.length;
    this.tails[this.last].length = 0;
  }

  put(bullet: BulletUnit) {
    // To reduce allocations, tails cache all BulletUnit objects.
    const current = this.tails[this.last];
    const tail = current.array[current.length] || <any> {
      direction: new THREE.Quaternion(),
      position: new THREE.Vector3(),
    };
    tail.frame = bullet.frame;
    tail.generation = bullet.generation;
    tail.direction.copy(bullet.direction);
    tail.position.copy(bullet.position);
    tail.alpha = 1;
    current.array[current.length++] = tail;
  }

  cast(dest: BulletUnit[], i: number, interval: number, decay: number): number {
    for (let j=this.tails.length-interval; interval<=j; j -= interval) {
      const current = this.tails[(j + this.last) % this.tails.length];
      const alpha = Math.pow(j / this.tails.length, decay);
      if (dest.length <= i + current.length) return i;
      for (let k=0; k<current.length; ++k) {
        current.array[k].alpha = alpha;
        dest[i++] = current.array[k];
      }
    }
    return i;
  }
}
