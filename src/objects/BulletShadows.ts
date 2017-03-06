import { BulletUnit } from './BulletPool.ts';

export default class BulletShadows {
  private last = 0;
  private shadows: { array: BulletUnit[], length: number }[];

  constructor(totalFrame: number, private capacity: number) {
    this.shadows = new Array<any>(totalFrame);
    for (let i=0; i<this.shadows.length; ++i) {
      const array = new Array<BulletUnit>(this.capacity);
      this.shadows[i] = { array, length: 0 };
    }
  }

  beginUpdate() {
    this.last = (this.last + 1) % this.shadows.length;
    this.shadows[this.last].length = 0;
  }

  put(bullet: BulletUnit) {
    // To reduce allocations, shadows cache all BulletUnit objects.
    const current = this.shadows[this.last];
    const shadow = current.array[current.length] || <any> {
      direction: new THREE.Quaternion(),
      position: new THREE.Vector3(),
    };
    shadow.frame = bullet.frame;
    shadow.generation = bullet.generation;
    shadow.direction.copy(bullet.direction);
    shadow.position.copy(bullet.position);
    shadow.alpha = 1;
    current.array[current.length++] = shadow;
  }

  cast(dest: BulletUnit[], i: number, interval: number, r1: number, r2: number): number {
    for (let j=this.shadows.length-interval; interval<=j; j -= interval) {
      const current = this.shadows[(j + this.last) % this.shadows.length];
      const alpha = Math.pow(j / this.shadows.length, r1) * r2;
      if (dest.length <= i + current.length) return i;
      for (let k=0; k<current.length; ++k) {
        current.array[k].alpha = alpha;
        dest[i++] = current.array[k];
      }
    }
    return i;
  }
}
