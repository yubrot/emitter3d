import * as THREE from 'three';

import config from '../config.ts';
import { Bullet, Behavior } from './Bullet.ts';
import formulate from './formulate.ts';

export default class MotherBullet extends Bullet {
  type = 'mother';

  rotation = new THREE.Euler(0, 0, -Math.PI * 0.2, 'ZXY');
  generation = 0;
  trigger!: Behavior;

  aim!: boolean;
  strength!: number;
  interval!: number;
  refresh!: boolean;

  constructor() {
    super();

    const c = config.folder('Pattern');
    config.toggle('aim', true, v => this.aim = v);
    c.range('pattern strength', 500, [10, 2000], v => this.strength = v);
    c.range('pattern interval', 240, [60, 600], v => this.interval = v);
    c.toggle('pattern update', true, v => this.refresh = v);
  }

  update() {
    if (this.aim) {
      if (this.nearestTarget)
        this.turnTo(this.position.quaternionTo(this.nearestTarget, this.up), 0.03);
    } else {
      this.rotation.y += Math.PI * 0.003;
      this.direction.setFromEuler(this.rotation);
    }

    if (this.frame % Math.floor(this.interval) == 0) {
      this.frame = 0;
      this.generation += 3;
      if (this.refresh) this.trigger = formulate(this.aim, this.generation, this.strength);
    }
    this.trigger();
  }

  die() {}
}
