import config from '../config.ts';
import BulletPool, { BulletUnit } from './BulletPool.ts';
import BulletShadows from './BulletShadows.ts';
import * as shape from './resources/shape.ts';
import * as painter from './resources/painter.ts';
import Bullet, { CommonBullet } from '../simulator/Bullet.ts';
import MotherBullet from '../simulator/MotherBullet.ts';

const capacity = 10000;

export default class Field extends THREE.Group {
  private bulletPools: any;
  private bulletShadows: any;
  private bullets: Bullet[] = [];
  private diedBullets: any = {};

  renderShadow = config.toggle('render shadow', true);

  constructor(readonly target: THREE.Vector3, readonly boundary: number) {
    super();
    this.emitted(new MotherBullet());
    this.bulletPools = {
      missile: new BulletPool(capacity, painter.rainbow(boundary), shape.missile(4, 10, 1.8)),
      arrow: new BulletPool(capacity, painter.rainbow(boundary), shape.arrow(18, 2.7)),
      claw: new BulletPool(capacity, painter.rainbow(boundary), shape.claw(7, 13)),
    };
    this.bulletShadows = {
      missile: new BulletShadows(45, 3, capacity),
      arrow: new BulletShadows(45, 3, capacity),
      claw: new BulletShadows(45, 3, capacity),
    };
    this.add(this.bulletPools.missile);
    this.add(this.bulletPools.arrow);
    this.add(this.bulletPools.claw);
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
    this.setPoolInstances();
  }

  collectDiedBullets() {
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

  static readonly tmpArray = new Array<BulletUnit>(capacity);

  setPoolInstances() {
    for (const shapeType in this.bulletPools) {
      const shadows: BulletShadows = this.bulletShadows[shapeType];
      shadows.next();

      let i = 0;
      for (const bullet_ of this.bullets) {
        if (bullet_.type != 'common') continue;
        const bullet = <CommonBullet> bullet_;
        if (bullet.shapeType == shapeType) {
          Field.tmpArray[i++] = bullet;
          shadows.put(bullet);
        }
      }
      if (this.renderShadow.value) i = shadows.cast(Field.tmpArray, i);
      this.bulletPools[shapeType].setInstances(Field.tmpArray.slice(0, i));
    }
  }
}
