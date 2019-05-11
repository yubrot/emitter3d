import * as THREE from 'three';

import { ObjectGeometry } from '../aux/geometry-builder';

export class Instances extends THREE.Mesh {
  constructor(private capacity: number, objectGeometry: ObjectGeometry) {
    super(Instances.geometry(capacity, objectGeometry), Instances.material());
  }

  beginUpdate(): { put(position: THREE.Vector3, rotation: THREE.Quaternion, color: THREE.Color): void; complete(): void; } {
    const geometry = this.geometry as THREE.InstancedBufferGeometry;
    const positions = geometry.getAttribute('position') as THREE.InstancedBufferAttribute;
    const rotations = geometry.getAttribute('rotation') as THREE.InstancedBufferAttribute;
    const colors = geometry.getAttribute('color') as THREE.InstancedBufferAttribute;
    let count = 0;

    return {
      put: (position, rotation, color) => {
        if (count >= this.capacity) return;
        positions.setXYZ(count, position.x, position.y, position.z);
        rotations.setXYZW(count, rotation.x, rotation.y, rotation.z, rotation.w);
        colors.setXYZ(count, color.r, color.g, color.b);
        ++count;
      },
      complete: () => {
        geometry.maxInstancedCount = count;
        positions.needsUpdate = true;
        rotations.needsUpdate = true;
        colors.needsUpdate = true;
      },
    };
  }

  static geometry(capacity: number, objectGeometry: ObjectGeometry): THREE.InstancedBufferGeometry {
    function instancedBufferAttribute(n: number): THREE.InstancedBufferAttribute {
      const attr = new THREE.InstancedBufferAttribute(new Float32Array(capacity * n), n);
      attr.setDynamic(true);
      return attr;
    }

    const geometry = new THREE.InstancedBufferGeometry();
    geometry.maxInstancedCount = 0;

    geometry.addAttribute('objectPosition', objectGeometry.position);
    geometry.addAttribute('objectColor', objectGeometry.color);
    geometry.addAttribute('position', instancedBufferAttribute(3));
    geometry.addAttribute('rotation', instancedBufferAttribute(4));
    geometry.addAttribute('color', instancedBufferAttribute(3));

    geometry.setIndex(objectGeometry.index);

    return geometry;
  }

  static material(): THREE.RawShaderMaterial {
    return new THREE.RawShaderMaterial({
      uniforms: {},
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
    });
  }
}

const vertexShader = `
  precision highp float;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  attribute vec3 objectPosition;
  attribute vec3 objectColor;
  attribute vec3 position;
  attribute vec4 rotation;
  attribute vec3 color;

  varying vec4 vColor;

  void main() {
    vec3 vPosition = objectPosition + cross(rotation.xyz, cross(rotation.xyz, objectPosition) + rotation.w * objectPosition) * 2.0;

    vColor = vec4(objectColor * color, 1.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + vPosition, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  varying vec4 vColor;

  void main() {
    gl_FragColor = vColor;
  }
`;
