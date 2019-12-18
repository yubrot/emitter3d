import * as THREE from 'three';

declare module 'three' {
  class Pass {
    renderToScreen: boolean;
    enabled: boolean;
  }

  class ShaderPass extends Pass {
    constructor(shader: Shader);
  }

  class RenderPass extends Pass {
    constructor(scene: THREE.Scene, camera: THREE.Camera);
  }

  class SMAAPass extends Pass {
    constructor(width: number, height: number);
  }

  class UnrealBloomPass extends Pass {
    constructor();
    strength: number;
    radius: number;
    threshold: number;
  }

  const CopyShader: Shader;

  class EffectComposer {
    constructor(renderer: THREE.WebGLRenderer);
    addPass(pass: Pass): void;
    setSize(width: number, height: number): void;
    render(): void;
  }
}
