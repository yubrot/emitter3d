import { CommonBullet, CommonBulletModelType, Behavior } from './Bullet.ts';
import { selectPattern, range, select } from './pattern.ts';
import * as rudder from './behavior/rudder.ts';
import * as engine from './behavior/engine.ts';
import * as trigger from './behavior/trigger.ts';

export default function formulate(gen: number, power: number): Behavior {
  return formulateTrigger({ gen, power, wait: 0, depth: 0 }).trigger;
}

interface State {
  gen: number;
  power: number;
  wait: number;
  depth: number;
}

type Kind = 'normal' | 'slow' | 'final';

function formulateTrigger(state: State): { trigger: Behavior, kind: Kind } {
  if (state.power < 2) return { trigger: trigger.none, kind: 'final' };

  const { gen, power, wait, depth } = state;

  let num = Math.min(
    THREE.Math.randInt(2, 16) * Math.max(1, 3 - depth),
    Math.floor(power));

  const pattern = selectPattern(num, depth);

  function formulateChild(gen: number, wait: number, d = 0): { trigger: Behavior, kind: Kind } {
    return formulateTrigger({ gen, power: power / num, wait, depth: depth + d });
  }

  function rudders(pat: string, yaw: (str: number) => Behavior, pitch: (str: number) => Behavior): Behavior[] {
    switch (pat) {
    case 'straight': return [rudder.none];
    case 'lspin': return [yaw(-Math.PI * 0.02)];
    case 'rspin': return [yaw(Math.PI * 0.02)];
    case 'llspin': return [yaw(-Math.PI * 0.04)];
    case 'rrspin': return [yaw(Math.PI * 0.04)];
    case 'lrspin': return [yaw(-Math.PI * 0.02), yaw(Math.PI * 0.02)];
    case 'udspin': return [pitch(-Math.PI * 0.01), pitch(Math.PI * 0.01)];
    case 'inner': return [yaw(Math.PI * 0.015), yaw(-Math.PI * 0.015)];
    case 'outer': return [yaw(-Math.PI * 0.015), yaw(Math.PI * 0.015)];
    }
    throw 'Unknown rudder: ' + pat;
  }

  function engineFor(kind: Kind, spin = false): Behavior {
    const factor = (kind == 'final') ? 1 : (kind == 'slow') ? 0.3 : 0.6;
    return select<Behavior>([
      { weight: 1.5, value: engine.uniform(THREE.Math.randFloat(1.5, 2.2) * factor) },
      { weight: (kind == 'final' ? 1 : 0), value: engine.accel(0.5, 3.3) },
      { weight: 0.5, value: engine.decel(THREE.Math.randFloat(2.5, 3.2) * factor, 0.8) },
      { weight: (kind == 'normal' ? 0.5 : 0), value: engine.quick(THREE.Math.randFloat(3.2, 4.4), 1.7) },
    ]);
  }

  switch (pattern[0]) {
    case 'xy': case 'xz': {
      const inv = pattern[0] == 'xz';
      const gens = range(pattern[3] || '1').map(i => gen + i + 1);
      const ps = gens.map((i, w) => formulateChild(i, w * 30, pattern[1] == '360' ? 1 : 0));
      const ts = ps.map(p => p.trigger);
      const es = ps.map(p => engineFor(p.kind, pattern[2] != 'straight'));
      const rs = rudders(pattern[2], inv ? rudder.pitch : rudder.yaw, inv ? rudder.yaw : rudder.pitch);
      const bullets = [selectBullet(0.7, (pattern[2] != 'straight') ? 0 : 1.5, 0.4)];
      const creator = trigger.creator(bullets, gens, es, rs, ts);
      const frame = THREE.Math.randInt(3, 7) * 10 + wait;
      const angle = pattern[1] == '360' ? Math.PI*2 : Math.PI/24*num;
      return {
        trigger: (inv ? trigger.xz : trigger.xy)(creator, frame, num, pattern[1] == 'back' ? Math.PI : 0, angle),
        kind: gens.length == 3 ? 'slow' : 'normal'
      };
    }
    case 'yz': {
      const base = Number(pattern[1]) / 180 * Math.PI;
      const gens = range(pattern[3] || '1').map(i => gen + i + 1);
      const ps = gens.map((i, w) => formulateChild(i, w * 15, pattern[1] == '90' ? 1 : 0));
      const ts = ps.map(p => p.trigger);
      const es = ps.map(p => engineFor(p.kind, pattern[2] != 'straight'));
      const rs = rudders(pattern[2], rudder.yaw, rudder.pitch);
      const bullets = [selectBullet(0.7, (pattern[2] != 'straight') ? 0 : 1.5, 0.4)];
      const creator = trigger.creator(bullets, gens, es, rs, ts);
      const frame = THREE.Math.randInt(3, 7) * 10 + wait;
      return {
        trigger: trigger.yz(creator, frame, num, base),
        kind: gens.length == 3 ? 'slow' : 'normal'
      };
    }
    case 'yzs': {
      const num1 = Number(pattern[1]);
      const direction = pattern[2] == 'l' ? 1 : -1;
      const gens = range(pattern[3] || '1').map(i => gen + i + 1);
      const ps = gens.map(i => formulateChild(i, 0, 0));
      const ts = ps.map(p => p.trigger);
      const es = ps.map(p => engineFor(p.kind));
      const bullets = [selectBullet(0.7, 0, 0.4)];
      const creator = trigger.creator(bullets, gens, es, [rudder.none], ts);
      const startFrame = THREE.Math.randInt(2, 5) * 10 + wait;
      return {
        trigger: trigger.yzs(creator, startFrame, num, 5 + depth*5, num1, direction),
        kind: gens.length == 3 ? 'slow' : 'normal'
      };
    }
    case 'rapid': {
      if (pattern[1] == 'straight' && num >= 3) num = 2 + (num % 2);
      const gens = range(pattern[3] || '1').map(i => gen + i + 1);
      const ps = gens.map(i => formulateChild(i, 0, 0));
      const ts = ps.map(p => p.trigger);
      const es = ps.map(p => engineFor(p.kind, pattern[1] != 'straight'));
      const bullets = [selectBullet(1, pattern[1] != 'straight' ? 0 : 1, 0)];
      const creator = trigger.creator(bullets, gens, es, [rudder.none], ts);
      const startFrame = THREE.Math.randInt(2, 8) * 10 + wait;
      return {
        trigger:
          (pattern[1] == 'straight')
            ? trigger.rapid(creator, startFrame, THREE.Math.randInt(30, 60), num, pattern[2])
            : trigger.splash(creator, startFrame, 4, num, pattern[2]),
        kind: 'slow',
      };
    }
  }
  throw 'Unhandled pattern: ' + pattern.join(' ');
}

function selectBullet(missile: number, arrow: number, claw: number): () => CommonBullet {
  const type = select<CommonBulletModelType>([
    { weight: missile, value: 'missile' },
    { weight: arrow, value: 'arrow' },
    { weight: claw, value: 'claw' },
  ]);
  return () => new CommonBullet(type);
}
