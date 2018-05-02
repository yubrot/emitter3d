import * as THREE from 'three';

declare module 'three/three-core' {
  interface Quaternion {
    setToLookAt(from: Vector3, to: Vector3, up: Vector3): Quaternion;
    rotateOnAxis(axis: Vector3, angle: number): Quaternion;
    rotateX(angle: number): Quaternion;
    rotateY(angle: number): Quaternion;
    rotateZ(angle: number): Quaternion;
    distanceTo(b: Quaternion): number;
    rotateTowards(b: Quaternion, angle: number): Quaternion;
  }
}

const temporaryMatrix = new THREE.Matrix4();
const temporaryQuaternion = new THREE.Quaternion();
const temporaryVector = new THREE.Vector3();

THREE.Quaternion.prototype.setToLookAt = function(this: THREE.Quaternion, from: THREE.Vector3, to: THREE.Vector3, up: THREE.Vector3) {
  temporaryMatrix.lookAt(to, from, up);
  this.setFromRotationMatrix(temporaryMatrix);
  return this;
};

THREE.Quaternion.prototype.rotateOnAxis = function(this: THREE.Quaternion, axis: THREE.Vector3, angle: number) {
  temporaryQuaternion.setFromAxisAngle(axis, angle);
  return this.multiply(temporaryQuaternion);
};

THREE.Quaternion.prototype.rotateX = function(this: THREE.Quaternion, angle: number) {
  return this.rotateOnAxis(temporaryVector.set(1, 0, 0), angle);
};

THREE.Quaternion.prototype.rotateY = function(this: THREE.Quaternion, angle: number) {
  return this.rotateOnAxis(temporaryVector.set(0, 1, 0), angle);
};

THREE.Quaternion.prototype.rotateZ = function(this: THREE.Quaternion, angle: number) {
  return this.rotateOnAxis(temporaryVector.set(0, 0, 1), angle);
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
