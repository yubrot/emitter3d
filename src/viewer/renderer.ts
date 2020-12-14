import * as THREE from 'three';

export class Renderer {
  private webGL: THREE.WebGLRenderer;
  private passes: {
    render: THREE.RenderPass;
    bloom: THREE.UnrealBloomPass;
    copy: THREE.ShaderPass;
    SMAA: THREE.SMAAPass;
  };
  private composer: THREE.EffectComposer;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.webGL = new THREE.WebGLRenderer({ antialias: false });
    this.webGL.setPixelRatio(window.devicePixelRatio);
    this.passes = {
      render: new THREE.RenderPass(scene, camera),
      bloom: new THREE.UnrealBloomPass(),
      copy: new THREE.ShaderPass(THREE.CopyShader),
      SMAA: new THREE.SMAAPass(2, 2),
    };
    this.passes.copy.renderToScreen = true;
    this.passes.SMAA.renderToScreen = true;

    this.composer = new THREE.EffectComposer(this.webGL);
    this.composer.addPass(this.passes.render);
    this.composer.addPass(this.passes.bloom);
    this.composer.addPass(this.passes.copy);
    this.composer.addPass(this.passes.SMAA);

    this.antialias = false;
    this.bloom = false;
  }

  get domElement(): HTMLCanvasElement {
    return this.webGL.domElement;
  }

  set antialias(enabled: boolean) {
    this.passes.SMAA.enabled = enabled;
    this.passes.copy.enabled = !enabled;
  }

  set bloom(enabled: boolean) {
    this.passes.bloom.enabled = enabled;
  }

  set bloomStrength(value: number) {
    this.passes.bloom.strength = value;
  }

  set bloomRadius(value: number) {
    this.passes.bloom.radius = value;
  }

  set bloomThreshold(value: number) {
    this.passes.bloom.threshold = value;
  }

  setSize(width: number, height: number): void {
    this.webGL.setSize(width, height);
    this.composer.setSize(width, height);
  }

  render(): void {
    this.composer.render();
  }
}
