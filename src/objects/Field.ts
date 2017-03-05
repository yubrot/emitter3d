import BulletPool from './BulletPool.ts';
import * as shape from './resources/shape.ts';
import * as painter from './resources/painter.ts';
import Bullet from '../simulator/Bullet.ts';
import MotherBullet from '../simulator/MotherBullet.ts';

export default class Field extends THREE.Group {
  private bulletPools: any;
  private bullets: Bullet[] = [];
  private diedBullets: any = {};

  constructor(readonly target: THREE.Vector3, readonly boundary: number) {
    super();
    this.emitted(new MotherBullet());
    this.bulletPools = {
      missile: new BulletPool(20000, painter.rainbow(boundary), shape.missile(4, 10, 1.8)),
      arrow: new BulletPool(20000, painter.rainbow(boundary), shape.arrow(18, 2.7)),
      claw: new BulletPool(20000, painter.rainbow(boundary), shape.claw(7, 13)),
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

  static readonly tmpArray = new Array<any>(20000);

  setPoolInstances() {
    for (let shapeType in this.bulletPools) {
      let i = 0;
      for (const bullet of this.bullets) {
        if (bullet.type == 'common' && (<any> bullet).shapeType == shapeType)
          Field.tmpArray[i++] = <any> bullet;
      }
      this.bulletPools[shapeType].setInstances(Field.tmpArray.slice(0, i));
    }
  }
}
