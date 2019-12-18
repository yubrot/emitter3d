import * as math from 'gl-matrix';
import { Easing } from './aux/easing';
import { Particle, Behavior, Field } from './particle';
import * as behavior from './particle-behavior';

class Simulator {
  readonly field: Field;
  readonly particle: Particle;

  constructor(b: Behavior) {
    this.field = new Field();
    this.particle = new Particle(b);
    this.field.add(this.particle);
  }

  easing(f: Easing): this {
    this.particle.behavior.easing = f;
    return this;
  }

  lifespan(n: number): this {
    this.particle.behavior.lifespan = n;
    return this;
  }

  update(deltaTime: number, count = 1): this {
    for (let i = 0; i < count; ++i) this.field.update(deltaTime);
    return this;
  }

  tap(f: (simulate: Simulator) => void): this {
    f(this);
    return this;
  }
}

test('core', () => {
  new Simulator(new behavior.NopBehavior())
    .tap(s => expect(s.field).toContain(s.particle))
    .update(0.01)
    .tap(s => expect(s.field).not.toContain(s.particle));

  new Simulator(new behavior.NopBehavior())
    .lifespan(10)
    .update(9)
    .tap(s => expect(s.field).toContain(s.particle))
    .update(1)
    .tap(s => expect(s.field).not.toContain(s.particle));

  new Simulator(new behavior.NopBehavior())
    .lifespan(10)
    .tap(s => s.particle.speed = 1)
    .update(2)
    .tap(s => expect(Array.from(s.particle.position)).toEqual([0, 0, 2]))
    .update(5)
    .tap(s => expect(Array.from(s.particle.position)).toEqual([0, 0, 7]));

  {
    const field = new Field();
    expect([...field].length).toEqual(0);
    const particle = new Particle(new behavior.NopBehavior());
    field.add(particle);
    expect([...field].length).toEqual(1);
    field.update(1);
    expect([...field].length).toEqual(0);
  }
});

test('set', () => {
  new Simulator(new behavior.SetBehavior(5, p => p.speed, (p, v) => p.speed = v))
    .lifespan(10)
    .update(5)
    .tap(s => expect(s.particle.speed).toBeCloseTo(2.5))
    .update(5)
    .tap(s => expect(s.particle.speed).toEqual(5));

  new Simulator(new behavior.SetBehavior(1, p => p.speed, (p, v) => p.speed = v))
    .lifespan(1)
    .easing(Easing.easeIn)
    .update(0.4)
    .tap(s => expect(s.particle.speed).toBeCloseTo(Easing.easeIn.at(0.4)))
    .update(0.2)
    .tap(s => expect(s.particle.speed).toBeCloseTo(Easing.easeIn.at(0.6)))
    .update(0.4)
    .tap(s => expect(s.particle.speed).toEqual(1));

  new Simulator(new behavior.SetBehavior(5, p => p.speed, (p, v) => p.speed = v))
    .lifespan(4)
    .tap(s => s.particle.speed = 4)
    .update(3)
    .tap(s => expect(s.particle.speed).toBeCloseTo(4.75))
    .update(1)
    .tap(s => expect(s.particle.speed).toEqual(5));

  new Simulator(new behavior.SwitchBehavior(p => p.closed = true))
    .update(1)
    .tap(s => expect(s.particle.closed).toEqual(true));

  new Simulator(new behavior.SwitchBehavior(p => p.closed = true))
    .lifespan(4)
    .update(1)
    .tap(s => expect(s.particle.closed).toEqual(false))
    .update(5)
    .tap(s => expect(s.particle.closed).toEqual(true));
});

test('add', () => {
  new Simulator(new behavior.AddBehavior(5, (p, v) => p.speed += v))
    .lifespan(5)
    .tap(s => s.particle.speed = 3)
    .update(3)
    .tap(s => expect(s.particle.speed).toBeCloseTo(6))
    .update(2)
    .tap(s => expect(s.particle.speed).toEqual(8));

  new Simulator(new behavior.AddBehavior(1, (p, v) => p.speed += v))
    .lifespan(2)
    .easing(Easing.easeIn)
    .tap(s => s.particle.speed = 3)
    .update(0.8)
    .tap(s => expect(s.particle.speed).toBeCloseTo(3 + Easing.easeIn.at(0.4)))
    .update(0.4)
    .tap(s => expect(s.particle.speed).toBeCloseTo(3 + Easing.easeIn.at(0.6)))
    .update(0.8)
    .tap(s => expect(s.particle.speed).toEqual(4));
});

