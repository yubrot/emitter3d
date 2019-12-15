import './three-plugins/install';
import { Particle, ParticleMode, particleModes, Scene } from './scene';
export { Particle, ParticleMode, particleModes, Scene };
import { Renderer, AntialiasMode, antialiasModes } from './renderer';
export { Renderer, AntialiasMode, antialiasModes };
import { CameraPosition, Camera, CameraController } from './camera';
export { CameraPosition, Camera, CameraController };

export class Viewer {
  readonly scene = new Scene();
  readonly camera = new Camera(70, 1, 1, 5000, { x: 0, y: 40, d: 150 });
  readonly renderer = new Renderer(this.scene, this.camera);

  setTrackpoint(container: HTMLElement): () => void {
    const controller = new CameraController(this.camera);
    controller.bind(container);
    return () => controller.unbind(container);
  }

  setSize(width: number, height: number): void {
    this.camera.setSize(width, height);
    this.renderer.setSize(width, height);
  }

  update(deltaTime: number): void {
    this.scene.update(deltaTime);
    this.camera.update(deltaTime);
    this.renderer.render();
  }
}
