import * as THREE from 'three';

export type CameraPosition = {
  x: number;
  y: number;
  d: number;
};

export class Camera extends THREE.PerspectiveCamera {
  targetPosition: CameraPosition;
  currentPosition: CameraPosition;
  delayFactor = 0.75;

  constructor(fov: number, aspect: number, near: number, far: number, initialPosition: CameraPosition) {
    super(fov, aspect, near, far);
    this.targetPosition = { ...initialPosition };
    this.currentPosition = { ...initialPosition };
  }

  setSize(width: number, height: number): void {
    this.aspect = width / height;
    this.updateProjectionMatrix();
  }

  update(): void {
    this.targetPosition.y = THREE.MathUtils.clamp(this.targetPosition.y, -90, 90);
    this.targetPosition.d = Math.max(this.targetPosition.d, 10);
    this.currentPosition.x = this.currentPosition.x * this.delayFactor + this.targetPosition.x * (1 - this.delayFactor);
    this.currentPosition.y = this.currentPosition.y * this.delayFactor + this.targetPosition.y * (1 - this.delayFactor);
    this.currentPosition.d = this.currentPosition.d * this.delayFactor + this.targetPosition.d * (1 - this.delayFactor);

    const lat = THREE.MathUtils.clamp(this.currentPosition.y, -90, 90);
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(this.currentPosition.x);

    this.position.set(
      this.currentPosition.d * Math.sin(phi) * Math.cos(theta),
      this.currentPosition.d * Math.cos(phi),
      this.currentPosition.d * Math.sin(phi) * Math.sin(theta));
    this.lookAt(new THREE.Vector3(0, 0, 0));
  }
}

export class CameraController {
  private _isDragging = false;
  private lastDragPos = { x: 0, y: 0 };
  private activeTocuhes: Touch[] = [];

  get isDragging(): boolean {
    return this._isDragging;
  }

  constructor(private _camera: Camera) { }

  bind(container: HTMLElement): void {
    container.addEventListener('mousedown', this.onMouseDown, false);
    document.addEventListener('mousemove', this.onMouseMove, false);
    document.addEventListener('mouseup', this.onMouseUp, false);
    container.addEventListener('wheel', this.onWheel, false);
    container.addEventListener('touchstart', this.onTouchStart, false);
    container.addEventListener('touchmove', this.onTouchMove, false);
    document.addEventListener('touchend', this.onTouchEnd, false);
  }

  unbind(container: HTMLElement): void {
    container.removeEventListener('mousedown', this.onMouseDown, false);
    document.removeEventListener('mousemove', this.onMouseMove, false);
    document.removeEventListener('mouseup', this.onMouseUp, false);
    container.removeEventListener('wheel', this.onWheel, false);
    container.removeEventListener('touchstart', this.onTouchStart, false);
    container.removeEventListener('touchmove', this.onTouchMove, false);
    document.removeEventListener('touchend', this.onTouchEnd, false);
  }

  private handleDragStart(x: number, y: number): void {
    this.lastDragPos.x = x;
    this.lastDragPos.y = y;
    this._isDragging = true;
  }

  private handleDragMove(x: number, y: number): void {
    if (!this._isDragging) return;
    this._camera.targetPosition.x += (x - this.lastDragPos.x) * 0.35;
    this._camera.targetPosition.y += (y - this.lastDragPos.y) * 0.35;
    this.lastDragPos.x = x;
    this.lastDragPos.y = y;
  }

  private handleDragEnd(): void {
    this._isDragging = false;
  }

  private handleZoom(distance: number): void {
    this._camera.targetPosition.d += distance;
  }

  private onMouseDown = (ev: MouseEvent) => {
    if (ev.button != 0) return;
    ev.preventDefault();
    this.handleDragStart(ev.clientX, ev.clientY);
  };

  private onMouseMove = (ev: MouseEvent) => {
    this.handleDragMove(ev.clientX, ev.clientY);
  };

  private onMouseUp = (ev: MouseEvent) => {
    if (ev.button != 0) return;
    this.handleDragEnd();
  };

  private onWheel = (ev: WheelEvent) => {
    this.handleZoom(ev.deltaY < 0 ? -10 : 10);
  };

  private onTouchStart = (ev: TouchEvent) => {
    ev.preventDefault();
    for (const t of iterableTouches(ev.changedTouches)) this.activeTocuhes.push(t);

    if (this.activeTocuhes.length == 1) {
      const touch = this.activeTocuhes[0];
      this.handleDragStart(touch.clientX, touch.clientY);
    }
  };

  private onTouchMove = (ev: TouchEvent) => {
    const movedTouches: { [identifier: string]: Touch | undefined; } = {};
    for (const t of iterableTouches(ev.changedTouches)) movedTouches[t.identifier] = t;

    if (this.activeTocuhes.length == 1) {
      const touch = movedTouches[this.activeTocuhes[0].identifier];
      if (touch) this.handleDragMove(touch.clientX, touch.clientY);

    } else {
      const prevDistance = distanceBetweenTouches(this.activeTocuhes[0], this.activeTocuhes[1]);
      for (let i of [0, 1]) {
        const newTouch = movedTouches[this.activeTocuhes[i].identifier];
        if (newTouch) this.activeTocuhes[i] = newTouch;
      }
      const currDistance = distanceBetweenTouches(this.activeTocuhes[0], this.activeTocuhes[1]);
      this.handleZoom(prevDistance - currDistance);
    }
  };

  private onTouchEnd = (ev: TouchEvent) => {
    for (const t of iterableTouches(ev.changedTouches)) {
      for (let i = 0; i < this.activeTocuhes.length; ++i) {
        if (this.activeTocuhes[i].identifier != t.identifier) continue;
        this.activeTocuhes.splice(i, 1);
        this.handleDragEnd();
        break;
      }
    }
  };
}

function iterableTouches(t: TouchList): Touch[] {
  return Array.prototype.slice.call(t);
}

function distanceBetweenTouches(l: Touch, r: Touch): number {
  return Math.sqrt((l.clientX - r.clientX) ** 2 + (l.clientY - r.clientY) ** 2);
}
