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
        size: { value: 1.0 },
        screenScale: { value: 1.0 },
        bokehScale: { value: 3.0 },
        nearClip: { value: 1 },
        farClip: { value: 100 },
        dof: { value: false },
        dofFocus: { value: 0.3 },
        dofAperture: { value: 0 },
        attenuation: { value: false },
        fineness: { value: 0.01 },
        mapSolid: { value: null },
        mapBokeh: { value: null },
      },
      vertexShader,
      fragmentShader,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  private coreRadius = 0.5;
  private coreSharpness = 0;
  private shellRadius = 0.5;
  private shellLightness = 0.5;

  mapNeedsUpdate = true;

  setCameraClip(near: number, far: number): void {
    this.uniforms.nearClip.value = near;
    this.uniforms.farClip.value = far;
  }

  setSize(width: number, height: number): void {
    this.uniforms.screenScale.value = height * 0.5;
  }

  changeOptions(
    dof: boolean,
    dofFocus: number,
    dofAperture: number,
    sizeAttenuation: boolean,
    diffusionFineness: number,
    coreRadius: number,
    coreSharpness: number,
    shellRadius: number,
    shellLightness: number): void {
    this.uniforms.dof.value = dof;
    this.uniforms.dofFocus.value = dofFocus;
    this.uniforms.dofAperture.value = dofAperture;
    this.uniforms.attenuation.value = sizeAttenuation;
    this.uniforms.fineness.value = diffusionFineness;
    this.mapNeedsUpdate =
      this.mapNeedsUpdate ||
      this.coreRadius != coreRadius ||
      this.coreSharpness != coreSharpness ||
      this.shellRadius != shellRadius ||
      this.shellLightness != shellLightness;
    this.coreRadius = coreRadius;
    this.coreSharpness = coreSharpness;
    this.shellRadius = shellRadius;
    this.shellLightness = shellLightness;
  }

  updateMap(): void {
    if (!this.mapNeedsUpdate) return;
    this.mapNeedsUpdate = false;
    const bokehScale = 2;
    const size = Math.max(
      this.coreRadius * bokehScale + this.shellRadius * 0.5,
      this.coreRadius + this.shellRadius);
    const x1 = 1 - (this.coreRadius + this.shellRadius) / size;
    const x2 = 1 - this.coreRadius / size;
    const x3 = 1 - this.coreRadius * bokehScale / size;
    this.uniforms.size.value = size * 2 * devicePixelRatio;
    this.uniforms.mapSolid.value = new RadialTexture()
      .easeInTo(x1, 0)
      .easeInTo(x2, this.shellLightness)
      .easeOutTo(1, 1, 2 ** Math.exp(this.coreSharpness))
      .render();
    // FIXME: Compute the lightness which is exactly equivalent to mapSolid
    this.uniforms.mapBokeh.value = new RadialTexture()
      .easeInTo(x3, 1 / bokehScale / this.uniforms.bokehScale.value * this.shellLightness)
      .easeOutTo(1, 1 / bokehScale / this.uniforms.bokehScale.value, 2 ** Math.exp(-3))
      .render();
  }
}

const vertexShader = `
  precision highp float;

  uniform float size;
  uniform float screenScale;
  uniform float bokehScale;
  uniform float nearClip;
  uniform float farClip;
  uniform bool dof;
  uniform float dofFocus;
  uniform float dofAperture;
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
  varying float vFocus;

  ${snoise4d}

  void main() {
    vec4 pos = vec4(position, 1.0);
    pos.x += snoise(vec4(position.xyz * fineness + vec3(1, 0, 0), time)) * diffusion;
    pos.y += snoise(vec4(position.yzx * fineness + vec3(0, 1, 0), time)) * diffusion;
    pos.z += snoise(vec4(position.zxy * fineness + vec3(0, 0, 1), time)) * diffusion;
    vHsla = vec4(hsla.x + pos.y * 0.001, hsla.yzw);

    pos = modelViewMatrix * pos;
    gl_PointSize = size * scale * hsla.w;
    if (attenuation) gl_PointSize *= screenScale / -pos.z;

    gl_Position = projectionMatrix * pos;

    if (dof) {
      float xyd = length(gl_Position.xy / gl_Position.w);
      float xyf = pow(xyd * 0.1 * (6. - dofAperture), 2.);
      float zd = clamp((nearClip - pos.z) / (farClip - nearClip), 0., 1.);
      float zf = 1. - exp(- pow(zd - dofFocus, 2.) / exp(dofAperture - 5.));
      vFocus = clamp(1. - xyf - zf, 0., 1.);
      gl_PointSize *= bokehScale - vFocus * (bokehScale - 1.);
    } else {
      vFocus = 1.;
    }
  }
`;

const fragmentShader = `
  precision highp float;

  uniform sampler2D mapSolid;
  uniform sampler2D mapBokeh;

  varying vec4 vHsla;
  varying float vFocus;

  ${hsl2rgb}

  void main() {
    vec3 rgb = hsl2rgb(vHsla.xyz);
    vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
    float t = pow(vFocus, 2.);
    vec4 m = texture2D(mapSolid, uv) * t + texture2D(mapBokeh, uv) * (1. - t);
    gl_FragColor = vec4(rgb, 1.) * m;
  }
`;
