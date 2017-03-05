import Renderer from './Renderer.ts';
import CameraController from './CameraController.ts';

import OuterSpace from './objects/OuterSpace.ts';
import Field from './objects/Field.ts';

export default class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: Renderer;
  private cameraController: CameraController;

  private outerSpace: OuterSpace;
  private field: Field;

  get width(): number { return this.container.clientWidth; }
  get height(): number { return this.container.clientHeight; }

  constructor(private container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.001);
    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 1, 2000);
    this.renderer = new Renderer(this.scene, this.camera);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
    this.cameraController = new CameraController(this.container, 250);

    this.outerSpace = new OuterSpace(300, 5000);
    this.scene.add(this.outerSpace);

    this.field = new Field(this.camera.position, this.outerSpace.boundary);
    this.scene.add(this.field);
  }

  updateSize() {
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  update() {
    this.cameraController.update(this.camera);
    this.field.update();
  }

  render() {
    this.renderer.render();
  }
}
