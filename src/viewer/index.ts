import './three-plugins/install';
import { Dot, Scene } from './scene';
import { Renderer } from './renderer';
import { CameraPosition, Camera, CameraController } from './camera';
export { Dot, Scene, Renderer, CameraPosition, Camera, CameraController };

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
    this.scene.setSize(width, height);
    this.camera.setSize(width, height);
    this.renderer.setSize(width, height);
  }

  update(): void {
    this.scene.update();
    this.camera.update();
    this.renderer.render();
  }
}
