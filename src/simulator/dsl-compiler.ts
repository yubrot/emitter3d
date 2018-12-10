import { Easing } from './aux/easing';
import { Model, Behavior } from './particle';
import * as behavior from './particle-behavior';
import * as dsl from './dsl';

export class CompileError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export type Gen<T> = (index: [number, number]) => T;

export class Compiler {
  readonly units = new Map<string, Unit>();

  constructor() {
    this.initializeUnits();
  }

  compileProgram(program: dsl.AST[]): Gen<Behavior> {
    if (program.length == 1) return this.compile(program[0]);
    return this.compile(new dsl.List([dsl.Symbol.block, new dsl.List(program)]));
  }

  compile(expr: dsl.AST): Gen<Behavior> {
    return this.getUnit(expr).behavior(this);
  }

  getUnit(expr: dsl.AST): Unit {
    return expr.visit({
      number: v => new NumberUnit(v.value),
      symbol: v => {
        const unit = this.units.get(v.value);
        if (!unit) {
          throw new CompileError(`Unknown identifier "${v.value}"`);
        }
        return unit;
      },
      list: v => {
        if (v.elements.length == 0) return new NilUnit();
        return this.getUnit(v.elements[0]).withArguments(v.elements.slice(1));
      },
    });
  }

  private initializeUnits(): void {
    this.units.set('missile', new ModelUnit('missile'));
    this.units.set('arrow', new ModelUnit('arrow'));
    this.units.set('claw', new ModelUnit('claw'));

    this.units.set('linear', new EasingUnit(Easing.linear));
    this.units.set('ease-in', new EasingUnit(Easing.easeIn));
    this.units.set('ease-out', new EasingUnit(Easing.easeOut));
    this.units.set('ease-in-out', new EasingUnit(Easing.easeInOut));

    this.units.set('nop', new NopUnit());
    this.units.set('speed', new UnitConstructor(SetSpeedUnit));
    this.units.set('speed+', new UnitConstructor(AddSpeedUnit));
    this.units.set('speed*', new UnitConstructor(MultiplySpeedUnit));
    this.units.set('opacity', new UnitConstructor(SetOpacityUnit));
    this.units.set('opacity+', new UnitConstructor(AddOpacityUnit));
    this.units.set('opacity*', new UnitConstructor(MultiplyOpacityUnit));
    this.units.set('hue', new UnitConstructor(SetHueUnit));
    this.units.set('hue+', new UnitConstructor(AddHueUnit));
    this.units.set('model', new UnitConstructor(SetModelUnit));
    this.units.set('translate', new UnitConstructor(TranslateUnit));
    this.units.set('rotate', new UnitConstructor(RotateUnit));
    this.units.set('emit', new UnitConstructor(EmitUnit));
    this.units.set('loop', new UnitConstructor(LoopUnit));
    this.units.set('repeat', new UnitConstructor(RepeatUnit));
    this.units.set(dsl.Symbol.block.value, new UnitConstructor(BlockUnit));

    this.units.set(dsl.Symbol.eachChoice.value, new UnitConstructor(EachChoiceUnit));
    this.units.set(dsl.Symbol.eachRange.value, new UnitConstructor(EachRangeUnit));
    this.units.set(dsl.Symbol.eachAngle.value, new EachAngleUnit());
    this.units.set(dsl.Symbol.randomChoice.value, new UnitConstructor(RandomChoiceUnit));
    this.units.set(dsl.Symbol.randomRange.value, new UnitConstructor(RandomRangeUnit));
    this.units.set(dsl.Symbol.randomAngle.value, new RandomAngleUnit());
  }
}

export abstract class Unit {
  withArguments(args: dsl.AST[]): Unit {
    throw new CompileError(`${this.constructor.name} takes no arguments`);
  }

  model(env: Compiler): Gen<Model> {
    throw new CompileError(`Expected model but got ${this.constructor.name}`);
  }

