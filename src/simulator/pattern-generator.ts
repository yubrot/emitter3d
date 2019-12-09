import * as dsl from './dsl';
import { Code } from './dsl-builder';

type Spec = {
  generation: number[];
  strength: number;
  directivity: number;
  fineness: number;
};

type Flag = {
  accelerate: boolean;
  rotate: boolean;
};

export function generate(strength: number): dsl.AST[] {
  return new Code()
    .put('hue', Code.randomAngle)
    .putCode(pattern({ generation: [], strength, directivity: 1, fineness: 1 }))
    .toProgram();
}

function pattern(spec: Spec): Code {
  const code = new Code();
  const flag = { accelerate: false, rotate: false };

  if (spec.strength < 2) {
    code.putCode(move1(spec, flag));

  } else {
    const iterations = (spec.strength < 64) ? 1 : randr(1, 1, 1, 1, 1, 1, 1, 1, 2);

    for (let i = 0; i < iterations; ++i) {
      const strength = spec.strength / iterations;

      if (strength < 8 || randf() < 0.7 || spec.generation.length == 0) {
        const parallel = (randf() < 0.1 || strength < 8) ? 1 : randr(2, 3, 4, 5, 6, 8);
        const { code: layoutCode, r } = layout1(spec);
        const p = strength / parallel < 2 ? 1 : randi(2, Math.max(2, Math.min(strength / parallel, r / 10 / parallel)), 1, 1 / (1 + spec.fineness));
        const [count, times] = (6 <= p && randf() < 0.8) ? [1, p] : [p, 1];
        const duration = times == 1 ? 0 : randi(p * 2, p * 10);
        const childPatternCount = (16 <= parallel * p && (parallel * p) % 2 == 0 && randf() < 0.5) ? 2 : 1;
        const childHues = array(childPatternCount, j => 60 + i * 40 + j * 40);
        const childCodes = array(childPatternCount, j => pattern({
          strength: strength / (parallel * p),
          generation: [i + j, ...spec.generation],
          directivity: r >= 360 ? 0 : spec.directivity + 1,
          fineness: Math.max(0, spec.fineness + (strength * 0.2 < p * parallel && childPatternCount == 1 ? -1 : 2)),
        }));
        const child = new Code()
          .putCode(layoutCode)
          .put('hue+', Code.eachChoice(...childHues))
          .putEachChoice(...childCodes)
          .toAST();

        if (spec.generation.length != 0) code.putCode(move2(times > 1, flag));
        code
          .begin()
          .put(duration, 'emit', count, times, parallel, child)
          .end();

      } else {
        flag.rotate = true;
        const duration = randi(60, 80);
        const { code: rotationCode, r: r1 } = rotation(duration, 1, 1, 3, 40);
        const { code: layoutCode, speed, r: r2 } = layout2(spec, strength >= 24);
        const r = r1 + r2;
        const p = randi(
          Math.max(4, Math.min(strength, r / 45)),
          Math.max(4, Math.min(strength, duration / 2, r / 10)), 1, 1 / (1 + spec.fineness));
        const childHue = 60 + i * 40;
        const childCode = pattern({
          strength: strength / p,
          generation: [i, ...spec.generation],
          directivity: spec.directivity + 1,
          fineness: Math.max(0, spec.fineness + (strength * 0.2 < p ? -1 : 2)),
        });
        const child = new Code()
          .putCode(layoutCode)
          .put('hue+', childHue)
          .putCode(childCode)
          .toAST();

        if (spec.generation.length != 0) code.putCode(move3(speed, flag));
        code
          .begin()
          .put(duration, 'emit', 1, p, 1, child)
          .join().putCode(rotationCode)
          .end();
      }
    }
  }

  const model =
    flag.accelerate && flag.rotate ? 'missile' :
      flag.accelerate ? randf() < 0.7 ? 'arrow' : 'missile' :
        flag.rotate ? randf() < 0.7 ? 'claw' : 'missile' :
          randf() < 0.7 ? 'arrow' : 'missile';

  return new Code().put('model', model).putCode(code);
}

function move1(spec: Spec, flag: Flag): Code {
  const code = new Code();
  const p = randf();
  let live = 120;

  if (p < 0.3) {
    flag.accelerate = true;
    const defer = randi(20, 40);
    const duration = randi(40, 60);
    code
      .put('speed', 0.3)
      .put(defer, 'nop')
      .tap(code => {
        if (randf() < 0.3) {
          const [a, b] = randf() < 0.5 ? [randi(30, 60), 0] : [0, randi(30, 60)];
          code.put(Code.eachRange(a, b), 'nop');
        }
      })
      .begin()
      .put(duration, 'ease-in', 'speed*', randf(4, 5))
      .tap(code => {
        if (randf() < 0.3) {
          flag.rotate = true;
          code.join().putCode(rotation(duration, 6, 6, 6).code);
        }
        if (randf() < 0.3) {
          code.join().put(duration, 'hue+', randr(3, -3) * duration);
        }
      })
      .end();
    live -= duration + defer;

  } else if (p < 0.6) {
    flag.accelerate = true;
    const duration = randi(60, 80);
    code
      .put('speed', randf(2, 2.5))
      .begin()
      .put(duration, 'ease-in', 'speed*', randf(0.2, 0.25))
      .tap(code => {
        if (randf() < 0.3) {
          flag.rotate = true;
          code.join().putCode(rotation(duration, 6, 6, 6).code);
        }
        if (randf() < 0.3) {
          code.join().put(duration / 2, 'nop').put(duration / 2, 'hue+', randr(2, -2) * duration);
        }
      })
      .end();
    live -= duration;

  } else {
    code.put('speed', randf(0.8, 1.1));
    if (randf() < 0.3) {
      flag.rotate = true;
      code.putCode(rotation(70, 6, 6, 6).code);
      live -= 70;
    }
  }

  return code
    .put(live, 'close')
    .put(120, 'nop')
    .put(30, 'opacity', 0);
}

