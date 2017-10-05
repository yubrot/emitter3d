import config from '../config.ts';
import { Bullet, Behavior } from './Bullet.ts';
import formulate from './formulate.ts';

export default class MotherBullet extends Bullet {
  type = 'mother';

  rotation = new THREE.Euler(0, 0, -Math.PI * 0.2, 'ZXY');
  generation = 0;
  trigger: Behavior;

  // aim = config.toggle('aim', false);
  strength = config.range('pattern strength', 500, [10, 2000]);
  interval = config.range('pattern interval', 240, [60, 600]);
  refresh = config.toggle('pattern update', true);

  update() {
    // if (this.aim.value) {
    //   if (this.nearestTarget)
    //     this.turnTo(this.position.quaternionTo(this.nearestTarget, this.up), 0.03);
    // } else {
      this.rotation.y += Math.PI * 0.003;
      this.direction.setFromEuler(this.rotation);
    // }

    if (this.frame % Math.floor(this.interval.value) == 0) {
      this.frame = 0;
      this.generation += 3;
      if (this.refresh.value) this.trigger = formulate(this.generation, this.strength.value);
    }
    this.trigger();
  }

  die() {}
}
