import * as viewer from './viewer';
import * as simulator from './simulator';

export function copyParticle(source: simulator.Particle, dest: viewer.Particle): void {
  dest.lifeTime = source.lifeTime;
  dest.position.set(source.position[0], source.position[1], source.position[2]);
  dest.rotation.set(source.rotation[0], source.rotation[1], source.rotation[2], source.rotation[3]);
  dest.fluctuation.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
  dest.opacity = source.opacity;
  dest.hue = source.hue;
  dest.objectModel = source.model || 'meta';
}
