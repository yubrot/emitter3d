import * as THREE from 'three';

import { at, color, center, GeometryBuilder, ObjectGeometry } from '../aux/geometry-builder';

const white = color(1, 1, 1);
const black = color(0, 0, 0);

export function missile(): ObjectGeometry {
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
  return g.build();
}

export function arrow(): ObjectGeometry {
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
  return g.build();
}

export function claw(): ObjectGeometry {
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
      const faceCenter = center(line.body[i].position, line.body[i + 1].position);
      g1.fillInner([line.head, line.body[i], line.tail, line.body[i + 1], line.head], fin, black, faceCenter);
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
  return g.build();
}

export function prism(): ObjectGeometry {
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
