import { h, Component } from 'preact';

import { SceneState, RendererState } from './state';
import * as viewer from '../viewer';

export type Props = SceneState & RendererState;

export class Screen extends Component<Props, {}> {
  private container!: HTMLDivElement;
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

    this.scene.particleMode = this.props.particleMode;
    this.scene.particleSaturation = this.props.particleSaturation;
    this.scene.particleLightness = this.props.particleLightness;
    this.scene.points.mat.size = this.props.particlePointSize;
    this.scene.points.mat.coreWidth = this.props.particlePointCoreWidth;
    this.scene.points.mat.coreSharpness = this.props.particlePointCoreSharpness;
    this.scene.points.mat.shellLightness = this.props.particlePointShellLightness;
    this.scene.points.mat.needsUpdate = this.scene.points.mat.sizeAttenuation != this.props.particlePointSizeAttenuation;
    this.scene.points.mat.sizeAttenuation = this.props.particlePointSizeAttenuation;
    this.scene.trailLength = this.props.trailLength;
    this.scene.trailStep = this.props.trailStep;
    this.scene.trailFluctuationScale = this.props.trailFluctuationScale;
    this.scene.trailFluctuationBias = this.props.trailFluctuationBias;
    this.scene.trailAttenuationBias = this.props.trailAttenuationBias;
    this.scene.space.visible = this.props.showSpace;
  }

  componentDidMount() {
    this._scene = new viewer.Scene();
    this._camera = new viewer.Camera(70, 1, 1, 5000, { x: 0, y: 40, d: 150 });
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
      this.props.particleMode != prevProps.particleMode ||
      this.props.particleSaturation != prevProps.particleSaturation ||
      this.props.particleLightness != prevProps.particleLightness ||
      this.props.particlePointSize != prevProps.particlePointSize ||
      this.props.particlePointCoreWidth != prevProps.particlePointCoreWidth ||
      this.props.particlePointCoreSharpness != prevProps.particlePointCoreSharpness ||
      this.props.particlePointShellLightness != prevProps.particlePointShellLightness ||
      this.props.particlePointSizeAttenuation != prevProps.particlePointSizeAttenuation ||
      this.props.trailLength != prevProps.trailLength ||
      this.props.trailStep != prevProps.trailStep ||
      this.props.trailFluctuationScale != prevProps.trailFluctuationScale ||
      this.props.trailFluctuationBias != prevProps.trailFluctuationBias ||
      this.props.trailAttenuationBias != prevProps.trailAttenuationBias;
  }

  render() {
    return <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
      }}
      ref={d => this.container = d!}
    />;
  }
}
