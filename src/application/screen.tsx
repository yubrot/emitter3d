import { h, Component } from 'preact';

import { SceneState, RendererState } from './state';
import * as viewer from '../viewer';

export type Props = SceneState & RendererState;

export class Screen extends Component<Props, {}> {
  private container!: HTMLElement;
  private _scene!: viewer.Scene;
  private _camera!: viewer.Camera;
  private renderer!: viewer.Renderer;
  private cameraController!: viewer.CameraController;

  get scene(): viewer.Scene {
    return this._scene;
  }

  get camera(): viewer.Camera {
    return this._camera;
  }

  get control(): viewer.CameraController {
    return this.cameraController;
  }

  update(deltaTime: number): void {
    this.scene.update(deltaTime);
    this.camera.update(deltaTime);
    this.renderer.render();
  }

  private updateSize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.setSize(width, height);
    this.renderer.setSize(width, height);
  };

  private updateInternalProps(): void {
    this.renderer.antialiasMode = this.props.antialiasMode;
    this.renderer.focus = this.props.focusEffect;
    this.renderer.bloom = this.props.bloomEffect;
    this.renderer.bloomStrength = this.props.bloomStrength;
    this.renderer.bloomThreshold = this.props.bloomThreshold;
    this.renderer.bloomRadius = this.props.bloomRadius;

    this.scene.particleType = this.props.particleType;
    this.scene.saturation = this.props.particleSaturation;
    this.scene.lightness = this.props.particleLightness;
    this.scene.trailLength = this.props.trailLength;
    this.scene.trailStep = this.props.trailStep;
    this.scene.trailOpacity = this.props.trailOpacity;
    this.scene.trailAttenuation = this.props.trailAttenuation;
    this.scene.trailFluctuation = this.props.trailFluctuation;
    this.scene.surface.visible = this.props.showSurface;
    this.scene.space.visible = this.props.showSpace;
  }

  componentDidMount() {
    this._scene = new viewer.Scene();
    this._camera = new viewer.Camera(70, 1, 1, 2000, { x: 0, y: 30, d: 200 });
    this.renderer = new viewer.Renderer(this.scene, this.camera);
    this.cameraController = new viewer.CameraController(this.camera);

    this.container.appendChild(this.renderer.domElement);
    this.cameraController.bind(this.container);
    window.addEventListener('resize', this.updateSize);

    this.updateSize();
    this.updateInternalProps();
  }

  componentWillUnmount() {
    this.container.removeChild(this.renderer.domElement);
    this.cameraController.unbind(this.container);
    window.removeEventListener('resize', this.updateSize);
  }

  componentDidUpdate(prevProps: Props) {
    this.updateInternalProps();

    this.scene.needsUpdate =
      this.scene.needsUpdate ||
      this.props.particleType != prevProps.particleType ||
      this.props.particleSaturation != prevProps.particleSaturation ||
      this.props.particleType != prevProps.particleType ||
      this.props.trailLength != prevProps.trailLength ||
      this.props.trailStep != prevProps.trailStep ||
      this.props.trailOpacity != prevProps.trailOpacity ||
      this.props.trailAttenuation != prevProps.trailAttenuation ||
      this.props.trailFluctuation != prevProps.trailFluctuation;
  }

  render() {
    return <div className="screen" ref={d => this.container = d} />;
  }
}