test('multiply', () => {
  new Simulator(new behavior.MultiplyBehavior(3, (p, s) => p.speed *= s))
    .tap(s => s.particle.speed = 5)
    .update(1)
    .tap(s => expect(s.particle.speed).toBeCloseTo(15));

  new Simulator(new behavior.MultiplyBehavior(4, (p, s) => p.speed *= s))
    .lifespan(10)
    .tap(s => s.particle.speed = 3)
    .update(5)
    .tap(s => expect(s.particle.speed).toBeCloseTo(6))
    .update(5)
    .tap(s => expect(s.particle.speed).toBeCloseTo(12));

  new Simulator(new behavior.MultiplyBehavior(2, (p, s) => p.speed *= s))
    .lifespan(5)
    .easing(Easing.easeOut)
    .tap(s => s.particle.speed = 1)
    .update(2)
    .tap(s => expect(s.particle.speed).toBeCloseTo(2 ** Easing.easeOut.at(0.4)))
    .update(1)
    .tap(s => expect(s.particle.speed).toBeCloseTo(2 ** Easing.easeOut.at(0.6)))
    .update(2)
    .tap(s => expect(s.particle.speed).toBeCloseTo(2));
});

test('translate', () => {
  new Simulator(new behavior.TranslateBehavior(2, 3, 4))
    .lifespan(5)
    .tap(s => s.particle.speed = 1)
    .update(1, 5)
    .tap(s => expect(Array.from(s.particle.position).map(Math.round)).toEqual([2, 3, 9]));
});

test('rotate', () => {
  new Simulator(new behavior.RotateBehavior(90, 0, 0))
    .tap(s => s.particle.speed = 1)
    .update(3)
    .tap(s => expect(Array.from(s.particle.position).map(Math.round)).toEqual([0, -3, 0]));

  new Simulator(new behavior.RotateBehavior(0, 90, 0))
    .tap(s => s.particle.speed = 1)
    .update(3)
    .tap(s => expect(Array.from(s.particle.position).map(Math.round)).toEqual([3, 0, 0]));

  new Simulator(new behavior.RotateBehavior(0, 0, 90))
    .tap(s => s.particle.speed = 1)
    .update(3)
    .tap(s => expect(Array.from(s.particle.position).map(Math.round)).toEqual([0, 0, 3]));
});

test('emit', () => {
  function testEmit(
    count: number,
    times: number,
    parallel: number,
    f: (simulator: Simulator, created: number[]) => void
  ): void {
    const created: number[] = [];
    const gen = (index: number) => {
      created.push(index);
      return new behavior.NopBehavior();
    };
    const simulator = new Simulator(new behavior.EmitBehavior(count, times, parallel, gen));
    f(simulator, created);
  }

  testEmit(1, 1, 1, (s, created) => {
    expect(created).toEqual([]);
    s.update(1);
    expect(created).toEqual([0]);
    expect(s.field).not.toContain(s.particle);
  });

  testEmit(3, 1, 1, (s, created) => {
    s.lifespan(5).update(2);
    expect(created).toEqual([]);
    s.update(3);
    expect(created.sort()).toEqual([0, 1, 2]);
  });

  testEmit(1, 3, 1, (s, created) => {
    s.lifespan(3).update(1);
    expect(created).toEqual([0]);
    s.update(3);
    expect(created.sort()).toEqual([0, 1, 2]);
  });

  testEmit(1, 1, 3, (s, created) => {
    s.lifespan(5).update(2);
    expect(created).toEqual([]);
    s.update(3);
    expect(created.sort()).toEqual([0, 1, 2]);
  });

  testEmit(4, 3, 1, (s, created) => {
    const w1 = [0, 1, 2, 3];
    const w2 = [4, 5, 6, 7];
    const w3 = [8, 9, 10, 11];
    s.lifespan(2).update(1);
    expect(created.sort()).toEqual(w1.sort());
    s.update(0.9);
    expect(created.sort()).toEqual(w1.concat(w2).sort());
    s.update(0.2);
    expect(created.sort()).toEqual(w1.concat(w2, w3).sort());
  });

  testEmit(1, 3, 4, (s, created) => {
    const w1 = [0, 3, 6, 9];
    const w2 = [1, 4, 7, 10];
    const w3 = [2, 5, 8, 11];
    s.lifespan(2).update(1);
    expect(created.sort()).toEqual(w1.sort());
    s.update(0.9);
    expect(created.sort()).toEqual(w1.concat(w2).sort());
    s.update(0.2);
    expect(created.sort()).toEqual(w1.concat(w2, w3).sort());
  });

  testEmit(2, 3, 5, (s, created) => {
    const w1 = [0, 1, 6, 7, 12, 13, 18, 19, 24, 25];
    const w2 = [2, 3, 8, 9, 14, 15, 20, 21, 26, 27];
    const w3 = [4, 5, 10, 11, 16, 17, 22, 23, 28, 29];
    s.lifespan(2).update(1);
    expect(created.sort()).toEqual(w1.sort());
    s.update(0.9);
    expect(created.sort()).toEqual(w1.concat(w2).sort());
    s.update(0.2);
    expect(created.sort()).toEqual(w1.concat(w2, w3).sort());
  });
});

