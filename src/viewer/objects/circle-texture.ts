import * as THREE from 'three';

let circleTextureCache: THREE.Texture | null;

export function circleTexture(): THREE.Texture {
  if (circleTextureCache) return circleTextureCache;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  const c = canvas.getContext('2d')!;
  const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255, 255, 255, 1)');
  g.addColorStop(0.7, 'rgba(255, 255, 255, 1)');
  g.addColorStop(0.8, 'rgba(180, 180, 180, 1)');
  g.addColorStop(0.9, 'rgba(30, 30, 30, 1)');
  g.addColorStop(1, 'rgba(0, 0, 0, 1)');

  c.fillStyle = g;
  c.fillRect(0, 0, 256, 256);
  circleTextureCache = new THREE.Texture(canvas);
  circleTextureCache.needsUpdate = true;
  return circleTextureCache;
}