function move2(forceStop: boolean, flag: Flag): Code {
  const code = new Code();

  if (forceStop || randf() < 0.2) {
    flag.accelerate = true;
    if (randf() < 0.5) {
      code.put('speed', randf(3, 3.5)).put(randi(30, 40), 'ease-out', 'speed', 0);
    } else {
      code.put('speed', randf(2.5, 3)).put(randi(10, 20), 'nop').put('speed', 0);
    }

  } else {
    code.put('speed', randf(0.9, 1.2)).put(randi(30, 60), 'nop');
  }

  if (randf() < 0.5) {
    flag.rotate = true;
    code.join().putCode(rotation(randi(30, 60), 4, 4, 4).code);
  }

  return code;
}

function move3(finalSpeed: number, flag: Flag): Code {
  const duration = randi(70, 90);
  return new Code()
    .put('speed', randf(2, 2.4))
    .begin()
    .put(duration, 'ease-out', 'speed', finalSpeed)
    .tap(code => {
      if (randf() < 0.3) {
        flag.rotate = true;
        code.join().putCode(rotation(duration, 4, 4, 4).code);
      }
    })
    .end();
}

function rotation(duration: number, x: number, y: number, z: number, min = 1): { code: Code, r: number } {
  let xdeg, ydeg, zdeg;
  do {
    xdeg = (randf() < 0.3) ? 0 : randi(0, 200, 1, x);
    ydeg = (randf() < 0.3) ? 0 : randi(0, 200, 1, y);
    zdeg = (randf() < 0.3) ? 0 : randi(0, 200, 1, z);
  } while (Math.max(xdeg, ydeg) < min);

  return {
    code: new Code().put(duration, randr('ease-in', 'ease-out'), 'rotate', xdeg, ydeg, zdeg),
    r: Math.max(xdeg, ydeg),
  };
}

function layout1(spec: Spec): { code: Code, r: number } {
  const around = randf(0, 1, 1, 3 ** spec.directivity) < 0.3 || spec.generation.length == 0;

  const layoutCandidates =
    spec.generation.length == 0 ? ['horizontal'] :
      (spec.directivity > 1 || around) ? ['horizontal', 'split'] :
        ['horizontal', 'vertical', 'split'];

  const layoutType = randr(layoutCandidates);
  const sign = randf() < 0.5 ? 1 : -1;
  const code = new Code();
  let r = 0;

  switch (randr(...layoutCandidates)) {
    case 'horizontal':
      if (around) {
        code.put('rotate', 0, Code.eachAngle, 0);
        r += 360;
      } else {
        const r1 = randi(15, 75);
        code.put('rotate', 0, Code.eachRange(-r1 * sign, r1 * sign), 0);
        r += r1 * 2;
      }
      break;
    case 'vertical':
      {
        const r1 = randi(10, 40);
        code.put('rotate', Code.eachRange(-r1 * sign, r1 * sign), 0, 0);
        r += r1 * 2;
      }
      break;
    case 'split':
      {
        code.put('rotate', 0, 0, Code.eachAngle);
        code.put('rotate', around ? 120 : randi(40, 70), 0, 0);
        r += 360;
      }
      break;
  }

  if (!around && randf() < 0.2) code.put('rotate', 0, 180, 0);

  return { code, r };
}

function layout2(spec: Spec, many: boolean): { code: Code, speed: number, r: number } {
  const code = new Code();
  let speed = 0;
  let r = 0;
  const pat = many ? randr(0, 0, 1, 1, 2, 2, 3) : randr(0, 1, 2);
  switch (pat) {
    case 0:
      code.put('rotate', 0, 180, 0);
      speed = 0.6;
      break;
    case 1:
      code.put('rotate', 0, 90, Code.eachAngle);
      speed = 0.4;
      r = 360;
      break;
    case 2:
      speed = 0.2;
      break;
    case 3:
      code.put(
        'rotate',
        Code.randomRange(-Code.eachRange(10, 40), Code.eachRange(10, 40)),
        Code.randomRange(-Code.eachRange(10, 40), Code.eachRange(10, 40)),
        Code.randomAngle);
      r = 360;
      break;
  }
  return { code, speed, r };
}

function randf(l = 0, r = 1, iterations = 1, bias = 1): number {
  let t = 0;
  for (let i = 0; i < iterations; ++i) t += Math.random() ** bias;
  t /= iterations;
  return Math.floor((l + (r - l) * t) * 100) / 100;
}

function randi(l: number, r: number, iterations = 1, bias = 1): number {
  return Math.floor(randf(l, r, iterations, bias));
}

function randr<T>(...items: T[]): T {
  return items[randi(0, items.length)];
}

function array<T>(length: number, init: (index: number) => T): T[] {
  const result = new Array<T>(length);
  for (let i = 0; i < length; ++i) result[i] = init(i);
  return result;
}