  number(env: Compiler): Gen<number> {
    throw new CompileError(`Expected number but got ${this.constructor.name}`);
  }

  easing(env: Compiler): Gen<Easing> {
    throw new CompileError(`Expected easing but got ${this.constructor.name}`);
  }

  behavior(env: Compiler): Gen<Behavior> {
    throw new CompileError(`Expected behavior but got ${this.constructor.name}`);
  }
}

class UnitConstructor extends Unit {
  constructor(private c: { new(args: dsl.AST[]): Unit }) {
    super();
  }

  withArguments(args: dsl.AST[]): Unit {
    return new this.c(args);
  }
}

type TakeArgs = {
  model(): Gen<Model>;
  number(): Gen<number>;
  easing(): Gen<Easing>;
  behavior(): Gen<Behavior>;
};

abstract class ConstructedUnit extends Unit {
  constructor(protected args: dsl.AST[]) {
    super();
  }

  protected takeArgs(env: Compiler, length: number): TakeArgs {
    if (this.args.length != length) {
      throw new CompileError(`${this.constructor.name} takes ${length} arguments but got ${this.args.length}`);
    }
    let i = 0;
    return {
      model: () => env.getUnit(this.args[i++]).model(env),
      easing: () => env.getUnit(this.args[i++]).easing(env),
      number: () => env.getUnit(this.args[i++]).number(env),
      behavior: () => env.getUnit(this.args[i++]).behavior(env),
    };
  }
}

class NilUnit extends Unit {}

class NumberUnit extends Unit {
  constructor(private value: number) {
    super();
  }

  withArguments(args: dsl.AST[]): Unit {
    return new PutLifespanUnit(this, args);
  }

  number(env: Compiler): Gen<number> {
    const value = this.value;
    return _ => value;
  }
}

class EasingUnit extends Unit {
  constructor(private value: Easing) {
    super();
  }

  withArguments(args: dsl.AST[]): Unit {
    return new PutEasingUnit(this, args);
  }

  easing(env: Compiler): Gen<Easing> {
    const value = this.value;
    return _ => value;
  }
}

class PutLifespanUnit extends ConstructedUnit {
  constructor(private unit: Unit, args: dsl.AST[]) {
    super(args);
  }

  behavior(env: Compiler): Gen<Behavior> {
    const bodyUnit = env.getUnit(this.args.length == 1 ? this.args[0] : new dsl.List(this.args));
    const behaviorGen = bodyUnit.behavior(env);
    const lifespanGen = this.unit.number(env);

    return index => {
      const behavior = behaviorGen(index);
      behavior.lifespan = lifespanGen(index);
      return behavior;
    };
  }
}

class PutEasingUnit extends ConstructedUnit {
  constructor(private unit: Unit, args: dsl.AST[]) {
    super(args);
  }

  behavior(env: Compiler): Gen<Behavior> {
    const bodyUnit = env.getUnit(this.args.length == 1 ? this.args[0] : new dsl.List(this.args));
    const behaviorGen = bodyUnit.behavior(env);
    const easingGen = this.unit.easing(env);

    return index => {
      const behavior = behaviorGen(index);
      behavior.easing = easingGen(index);
      return behavior;
    };
  }
}

class ModelUnit extends Unit {
  constructor(readonly value: Model) {
    super();
  }

  model(env: Compiler): Gen<Model> {
    const value = this.value;
    return _ => value;
  }
}

class NopUnit extends Unit {
  behavior(env: Compiler): Gen<Behavior> {
    return _ => new behavior.NopBehavior();
  }
}

class SetSpeedUnit extends ConstructedUnit {
  behavior(env: Compiler): Gen<Behavior> {
    const speedGen = this.takeArgs(env, 1).number();
    return index => new behavior.SetBehavior(speedGen(index), p => p.speed, (p, v) => p.speed = v);
  }
}

