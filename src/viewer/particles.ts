import * as THREE from 'three';

import { RadialTexture } from './aux/radial-texture';
import { hsl2rgb, snoise4d } from './aux/shader-functions';

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
    const hslas = new THREE.BufferAttribute(new Float32Array(capacity * 4), 4);
    const diffusion = new THREE.BufferAttribute(new Float32Array(capacity), 1);
    const time = new THREE.BufferAttribute(new Float32Array(capacity), 1);
    const scale = new THREE.BufferAttribute(new Float32Array(capacity), 1);
    positions.setUsage(THREE.DynamicDrawUsage);
    hslas.setUsage(THREE.DynamicDrawUsage);
    diffusion.setUsage(THREE.DynamicDrawUsage);
    time.setUsage(THREE.DynamicDrawUsage);
    scale.setUsage(THREE.DynamicDrawUsage);
    this.buffer.setAttribute('position', positions);
    this.buffer.setAttribute('hsla', hslas);
    this.buffer.setAttribute('diffusion', diffusion);
    this.buffer.setAttribute('time', time);
    this.buffer.setAttribute('scale', scale);
    this.buffer.setDrawRange(0, 0);
    this.frustumCulled = false;
  }

  setSize(width: number, height: number) {
    this.mat.setSize(width, height);
  }

  beginUpdateState(): {
    put(position: THREE.Vector3, hsla: THREE.Vector4, diffusion: number, time: number, scale: number): void;
    complete(): void;
  } {
    let count = 0;
    const positions = this.buffer.getAttribute('position') as THREE.BufferAttribute;
    const hslas = this.buffer.getAttribute('hsla') as THREE.BufferAttribute;
    const diffusion = this.buffer.getAttribute('diffusion') as THREE.BufferAttribute;
    const time = this.buffer.getAttribute('time') as THREE.BufferAttribute;
    const scale = this.buffer.getAttribute('scale') as THREE.BufferAttribute;

    return {
      put: (position, hsla, d, t, s) => {
        if (count >= this.capacity) return;
        positions.setXYZ(count, position.x, position.y, position.z);
        hslas.setXYZW(count, hsla.x, hsla.y, hsla.z, hsla.w);
        diffusion.setX(count, d);
        time.setX(count, t);
        scale.setX(count, s);
        ++count;
      },
      complete: () => {
        this.buffer.setDrawRange(0, count);
        positions.needsUpdate = true;
        hslas.needsUpdate = true;
        diffusion.needsUpdate = true;
        time.needsUpdate = true;
        scale.needsUpdate = true;
        this.mat.updateMap();
      },
    };
  }
}

export class ParticlesMaterial extends THREE.RawShaderMaterial {
  constructor() {
    super({
      uniforms: {
        globalSize: { value: 1.0 },
        screenScale: { value: 1.0 },
        attenuation: { value: false },
        fineness: { value: 0.01 },
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

  setSize(width: number, height: number) {
    this.uniforms.screenScale.value = height * 0.5;
  }

  changeOptions(
    sizeAttenuation: boolean,
    coreRadius: number,
    coreSharpness: number,
    shellRadius: number,
    shellLightness: number,
    diffusionFineness: number): void {
    this.uniforms.globalSize.value = (coreRadius + shellRadius) * 2 * window.devicePixelRatio;
    this.uniforms.attenuation.value = sizeAttenuation;
    this.uniforms.fineness.value = diffusionFineness;
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

  uniform float globalSize;
  uniform float screenScale;
  uniform bool attenuation;
  uniform float fineness;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  attribute vec3 position;
  attribute vec4 hsla;
  attribute float diffusion;
  attribute float time;
  attribute float scale;

  varying vec4 vHsla;

  ${snoise4d}

  void main() {
    vec3 pos = position;
    pos.x += snoise(vec4(position.xyz * fineness + vec3(1, 0, 0), time)) * diffusion;
    pos.y += snoise(vec4(position.yzx * fineness + vec3(0, 1, 0), time)) * diffusion;
    pos.z += snoise(vec4(position.zxy * fineness + vec3(0, 0, 1), time)) * diffusion;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    vHsla = vec4(hsla.x + pos.y * 0.001, hsla.yzw);
    gl_PointSize = globalSize * scale * hsla.w;
    if (attenuation) gl_PointSize *= screenScale / -mvPosition.z;
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
