import config from './config.ts';

export default class Renderer {
  private webGL: THREE.WebGLRenderer;
  private passes: {
    render: THREE.RenderPass,
    renderMSAA: THREE.ManualMSAARenderPass,
    bloom: THREE.UnrealBloomPass,
    copy: THREE.ShaderPass,
    SMAA: THREE.SMAAPass,
  };
  private composer: THREE.EffectComposer;

  get domElement(): HTMLCanvasElement {
    return this.webGL.domElement;
  }

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.webGL = new THREE.WebGLRenderer({ antialias: false });
    this.webGL.setPixelRatio(window.devicePixelRatio);
    this.webGL.sortObjects = false;

    this.passes = {
      render: new THREE.RenderPass(scene, camera),
      renderMSAA: new THREE.ManualMSAARenderPass(scene, camera),
      bloom: new THREE.UnrealBloomPass(),
      copy: new THREE.ShaderPass(THREE.CopyShader),
      SMAA: new THREE.SMAAPass(2, 2),
    };
    this.passes.copy.renderToScreen = true;
    this.passes.SMAA.renderToScreen = true;

    this.composer = new THREE.EffectComposer(this.webGL);
    this.composer.addPass(this.passes.render);
    this.composer.addPass(this.passes.renderMSAA);
    this.composer.addPass(this.passes.bloom);
    this.composer.addPass(this.passes.copy);
    this.composer.addPass(this.passes.SMAA);

    config.options('antialias', 'SMAA', ['OFF', 'SMAA', 'MSAA x2', 'MSAA x4'], type => {
      this.passes.renderMSAA.enabled = type.slice(0, 4) == 'MSAA';
      this.passes.renderMSAA.sampleLevel = (type == 'MSAA x2') ? 1 : (type == 'MSAA x4') ? 2 : 0;
      this.passes.SMAA.enabled = type == 'SMAA';

      this.passes.render.enabled = !this.passes.renderMSAA.enabled;
      this.passes.copy.enabled = !this.passes.SMAA.enabled;
    });

    config.toggle('bloom', true, enabled => this.passes.bloom.enabled = enabled);
    config.range('bloom strength', 0.7, [0, 5], v => this.passes.bloom.strength = v);
    config.range('bloom radius', 0.2, [0, 1], v => this.passes.bloom.radius = v);
    config.range('bloom threshold', 0.5, [0, 1], v => this.passes.bloom.threshold = v);
  }

  setSize(width: number, height: number) {
    this.webGL.setSize(width, height);
    const ratio = this.webGL.getPixelRatio();
    this.composer.setSize(Math.floor(width * ratio), Math.floor(height * ratio));
  }

  render() {
    this.composer.render();
  }
}
