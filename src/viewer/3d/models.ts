import { at, color, GeometryBuilder, ObjectGeometry } from '../aux/geometry-builder';

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