class AddSpeedUnit extends ConstructedUnit {
  behavior(env: Compiler): Gen<Behavior> {
    const speedGen = this.takeArgs(env, 1).number();
    return index => new behavior.AddBehavior(speedGen(index), (p, v) => p.speed += v);
  }
}

class MultiplySpeedUnit extends ConstructedUnit {
  behavior(env: Compiler): Gen<Behavior> {
    const speedGen = this.takeArgs(env, 1).number();
    return index => new behavior.MultiplyBehavior(speedGen(index), (p, s) => p.speed *= s);
  }
}

class SetOpacityUnit extends ConstructedUnit {
  behavior(env: Compiler): Gen<Behavior> {
    const opacityGen = this.takeArgs(env, 1).number();
    return index => new behavior.SetBehavior(opacityGen(index), p => p.opacity, (p, v) => p.opacity = v);
  }
}

class AddOpacityUnit extends ConstructedUnit {
  behavior(env: Compiler): Gen<Behavior> {
    const opacityGen = this.takeArgs(env, 1).number();
    return index => new behavior.AddBehavior(opacityGen(index), (p, v) => p.opacity += v);
  }
}

class MultiplyOpacityUnit extends ConstructedUnit {
  behavior(env: Compiler): Gen<Behavior> {
    const opacityGen = this.takeArgs(env, 1).number();
    return index => new behavior.MultiplyBehavior(opacityGen(index), (p, s) => p.opacity *= s);
  }
}

class SetHueUnit extends ConstructedUnit {
  behavior(env: Compiler): Gen<Behavior> {
    const hueGen = this.takeArgs(env, 1).number();
    return index => new behavior.SetBehavior(hueGen(index), p => p.hue, (p, v) => p.hue = v);
  }
}

class AddHueUnit extends ConstructedUnit {
  behavior(env: Compiler): Gen<Behavior> {
    const hueGen = this.takeArgs(env, 1).number();
    return index => new behavior.AddBehavior(hueGen(index), (p, v) => p.hue += v);
  }
}

class SetModelUnit extends ConstructedUnit {
  behavior(env: Compiler): Gen<Behavior> {
    const modelGen = this.takeArgs(env, 1).model();
    return index => new behavior.SetModelBehavior(modelGen(index));
  }
}

class TranslateUnit extends ConstructedUnit {
  behavior(env: Compiler): Gen<Behavior> {
    const args = this.takeArgs(env, 3);
    const xGen = args.number();
    const yGen = args.number();
    const zGen = args.number();
    return index => new behavior.TranslateBehavior(xGen(index), yGen(index), zGen(index));
  }
}

class RotateUnit extends ConstructedUnit {
  behavior(env: Compiler): Gen<Behavior> {
    const args = this.takeArgs(env, 3);
    const xdegGen = args.number();
    const ydegGen = args.number();
    const zdegGen = args.number();
    return index => new behavior.RotateBehavior(xdegGen(index), ydegGen(index), zdegGen(index));
  }
}

class LoopUnit extends ConstructedUnit {
  behavior(env: Compiler): Gen<Behavior> {
    const patternGen = this.takeArgs(env, 1).behavior();
    return index => new behavior.LoopBehavior(patternGen(index));
  }
}

class RepeatUnit extends ConstructedUnit {
  behavior(env: Compiler): Gen<Behavior> {
    const args = this.takeArgs(env, 2);
    const limitGen = args.number();
    const patternGen = args.behavior();
    return index => new behavior.RepeatBehavior(patternGen(index), limitGen(index));
  }
}

class EmitUnit extends ConstructedUnit {
  behavior(env: Compiler): Gen<Behavior> {
    const args = this.takeArgs(env, 4);
    const countGen = args.number();
    const timesGen = args.number();
    const parallelGen = args.number();
    const childPattern = args.behavior();
    return index => {
      const count = countGen(index);
      const times = timesGen(index);
      const parallel = parallelGen(index);
      const max = count * times * parallel;
      return new behavior.EmitBehavior(count, times, parallel, i => childPattern([i, max]));
    };
  }
}

