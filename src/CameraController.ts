import * as THREE from 'three';

import config from './config.ts';

function touchesArray(t: TouchList): Touch[] {
  return Array.prototype.slice.call(t);
}

function touchDistance(l: Touch, r: Touch) {
  return Math.sqrt((l.clientX - r.clientX) ** 2 + (l.clientY - r.clientY) ** 2);
}

export default class CameraController {
  private readonly target: { py: THREE.Vector2, distance: number };
  private readonly current: { py: THREE.Vector2, distance: number };
  private readonly dragStartPos = new THREE.Vector2(0, 0);
  private isDragging = false;

  cameraScroll = false;

  get isStable(): boolean {
    return !this.isDragging;
  }

  constructor(private container: HTMLElement, distance: number) {
    this.target = { py: new THREE.Vector2(0, 0), distance };
    this.current = { py: new THREE.Vector2(0, 0), distance };
    this.container.addEventListener('mousedown', e => this.onMouseDown(e), false);
    this.container.addEventListener('mousemove', e => this.onMouseMove(e), false);
    this.container.addEventListener('mouseup', e => this.onMouseUp(e), false);
    this.container.addEventListener('mouseout', e => this.onMouseOut(e), false);
    this.container.addEventListener('wheel', e => this.onWheel(e), false);
    this.container.addEventListener('touchstart', e => this.onTouchStart(e), false);
    this.container.addEventListener('touchmove', e => this.onTouchMove(e), false);
    document.addEventListener('touchend', e => this.onTouchEnd(e), false);
  }

  private handleDragStart(x: number, y: number) {
    this.dragStartPos.set(x, y);
    this.isDragging = true;
  }

  private handleDragMove(x: number, y: number) {
    if (!this.isDragging) return;
    const move = new THREE.Vector2((y - this.dragStartPos.y) * 0.35, (x - this.dragStartPos.x) * 0.35);
    this.target.py.add(move);
    this.dragStartPos.set(x, y);
  }

  private handleDragEnd() {
    this.isDragging = false;
  }

  private handleZoom(distance: number) {
    this.target.distance += distance;
    if (this.target.distance < 10) this.target.distance = 10;
  }

  private onMouseDown(ev: MouseEvent) {
    ev.preventDefault();
    this.handleDragStart(ev.clientX, ev.clientY);
  }

  private onMouseMove(ev: MouseEvent) {
    this.handleDragMove(ev.clientX, ev.clientY);
  }

  private onMouseUp(ev: MouseEvent) {
    this.handleDragEnd();
  }

  private onMouseOut(ev: MouseEvent) {
    this.handleDragEnd();
  }

  private onWheel(ev: WheelEvent) {
    this.handleZoom(20 * (ev.deltaY < 0 ? -1 : 1));
  }

  private readonly touchList: Touch[] = [];

  private onTouchStart(ev: TouchEvent) {
    ev.preventDefault();
    for (const t of touchesArray(ev.changedTouches)) this.touchList.push(t);

    if (this.touchList.length == 1) {
      const touch = this.touchList[0];
      this.handleDragStart(touch.clientX, touch.clientY);
    }
  }

  private onTouchMove(ev: TouchEvent) {
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

  private onTouchEnd(ev: TouchEvent) {
    for (const t of touchesArray(ev.changedTouches)) {
      for (let i = 0; i < this.touchList.length; ++i) {
        if (this.touchList[i].identifier != t.identifier) continue;
        this.touchList.splice(i, 1);
        this.handleDragEnd();
        break;
      }
    }
  }

  update(camera: THREE.Camera) {
    if (!this.isDragging && this.cameraScroll) this.target.py.y += 0.1;

    this.target.py.x = THREE.Math.clamp(this.target.py.x, -90, 90);
    this.current.py.multiplyScalar(0.75);
    this.current.py.addScaledVector(this.target.py, 0.25);
    this.current.distance *= 0.75;
    this.current.distance += this.target.distance * 0.25;

    const lat = THREE.Math.clamp(this.current.py. x, -90, 90);
    const phi = THREE.Math.degToRad(90 - lat);
    const theta = THREE.Math.degToRad(this.current.py.y);

    camera.position.set(
      this.current.distance * Math.sin(phi) * Math.cos(theta),
      this.current.distance * Math.cos(phi),
      this.current.distance * Math.sin(phi) * Math.sin(theta));
    camera.lookAt(new THREE.Vector3(0, 0, 0));
  }
}
