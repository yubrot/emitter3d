import * as THREE from 'three';

import { History } from './aux/history';
import { Renderer } from './renderer';
import { Surface } from './3d/surface';
import { Space } from './3d/space';
import { Points } from './3d/points';
import { Objects, Model as ObjectModel } from './3d/objects';

export type ParticleType = 'points' | 'objects';

export const particleTypes: ParticleType[] = ['points', 'objects'];

export type Particle = {
  frame: number;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  fluctuation: THREE.Vector3;
  objectModel: ObjectModel | 'meta';
  colorIndex: number;
  opacity: number;
};

function allocateParticle(): Particle {
  return {
    frame: 0,
    position: new THREE.Vector3(),
    rotation: new THREE.Quaternion(),
    fluctuation: new THREE.Vector3(),
    objectModel: 'meta',
    colorIndex: 0,
    opacity: 0,
  };
}

export class View {
  readonly history: History<Particle>;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly surface: Surface;
  readonly space: Space;
  readonly renderer: Renderer;
  readonly points: Points;
  readonly objects: Objects;

  needsUpdate = false;

  trailLength = 1;
  trailStep = 1;
  trailOpacity = 1;
  trailAttenuation = 1;
  trailFluctuation = 1;
  hue = 0.9;
  lightness = 0.7;

  get width(): number {
    return this.container.clientWidth;
  }

  get height(): number {
    return this.container.clientHeight;
  }

  set particleType(type: ParticleType) {
    this.points.visible = type == 'points';
    this.objects.visible = type == 'objects';
  }

  constructor(private container: HTMLElement) {
    this.history = new History(allocateParticle, 60);
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.001);
    this.camera = new THREE.PerspectiveCamera(70, 1, 1, 2000);
    this.renderer = new Renderer(this.scene, this.camera);
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.updateSize.bind(this));
    this.updateSize();

    this.surface = new Surface(20, 40, 40);
    this.surface.rotation.set(Math.PI/2, 0, 0);
    this.scene.add(this.surface);

    this.space = new Space(400, 5000);
    this.scene.add(this.space);

    this.points = new Points(40000);
    this.points.visible = false;
    this.scene.add(this.points);

    this.objects = new Objects(10000);
    this.objects.visible = false;
    this.scene.add(this.objects);
  }

  updateSize(): void {
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  render(): void {
    if (this.needsUpdate) {
      this.needsUpdate = false;
      if (this.points.visible) this.updatePoints();
      if (this.objects.visible) this.updateObjects();
    }

    this.renderer.render();
  }

  private updatePoints(): void {
    const updater = this.points.beginUpdate();
    this.iterateParticles((particle, position, color) => updater.put(position, color));
    updater.complete();
  }

  private updateObjects(): void {
    const updater = this.objects.beginUpdate();
    this.iterateParticles((particle, position, color) => updater.put(particle.objectModel as ObjectModel, particle.frame, position, particle.rotation, color));
    updater.complete();
  }

  private iterateParticles(handler: (particle: Particle, position: THREE.Vector3, color: THREE.Color) => void): void {
    const hls = [[5, 0.98], [20, 0.91], [70, 0.87], [110, 0.91], [150, 0.87], [230, 1], [255, 1], [335, 0.95]];
    const position = new THREE.Vector3();
    const color = new THREE.Color();
    let opacity = 1;
    let fluctuation = 1;
    for (const snapshot of this.history.snapshots(0, this.trailLength, Math.floor(this.trailStep))) {
      for (const particle of snapshot) {
        if (particle.objectModel == 'meta') continue;

        const [h, l] = hls[particle.colorIndex % hls.length];
        position.copy(particle.position).addScaledVector(particle.fluctuation, 1 - fluctuation);
        color.setHSL(
          (1 + h/360 + position.y * 0.001) % 1,
          this.hue,
          this.lightness * l * Math.min(1, 0.1 + particle.frame*0.03) * particle.opacity * opacity);
        handler(particle, position, color);
      }
      if (opacity == 1) opacity *= this.trailOpacity;
      opacity *= this.trailAttenuation;
      fluctuation *= this.trailFluctuation;
    }
  }
}