function addSpeedBehavior(speed: number, lifespan: number): behavior.AddBehavior {
  const b = new behavior.AddBehavior(speed, (p, v) => p.speed += v);
  b.lifespan = lifespan;
  return b;
}

test('continuous', () => {
  new Simulator(new behavior.LoopBehavior(addSpeedBehavior(1, 0)))
    .update(1)
    .tap(s => expect(s.field).toContain(s.particle));

  new Simulator(new behavior.LoopBehavior(addSpeedBehavior(1, 1)))
    .update(1)
    .tap(s => expect(s.particle.speed).toBeCloseTo(1))
    .update(3)
    .tap(s => expect(s.particle.speed).toBeCloseTo(4))
    .update(1, 3)
    .tap(s => expect(s.particle.speed).toBeCloseTo(7))
    .update(0.5, 3)
    .tap(s => expect(s.particle.speed).toBeCloseTo(8.5))
    .update(1)
    .tap(s => expect(s.particle.speed).toBeCloseTo(9.5));

  for (const [delta, count] of [[1, 40], [4, 10], [5, 8], [6, 7]]) {
    new Simulator(new behavior.LoopBehavior(addSpeedBehavior(10, 10)))
      .lifespan(35)
      .update(delta, count)
      .tap(s => {
        expect(s.particle.speed).toBeCloseTo(35);
        expect(s.field).not.toContain(s.particle);
      });
  }

  new Simulator(new behavior.RepeatBehavior(addSpeedBehavior(1, 2), 3))
    .update(10)
    .tap(s => {
      expect(s.particle.speed).toBeCloseTo(3);
      expect(s.field).not.toContain(s.particle);
    });

  new Simulator(new behavior.RepeatBehavior(addSpeedBehavior(1, 2), 3))
    .update(1, 10)
    .tap(s => expect(s.particle.speed).toBeCloseTo(3));

  new Simulator(new behavior.SequentialBehavior([
    addSpeedBehavior(1, 5),
    addSpeedBehavior(10, 5),
    addSpeedBehavior(100, 5),
  ]))
    .update(6)
    .tap(s => expect(s.particle.speed).toBeCloseTo(3))
    .update(8)
    .tap(s => {
      expect(s.particle.speed).toBeCloseTo(91);
      expect(s.field).toContain(s.particle);
    })
    .update(1)
    .tap(s => {
      expect(s.particle.speed).toBeCloseTo(111);
      expect(s.field).not.toContain(s.particle);
    });
});

test('parallel', () => {
  new Simulator(new behavior.ParallelBehavior([]))
    .update(1)
    .tap(s => expect(s.field).not.toContain(s.particle));

  new Simulator(new behavior.ParallelBehavior([]))
    .lifespan(10)
    .update(1)
    .tap(s => expect(s.field).toContain(s.particle));

  new Simulator(new behavior.ParallelBehavior([addSpeedBehavior(1, 5)]))
    .lifespan(10)
    .update(8)
    .tap(s => {
      expect(s.particle.speed).toBeCloseTo(1);
      expect(s.field).toContain(s.particle);
    })
    .update(2)
    .tap(s => expect(s.field).not.toContain(s.particle));

  new Simulator(new behavior.ParallelBehavior([addSpeedBehavior(5, 5)]))
    .lifespan(3)
    .update(4)
    .tap(s => {
      expect(s.particle.speed).toBeCloseTo(4);
      expect(s.field).toContain(s.particle);
    })
    .update(1)
    .tap(s => {
      expect(s.particle.speed).toBeCloseTo(5);
      expect(s.field).not.toContain(s.particle);
    });

  new Simulator(new behavior.ParallelBehavior([
    addSpeedBehavior(10, 10),
    addSpeedBehavior(200, 20),
  ]))
    .update(5)
    .tap(s => expect(s.particle.speed).toBeCloseTo(55))
    .update(5)
    .tap(s => expect(s.particle.speed).toBeCloseTo(110))
    .update(5)
    .tap(s => {
      expect(s.particle.speed).toBeCloseTo(160);
      expect(s.field).toContain(s.particle);
    })
    .update(5)
    .tap(s => {
      expect(s.particle.speed).toBeCloseTo(210);
      expect(s.field).not.toContain(s.particle);
    });
});
