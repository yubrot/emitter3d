import * as THREE from 'three';

declare module 'three/three-core' {
  interface Quaternion {
    setToLookAt(from: Vector3, to: Vector3, up: Vector3): Quaternion;
    setFromEulerAngles(pitch: number, yaw: number, roll: number, order?: string): Quaternion;
    distanceTo(b: Quaternion): number;
    rotateTowards(b: Quaternion, angle: number): Quaternion;
  }
}

const temporaryMatrix = new THREE.Matrix4();
const temporaryEuler = new THREE.Euler();

THREE.Quaternion.prototype.setToLookAt = function(this: THREE.Quaternion, from: THREE.Vector3, to: THREE.Vector3, up: THREE.Vector3) {
  temporaryMatrix.lookAt(to, from, up);
  this.setFromRotationMatrix(temporaryMatrix);
  return this;
};

THREE.Quaternion.prototype.setFromEulerAngles = function(this: THREE.Quaternion, pitch: number, yaw: number, roll: number, order?: string) {
  temporaryEuler.set(pitch, yaw, roll, order);
  this.setFromEuler(temporaryEuler);
  return this;
};

THREE.Quaternion.prototype.distanceTo = function(this: THREE.Quaternion, b: THREE.Quaternion) {
  return Math.acos(Math.abs(this.dot(b))) * 2;
};

THREE.Quaternion.prototype.rotateTowards = function(this: THREE.Quaternion, b: THREE.Quaternion, angle: number) {
  if (angle == 0) return this;
  const diff = this.distanceTo(b);
  if (diff < angle) return this.copy(b);
  return this.slerp(b, angle / diff);
};
