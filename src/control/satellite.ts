import * as THREE from 'three';

function touchesArray(t: TouchList): Touch[] {
  return Array.prototype.slice.call(t);
}

function touchDistance(l: Touch, r: Touch): number {
  return Math.sqrt((l.clientX - r.clientX) ** 2 + (l.clientY - r.clientY) ** 2);
}

export class Satellite {
  private readonly _target: { py: THREE.Vector2, distance: number };
  private readonly _current: { py: THREE.Vector2, distance: number };
  private readonly _lastDragPos = new THREE.Vector2(0, 0);
  private _isDragging = false;

  get isDragging(): boolean {
    return this._isDragging;
  }

  autoRevolve = false;

  constructor(container: HTMLElement, initialDistance: number) {
    this._target = { py: new THREE.Vector2(30, 0), distance: initialDistance };
    this._current = { py: new THREE.Vector2(30, 0), distance: initialDistance };
    container.addEventListener('mousedown', e => this.onMouseDown(e), false);
    container.addEventListener('mousemove', e => this.onMouseMove(e), false);
    container.addEventListener('mouseup', e => this.onMouseUp(e), false);
    container.addEventListener('mouseout', e => this.onMouseOut(e), false);
    container.addEventListener('wheel', e => this.onWheel(e), false);
    container.addEventListener('touchstart', e => this.onTouchStart(e as TouchEvent), false);
    container.addEventListener('touchmove', e => this.onTouchMove(e as TouchEvent), false);
    document.addEventListener('touchend', e => this.onTouchEnd(e as TouchEvent), false);
  }

  private handleDragStart(x: number, y: number): void {
    this._lastDragPos.set(x, y);
    this._isDragging = true;
  }

  private handleDragMove(x: number, y: number): void {
    if (!this._isDragging) return;
    const move = new THREE.Vector2((y - this._lastDragPos.y) * 0.35, (x - this._lastDragPos.x) * 0.35);
    this._target.py.add(move);
    this._lastDragPos.set(x, y);
  }

  private handleDragEnd(): void {
    this._isDragging = false;
  }

  private handleZoom(distance: number): void {
    this._target.distance += distance;
    if (this._target.distance < 10) this._target.distance = 10;
  }

  private onMouseDown(ev: MouseEvent): void {
    if (ev.button != 0) return;
    ev.preventDefault();
    this.handleDragStart(ev.clientX, ev.clientY);
  }

  private onMouseMove(ev: MouseEvent): void {
    this.handleDragMove(ev.clientX, ev.clientY);
  }

  private onMouseUp(ev: MouseEvent): void {
    if (ev.button != 0) return;
    this.handleDragEnd();
  }

  private onMouseOut(ev: MouseEvent): void {
    this.handleDragEnd();
  }

  private onWheel(ev: WheelEvent): void {
    this.handleZoom(20 * (ev.deltaY < 0 ? -1 : 1));
  }

  private readonly touchList: Touch[] = [];

  private onTouchStart(ev: TouchEvent): void {
    ev.preventDefault();
    for (const t of touchesArray(ev.changedTouches)) this.touchList.push(t);

    if (this.touchList.length == 1) {
      const touch = this.touchList[0];
      this.handleDragStart(touch.clientX, touch.clientY);
    }
  }

  private onTouchMove(ev: TouchEvent): void {
    const movedTouches: { [identifier: string]: Touch | undefined; } = {};
    for (const t of touchesArray(ev.changedTouches)) movedTouches[t.identifier] = t;

    if (this.touchList.length == 1) {
      const touch = movedTouches[this.touchList[0].identifier];
      if (touch) this.handleDragMove(touch.clientX, touch.clientY);

    } else {
      const prevDistance = touchDistance(this.touchList[0], this.touchList[1]);
      for (let i of [0, 1]) {
        const newTouch = movedTouches[this.touchList[i].identifier];
        if (newTouch) this.touchList[i] = newTouch;
      }
      const currDistance = touchDistance(this.touchList[0], this.touchList[1]);
      this.handleZoom(prevDistance - currDistance);
    }
  }

  private onTouchEnd(ev: TouchEvent): void {
    for (const t of touchesArray(ev.changedTouches)) {
      for (let i = 0; i < this.touchList.length; ++i) {
        if (this.touchList[i].identifier != t.identifier) continue;
        this.touchList.splice(i, 1);
        this.handleDragEnd();
        break;
      }
    }
  }

  update(camera: THREE.Camera): void {
    if (!this._isDragging && this.autoRevolve) this._target.py.y += 0.1;

    this._target.py.x = THREE.Math.clamp(this._target.py.x, -90, 90);
    this._current.py.multiplyScalar(0.75);
    this._current.py.addScaledVector(this._target.py, 0.25);
    this._current.distance *= 0.75;
    this._current.distance += this._target.distance * 0.25;

    const lat = THREE.Math.clamp(this._current.py. x, -90, 90);
    const phi = THREE.Math.degToRad(90 - lat);
    const theta = THREE.Math.degToRad(this._current.py.y);

    camera.position.set(
      this._current.distance * Math.sin(phi) * Math.cos(theta),
      this._current.distance * Math.cos(phi),
      this._current.distance * Math.sin(phi) * Math.sin(theta));
    camera.lookAt(new THREE.Vector3(0, 0, 0));
  }
}
