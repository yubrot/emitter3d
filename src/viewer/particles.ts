import * as THREE from 'three';

import { RadialTexture } from './aux/radial-texture';
import { hsl2rgb } from './aux/shader-functions';

export class Particles extends THREE.Points {
  get buffer(): THREE.BufferGeometry {
    return this.geometry as THREE.BufferGeometry;
  }

  get mat(): ParticlesMaterial {
    return this.material as ParticlesMaterial;
  }

  constructor(private capacity: number) {
    super(new THREE.BufferGeometry(), new ParticlesMaterial());
    const positions = new THREE.BufferAttribute(new Float32Array(capacity * 3), 3);
    const hslas = new THREE.BufferAttribute(new Float32Array(capacity * 4), 3);
    positions.setUsage(THREE.DynamicDrawUsage);
    hslas.setUsage(THREE.DynamicDrawUsage);
    this.buffer.setAttribute('position', positions);
    this.buffer.setAttribute('hsla', hslas);
    this.buffer.setDrawRange(0, 0);
    this.frustumCulled = false;
  }

  beginUpdate(): {
    put(position: THREE.Vector3, hsla: THREE.Vector4): void;
    complete(): void;
  } {
    let count = 0;
    const positions = this.buffer.getAttribute('position') as THREE.BufferAttribute;
    const hslas = this.buffer.getAttribute('hsla') as THREE.BufferAttribute;

    return {
      put: (position, hsla) => {
        if (count >= this.capacity) return;
        positions.setXYZ(count, position.x, position.y, position.z);
        hslas.setXYZW(count, hsla.x, hsla.y, hsla.z, hsla.w);
        ++count;
      },
      complete: () => {
        this.buffer.setDrawRange(0, count);
        positions.needsUpdate = true;
        hslas.needsUpdate = true;
        this.mat.updateMap();
      },
    };
  }

  setSize(width: number, height: number) {
    this.mat.uniforms.scale.value = height * 0.5;
  }
}

export class ParticlesMaterial extends THREE.RawShaderMaterial {
  constructor() {
    super({
      uniforms: {
        size: { value: 1.0 },
        attenuation: { value: false },
        scale: { value: 1.0 },
        map: { value: null },
      },
      vertexShader,
      fragmentShader,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  private corePart = 0.5;
  private coreSharpness = 0;
  private shellLightness = 0.5;

  mapNeedsUpdate = true;

  changeOptions(
    sizeAttenuation: boolean,
    coreRadius: number,
    coreSharpness: number,
    shellRadius: number,
    shellLightness: number): void {
    this.uniforms.size.value = (coreRadius + shellRadius) * 2 * window.devicePixelRatio;
    this.uniforms.attenuation.value = sizeAttenuation;
    const coreWidth = coreRadius / (coreRadius + shellRadius);
    this.mapNeedsUpdate =
      this.mapNeedsUpdate ||
      this.corePart != coreWidth ||
      this.coreSharpness != coreSharpness ||
      this.shellLightness != shellLightness;
    this.corePart = coreWidth;
    this.coreSharpness = coreSharpness;
    this.shellLightness = shellLightness;
  }

  updateMap(): void {
    if (!this.mapNeedsUpdate) return;
    this.uniforms.map.value = new RadialTexture()
      .easeInTo(1 - this.corePart, this.shellLightness)
      .easeOutTo(1, 1, 2 ** Math.exp(this.coreSharpness))
      .render();
    this.mapNeedsUpdate = false;
  }
}

const vertexShader = `
  precision highp float;

  uniform float size;
  uniform float scale;
  uniform bool attenuation;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  attribute vec3 position;
  attribute vec4 hsla;

  varying vec4 vHsla;

  void main() {
    vHsla = vec4(hsla.x + position.y * 0.001, hsla.yzw);
    gl_PointSize = size;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    if (attenuation) gl_PointSize *= scale / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  precision highp float;

  uniform sampler2D map;

  varying vec4 vHsla;

  ${hsl2rgb}

  void main() {
    vec3 rgb = hsl2rgb(vHsla.xyz);
    vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
    gl_FragColor = vec4(rgb, vHsla.a) * texture2D(map, uv);
  }
`;
