declare namespace THREE {
  class ManualMSAARenderPass {
    constructor(scene: THREE.Scene, camera: THREE.Camera);
    sampleLevel: number;
    unbiased: boolean;
    enabled: boolean;
  }

  class SMAAPass {
    constructor(width: number, height: number);
    renderToScreen: boolean;
    enabled: boolean;
  }

  class UnrealBloomPass {
    constructor();
    strength: number;
    radius: number;
    threshold: number;
    enabled: boolean;
  }
}
