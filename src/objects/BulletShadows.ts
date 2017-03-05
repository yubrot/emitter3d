import { BulletUnit } from './BulletPool.ts';

export default class BulletShadows {
  private last = 0;
  private shadows: { array: BulletUnit[], length: number }[];

  constructor(totalFrame: number, private interval: number, private capacity: number) {
    this.shadows = new Array<any>(totalFrame);
    for (let i=0; i<this.shadows.length; ++i) {
      const array = new Array<BulletUnit>(this.capacity);
      this.shadows[i] = { array, length: 0 };
    }
  }

  next() {
    this.last = (this.last + 1) % this.shadows.length;
    this.shadows[this.last].length = 0;
  }

  put(bullet: BulletUnit) {
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

  cast(dest: BulletUnit[], i: number): number {
    if (i == this.capacity) return i;
    for (let j=this.shadows.length-this.interval; this.interval<=j; j -= this.interval) {
      const current = this.shadows[(j + this.last) % this.shadows.length];
      const alpha = Math.pow(j / this.shadows.length, 4) * 0.5;
      for (let k=0; k<current.length; ++k) {
        current.array[k].alpha = alpha;
        dest[i++] = current.array[k];
        if (i == this.capacity) return i;
      }
    }
    return i;
  }
}
