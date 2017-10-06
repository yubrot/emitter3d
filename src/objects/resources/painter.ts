import * as THREE from 'three';

export type Paint = (frame: number, generation: number, position: THREE.Vector3, dest: THREE.Color) => THREE.Color;

export interface Painter {
  face: Paint;
  line: Paint;
}

export function rainbow(boundary: number): Painter {
  const hlfs = [[5, 1.08], [20, 1], [70, 1], [110, 1], [150, 1], [230, 1.1], [255, 1.1], [335, 1.05]];
  const center = new THREE.Vector3(0, 0, 0);

  function paint(l: number): Paint {
    return (frame, gen, pos, dest) => {
      const a = 1 - THREE.Math.clamp(center.distanceTo(pos) - boundary, 0, boundary) / boundary;
      const [h, lf] = hlfs[gen % hlfs.length];
      return dest.setHSL((1 + h/360 + pos.y * 0.001)%1, 0.9 * a, l * lf * a * Math.min(0.9, 0.15 + frame*0.015));
    };
  }

  return { face: paint(0.5), line: paint(0.8) };
}
