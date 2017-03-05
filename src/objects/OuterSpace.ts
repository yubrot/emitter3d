export default class OuterSpace extends THREE.Points {
  constructor(readonly boundary: number, num: number) {
    super(OuterSpace.randomPointsGeometry(boundary, boundary * 2, num), OuterSpace.material);
  }

  static randomPointsGeometry(near: number, far: number, num: number): THREE.Geometry {
    const zero = new THREE.Vector3(0, 0, 0);
    function randomPosition(): THREE.Vector3 {
      const vec = zero.clone();
      do {
        vec.set(
          far - Math.random() * far * 2,
          far - Math.random() * far * 2,
          far - Math.random() * far * 2);
      } while (vec.distanceTo(zero) < near || far < vec.distanceTo(zero));
      return vec;
    }

    const geometry = new THREE.Geometry();
    for (let i=0; i<num; ++i) {
      const vec = randomPosition();
      const color = new THREE.Color(0, 0, 0);
      color.setHSL(((vec.x + vec.y + vec.z) * 0.0005) % 1, 1.0, 0.8);
      geometry.vertices.push(vec);
      geometry.colors.push(color);
    }
    return geometry;
  }

  static readonly material = new THREE.PointsMaterial({
    color: 0xffffff,
    map: starTexture(),
    vertexColors: THREE.VertexColors,
    size: 4,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
}

let starTextureCache: THREE.Texture | null;

function starTexture(): THREE.Texture {
  if (starTextureCache) return starTextureCache;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;

  const c = canvas.getContext('2d')!;
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255, 255, 255, 1)');
  g.addColorStop(0.4, 'rgba(255, 255, 255, 1)');
  g.addColorStop(0.5, 'rgba(180, 180, 180, 1)');
  g.addColorStop(0.6, 'rgba(30, 30, 30, 1)');
  g.addColorStop(1, 'rgba(0, 0, 0, 1)');

  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  starTextureCache = new THREE.Texture(canvas);
  starTextureCache.needsUpdate = true;
  return starTextureCache;
}
