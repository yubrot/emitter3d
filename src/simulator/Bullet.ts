export type Behavior = (this: Bullet) => void;

export interface Field {
  target: THREE.Vector3 | null;
  boundary: number;

  emitted(bullet: Bullet): void;
  died(bullet: Bullet): void;
}

export abstract class Bullet {
  type: any;

  id = ++Bullet.nextId;
  frame = 0;
  speed = 0;
  position = new THREE.Vector3();
  direction = new THREE.Quaternion();
  up = new THREE.Vector3(0, 1, 0);

  field: Field;

  static nextId = 0;

  constructor() {
    // this.direction.onChange(() => this.up.copy(this.direction.vectorY()));
  }

  abstract update(): void;

  forward(v = this.speed) {
    this.position.addScaledVector(this.direction.vectorZ(), v);
  }

  pitch(angle: number) {
    this.direction.rotateX(angle);
  }

  yaw(angle: number) {
    this.direction.rotateY(angle);
  }

  roll(angle: number) {
    this.direction.rotateZ(angle);
  }

  turnTo(b: THREE.Quaternion, angle: number) {
    this.direction.rotateTo(b, angle);
  }

  emit<T extends Bullet>(e: T): T {
    this.field.emitted(e);
    e.position.copy(this.position);
    e.direction.copy(this.direction);
    return e;
  }

  die() {
    this.field.died(this);
  }

  get nearestTarget(): THREE.Vector3 | null {
    return this.field.target;
  }
}

export default Bullet;

export type CommonBulletShapeType = 'missile' | 'arrow' | 'claw';

export class CommonBullet extends Bullet {
  type = 'common';

  generation: number;
  engine?: Behavior;
  rudder?: Behavior;
  trigger?: Behavior;

  constructor(public shapeType: CommonBulletShapeType) {
    super();
  }

  update() {
    if (this.engine) this.engine();
    if (this.rudder) this.rudder();
    this.leaveIfOut();
    this.forward();
    if (this.trigger) this.trigger();
  }

  private leaveIfOut() {
    const length = this.position.length();
    if (this.field.boundary < length) {
      this.speed *= 1 + (length - this.field.boundary) * 0.002;
      if (this.field.boundary * 2 < length) this.die();
    }
  }
}