class BlockUnit extends ConstructedUnit {
  behavior(env: Compiler): Gen<Behavior> {
    const behaviorGens = this.args.map(arg => {
      if (!(arg instanceof dsl.List)) {
        throw new CompileError(`Each arguments of ${dsl.Symbol.block.value} must be list`);
      }

      return arg.elements.map(e => env.getUnit(e).behavior(env));
    });

    return index => {
      const behaviors = behaviorGens.map(gens => new behavior.SequentialBehavior(gens.map(gen => gen(index))));
      return new behavior.ParallelBehavior(behaviors);
    };
  }
}

abstract class ChoiceUnit extends ConstructedUnit {
  abstract choiceGen(size: number): Gen<number>;

  protected getUnit(env: Compiler, expr: dsl.AST): Unit {
    return env.getUnit(expr);
  }

  private gen<T>(env: Compiler, f: (d: Unit) => Gen<T>): Gen<T> {
    if (this.args.length == 0) {
      throw new CompileError(`${this.constructor.name} takes at least one argumnet`);
    }

    const gens = this.args.map(arg => f(this.getUnit(env, arg)));
    const choiceGen = this.choiceGen(gens.length);
    return index => gens[choiceGen(index)](index);
  }

  withArguments(args: dsl.AST[]): Unit {
    return new ChoiceUnitWithArguments(this.args, this, args);
  }

  model(env: Compiler): Gen<Model> {
    return this.gen(env, unit => unit.model(env));
  }

  number(env: Compiler): Gen<number> {
    return this.gen(env, unit => unit.number(env));
  }

  easing(env: Compiler): Gen<Easing> {
    return this.gen(env, unit => unit.easing(env));
  }

  behavior(env: Compiler): Gen<Behavior> {
    return this.gen(env, unit => unit.behavior(env));
  }
}

class ChoiceUnitWithArguments extends ChoiceUnit {
  constructor(args: dsl.AST[], private body: ChoiceUnit, private unitArgs: dsl.AST[]) {
    super(args);
  }

  choiceGen(size: number): Gen<number> {
    return this.body.choiceGen(size);
  }

  protected getUnit(env: Compiler, expr: dsl.AST): Unit {
    return super.getUnit(env, expr).withArguments(this.unitArgs);
  }
}

abstract class RangeUnit extends ConstructedUnit {
  abstract rangeGen(): Gen<number>;

  withArguments(args: dsl.AST[]): Unit {
    return new PutLifespanUnit(this, args);
  }

  number(env: Compiler): Gen<number> {
    const args = this.takeArgs(env, 2);
    const minGen = args.number();
    const maxGen = args.number();
    const rangeGen = this.rangeGen();
    return index => {
      const min = minGen(index);
      const max = maxGen(index);
      const r = rangeGen(index);
      return min * (1 - r) + max * r;
    };
  }
}

class EachChoiceUnit extends ChoiceUnit {
  choiceGen(size: number): Gen<number> {
    return ([a, _]) => a % size;
  }
}

class EachRangeUnit extends RangeUnit {
  rangeGen(): Gen<number> {
    return ([a, b]) => (b <= 1) ? 0.5 : a / (b - 1);
  }
}

class EachAngleUnit extends Unit {
  number(env: Compiler): Gen<number> {
    return ([a, b]) => 360 * a / b + (b == 2 ? 90 : 0);
  }
}

class RandomChoiceUnit extends ChoiceUnit {
  choiceGen(size: number): Gen<number> {
    return _ => Math.floor(Math.random() * size);
  }
}

class RandomRangeUnit extends RangeUnit {
  rangeGen(): Gen<number> {
    return _ => Math.random();
  }
}

class RandomAngleUnit extends Unit {
  number(env: Compiler): Gen<number> {
    return _ => Math.random() * 360;
  }
}
