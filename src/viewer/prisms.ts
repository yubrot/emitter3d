import * as THREE from 'three';

import { at, color, GeometryBuilder, ObjectGeometry } from './aux/geometry-builder';

export class Prisms extends THREE.Mesh {
  constructor(private capacity: number) {
    super(Prisms.geometry(capacity, Prisms.model()), Prisms.material());
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
      attr.setUsage(THREE.DynamicDrawUsage);
      return attr;
    }

    const geometry = new THREE.InstancedBufferGeometry();
    geometry.maxInstancedCount = 0;

    geometry.setAttribute('objectPosition', objectGeometry.position);
    geometry.setAttribute('objectColor', objectGeometry.color);
    geometry.setAttribute('position', instancedBufferAttribute(3));
    geometry.setAttribute('rotation', instancedBufferAttribute(4));
    geometry.setAttribute('color', instancedBufferAttribute(3));

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

  static model(): ObjectGeometry {
    const g = new GeometryBuilder();

    const face = {
      head: g.putPoint(at(0, 0, 1), color(1, 1, 1)),
      body: [color(1, 0, 0), color(0, 1, 0), color(0, 0, 1)].map((color, i) => {
        const r = Math.PI * 2 / 3 * i;
        return g.putPoint(at(Math.cos(r), Math.sin(r), -1), color);
      }),
    };

    g.fillTriangleFan(face.head, ...face.body, face.body[0]);

    g.scale.set(2, 2, 4);
    return g.build();
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
