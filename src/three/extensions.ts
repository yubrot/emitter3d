import * as THREE from 'three';

declare module 'three/three-core' {
  interface Object3D {
    matrixTo(position: Vector3, dest?: Matrix4): Matrix4;
    quaternionTo(position: Vector3, dest?: Quaternion): Quaternion;
  }

  interface Vector3 {
    matrixTo(position: Vector3, up: Vector3, dest?: Matrix4): Matrix4;
    quaternionTo(position: Vector3, up: Vector3, dest?: Quaternion): Quaternion;
  }

  interface Quaternion {
    vectorX(dest?: Vector3): Vector3;
    vectorY(dest?: Vector3): Vector3;
    vectorZ(dest?: Vector3): Vector3;

    angleTo(b: Quaternion): number;
    rotateOnAxis(axis: Vector3, angle: number): Quaternion;
    rotateX(angle: number): Quaternion;
    rotateY(angle: number): Quaternion;
    rotateZ(angle: number): Quaternion;
    rotateTo(b: Quaternion, angle: number): Quaternion;
  }
}

// Note:
// Functions that take `dest` as an argument will use temporaryXXX if that argument is omitted.

const temporaryMatrix = new THREE.Matrix4();

const temporaryQuaternion = new THREE.Quaternion();

const temporaryVectorA = new THREE.Vector3();
const temporaryVectorB = new THREE.Vector3();

THREE.Object3D.prototype.matrixTo = function(this: THREE.Object3D, position: THREE.Vector3, dest?: THREE.Matrix4) {
  return this.position.matrixTo(position, this.up, dest);
};

THREE.Object3D.prototype.quaternionTo = function(this: THREE.Object3D, position: THREE.Vector3, dest?: THREE.Quaternion) {
  return this.position.quaternionTo(position, this.up, dest);
};

THREE.Vector3.prototype.matrixTo = function(this: THREE.Vector3, position: THREE.Vector3, up: THREE.Vector3, dest?: THREE.Matrix4) {
  return (dest || temporaryMatrix).lookAt(position, this, up);
}

THREE.Vector3.prototype.quaternionTo = function(this: THREE.Vector3, position: THREE.Vector3, up: THREE.Vector3, dest?: THREE.Quaternion) {
  return (dest || temporaryQuaternion).setFromRotationMatrix(this.matrixTo(position, up));
};

THREE.Quaternion.prototype.vectorX = function(this: THREE.Quaternion, dest?: THREE.Vector3) {
  return (dest || temporaryVectorA).set(1, 0, 0).applyQuaternion(this);
};

THREE.Quaternion.prototype.vectorY = function(this: THREE.Quaternion, dest?: THREE.Vector3) {
  return (dest || temporaryVectorA).set(0, 1, 0).applyQuaternion(this);
};

THREE.Quaternion.prototype.vectorZ = function(this: THREE.Quaternion, dest?: THREE.Vector3) {
  return (dest || temporaryVectorA).set(0, 0, 1).applyQuaternion(this);
};

THREE.Quaternion.prototype.angleTo = function(this: THREE.Quaternion, b: THREE.Quaternion) {
  return this.vectorZ(temporaryVectorA).angleTo(b.vectorZ(temporaryVectorB));
};

THREE.Quaternion.prototype.rotateOnAxis = function(this: THREE.Quaternion, axis: THREE.Vector3, angle: number) {
  temporaryQuaternion.setFromAxisAngle(axis, angle);
  return this.multiply(temporaryQuaternion);
};

const vectorX = new THREE.Vector3(1, 0, 0);
const vectorY = new THREE.Vector3(0, 1, 0);
const vectorZ = new THREE.Vector3(0, 0, 1);

THREE.Quaternion.prototype.rotateX = function(this: THREE.Quaternion, angle: number) {
  return this.rotateOnAxis(vectorX, angle);
};

THREE.Quaternion.prototype.rotateY = function(this: THREE.Quaternion, angle: number) {
  return this.rotateOnAxis(vectorY, angle);
};

THREE.Quaternion.prototype.rotateZ = function(this: THREE.Quaternion, angle: number) {
  return this.rotateOnAxis(vectorZ, angle);
};

THREE.Quaternion.prototype.rotateTo = function(this: THREE.Quaternion, b: THREE.Quaternion, angle: number) {
  const diff = this.angleTo(b);
  if (diff < angle) return this.copy(b);
  return this.slerp(b, angle / diff);
};
