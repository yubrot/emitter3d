import * as THREE from 'three';

import config from '../config.ts';
import BulletPool, { BulletUnit } from './BulletPool.ts';
import BulletTails from './BulletTails.ts';
import * as model from './resources/model.ts';
import * as painter from './resources/painter.ts';
import Bullet, { CommonBullet } from '../simulator/Bullet.ts';
import MotherBullet from '../simulator/MotherBullet.ts';

const capacity = 10000;

export default class Field extends THREE.Group {
  private bulletPools: any;
  private bulletTails: any;
  private bullets: Bullet[] = [];
  private diedBullets: any = {};

  renderTail = config.toggle('render tail', true);
  tailSize = config.range('tail size', 40, [10, 120], v => this.setBulletTails(v));
  tailInterval = config.range('tail interval', 2, [1, 5]);

  constructor(readonly target: THREE.Vector3, readonly boundary: number) {
    super();
    this.bulletPools = {
      missile: new BulletPool(capacity, painter.rainbow(boundary), model.missile(4, 10, 1.8)),
      arrow: new BulletPool(capacity, painter.rainbow(boundary), model.arrow(18, 2.7)),
      claw: new BulletPool(capacity, painter.rainbow(boundary), model.claw(7, 13)),
    };
    this.add(this.bulletPools.missile);
    this.add(this.bulletPools.arrow);
    this.add(this.bulletPools.claw);
    this.emitted(new MotherBullet());
  }

  setBulletTails(v: number) {
    v = Math.floor(v);
    this.bulletTails = {
      missile: new BulletTails(v, capacity),
      arrow: new BulletTails(v, capacity),
      claw: new BulletTails(v, capacity),
    };
  }

  emitted(bullet: Bullet) {
    bullet.field = this;
    this.bullets.push(bullet);
  }

  died(bullet: Bullet) {
    this.diedBullets[bullet.id] = true;
  }

  update() {
    for (const bullet of this.bullets) {
      bullet.update();
      ++bullet.frame;
    }

    this.collectDiedBullets();
    this.tailsUpdate();
  }

  private forEachBullets(modelType: string, handler: (bullet: CommonBullet) => void) {
    for (const bullet_ of this.bullets) {
      if (bullet_.type != 'common') continue;
      const bullet = <CommonBullet> bullet_;
      if (bullet.modelType == modelType) handler(bullet);
    }
  }

  private collectDiedBullets() {
    for (let i=0; i<this.bullets.length; ) {
      const id = this.bullets[i].id;
      if (this.diedBullets[id]) {
        this.bullets[i] = this.bullets[this.bullets.length-1];
        this.bullets.pop();
        delete this.diedBullets[id];
      } else {
        ++i;
      }
    }
  }

  private tailsUpdate() {
    for (const modelType in this.bulletTails) {
      const tails: BulletTails = this.bulletTails[modelType];
      tails.beginUpdate();
      this.forEachBullets(modelType, bullet => tails.put(bullet));
    }
  }

  static readonly tmpArray = new Array<BulletUnit>(capacity);

  prepareForRendering() {
    for (const modelType in this.bulletPools) {
      const pool: BulletPool = this.bulletPools[modelType];
      const tails: BulletTails = this.bulletTails[modelType];

      let i = 0;
      this.forEachBullets(modelType, bullet => Field.tmpArray[i++] = bullet);
      if (this.renderTail.value) i = tails.cast(Field.tmpArray, i, Math.floor(this.tailInterval.value), 4);

      pool.setInstances(Field.tmpArray, i);
    }
  }
}
