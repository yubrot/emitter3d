import * as THREE from 'three';

import { at, color, center, GeometryBuilder } from '../aux/geometry-builder';

export type Model = 'missile' | 'arrow' | 'claw';

export class Objects extends THREE.Group {
  private missiles: Instances;
  private arrows: Instances;
  private claws: Instances;

  constructor(capacity: number) {
    super();
    this.missiles = new Instances(capacity, missileGeometry().build());
    this.arrows = new Instances(capacity, arrowGeometry().build());
    this.claws = new Instances(capacity, clawGeometry().build());
    this.add(this.missiles);
    this.add(this.arrows);
    this.add(this.claws);
  }

  beginUpdate(): { put(model: Model, lifeTime: number, position: THREE.Vector3, rotation: THREE.Quaternion, color: THREE.Color): void; complete(): void; } {
    const missiles = this.missiles.beginUpdate();
    const arrows = this.arrows.beginUpdate();
    const claws = this.claws.beginUpdate();
    const p = new THREE.Quaternion();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    return {
      put(model, lifeTime, position, rotation, color) {
        switch (model) {
          case 'missile':
            p.copy(rotation).multiply(q.setFromEuler(e.set(0, 0, Math.PI * 0.02 * lifeTime)));
            missiles.put(position, p, color);
            break;
          case 'arrow':
            p.copy(rotation).multiply(q.setFromEuler(e.set(0, 0, Math.PI * 0.01 * lifeTime)));
            arrows.put(position, p, color);
            break;
          case 'claw':
            p.copy(rotation).multiply(q.setFromEuler(e.set(0, 0, Math.PI * -0.01 * lifeTime)));
            claws.put(position, p, color);
            break;
        }
      },
      complete() {
        missiles.complete();
        arrows.complete();
        claws.complete();
      },
    };
  }
}

type ObjectGeometry = {
  position: THREE.BufferAttribute;
  color: THREE.BufferAttribute;
  index: THREE.BufferAttribute;
};

class Instances extends THREE.Mesh {
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
      const attr = new THREE.InstancedBufferAttribute(new Float32Array(capacity * n), n, 1);
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

const white = color(1, 1, 1);
const black = color(0, 0, 0);

function missileGeometry(): GeometryBuilder {
  const g = new GeometryBuilder();

  const fin = 0.2;

  for (let i = 0; i < 8; ++i) {
    const r = Math.PI * 2 / 8 * i;
    const r1 = Math.PI * 2 / 8 * (i + 1);
    const head = (i % 2 == 0) ? 1 : 0.2;
    const tail = (i % 2 == 0) ? -0.2 : -1;

    const faceCenter = at(Math.cos((r + r1) / 2), Math.sin((r + r1) / 2), (head + tail) / 2);
    const lineCenter = at(0, 0, (head + tail) / 2);

    const faceColor = new THREE.Color().setHSL(i / 8, 0.3, 0.3);
    const lineColor = new THREE.Color().setHSL(i / 8, 0.3, 0.8);

    const face = [
      g.putPoint(at(Math.cos(r), Math.sin(r), head), faceColor),
      g.putPoint(at(Math.cos(r1), Math.sin(r1), head), faceColor),
      g.putPoint(at(Math.cos(r), Math.sin(r), tail), faceColor),
      g.putPoint(at(Math.cos(r1), Math.sin(r1), tail), black),
    ];

    const line = [
      g.putPoint(at(Math.cos(r), Math.sin(r), head), lineColor),
      g.putPoint(at(Math.cos(r1), Math.sin(r1), head), lineColor),
      g.putPoint(at(Math.cos(r), Math.sin(r), tail), black),
      g.putPoint(at(Math.cos(r1), Math.sin(r1), tail), black),
    ];

    g.fillTriangleFan(face[2], face[0], face[1], face[3]);
    g.fillInner([line[2], line[0], line[1], line[3]], fin, black, faceCenter);
    g.fillOuter([line[2], line[0], line[1], line[3]], fin, black, lineCenter);
  }

  g.scale.set(2, 2, 6);
  return g;
}

function arrowGeometry(): GeometryBuilder {
  const g = new GeometryBuilder();

  const fin = 0.12;

  const face = {
    head: g.putPoint(at(0, 0, 1), color(0.4, 0.4, 0.4)),
    body: [color(0.7, 0.1, 0.1), color(0.1, 0.7, 0.1), color(0.1, 0.1, 0.7)].map((color, i) => {
      const r = Math.PI * 2 / 3 * i;
      return g.putPoint(at(Math.cos(r), Math.sin(r), -1), color);
    }),
  };

  const line = {
    head: g.putPoint(face.head.position, white),
    body: face.body.map(p => g.putPoint(p.position, p.color.clone().addScalar(0.3))),
    heart: g.putPoint(at(0, 0, 0), white),
    tail: g.putPoint(at(0, 0, -5), black),
  };

  g.fillTriangleFan(face.head, ...face.body, face.body[0]);

  g.fillTriangleFanInner([line.head, ...line.body, line.body[0]], fin, black);
  g.fillTriangleFanInner(line.body, fin, black);

  line.body.forEach((p, i) => {
    const pNext = line.body[(i + 1) % 3];
    g.fillOuter([line.head, p, pNext], fin, black, line.heart.position);
  });

  g.fillLine(line.heart, line.tail, fin, black);

  g.scale.set(2.5, 2.5, 4);
  return g;
}

function clawGeometry(): GeometryBuilder {
  const g1 = new GeometryBuilder();

  const fin = 0.1;

  const face = {
    head: g1.putPoint(at(0.1, 0, 0.7), color(0.5, 0.5, 0.5)),
    body: [at(0.1, 0.2, 0), at(0.5, 0, 0), at(0.1, -0.2, 0)].map(pos => g1.putPoint(pos, color(0.2, 0.2, 0.2))),
    tail: g1.putPoint(at(0.1, 0, -0.3), color(0.2, 0.2, 0.2)),
  };

  const line = {
    head: g1.putPoint(face.head.position, white),
    body: face.body.map(p => g1.putPoint(p.position, color(0.5, 0.5, 0.5))),
    tail: g1.putPoint(face.tail.position, color(0.5, 0.5, 0.5)),
  };

  g1.fillTriangleFan(face.body[1], face.head, face.body[2], face.tail, face.body[0], face.head);

  for (let i = 0; i < 3; ++i) {
    if (i != 2) {
      const faceCenter = center(line.body[i].position, line.body[i+1].position);
      g1.fillInner([line.head, line.body[i], line.tail, line.body[i+1], line.head], fin, black, faceCenter);
    }
    const lineCenter = center(line.head.position, line.tail.position);
    g1.fillOuter([line.head, line.body[i], line.tail], fin, black, lineCenter);
  }

  const g2 = g1.clone();
  g2.rotateZ(Math.PI);

  const g = new GeometryBuilder();
  g.add(g1);
  g.add(g2);
  g.scale.set(4.5, 4.5, 8);
  return g;
}
