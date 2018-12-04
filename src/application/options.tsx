import { h, Component } from 'preact';

import { Accordion } from './gui/accordion';
import { Toggle } from './gui/toggle';
import { Slider } from './gui/slider';
import { Select } from './gui/select';
import * as state from './state';

export type OptionsProps = {
  onChange(diff: Partial<state.ApplicationState>): void;
} & state.ApplicationState;

export class Options extends Component<OptionsProps, {}> {
  render() {
    const props = this.props;

    function change<K extends keyof state.ApplicationState>(key: K): (value: OptionsProps[K]) => void {
      return value => props.onChange({ [key]: value });
    }

    return (
      <Accordion header="Options" className="options">
        <Accordion header="Renderer" initiallyOpened={true}>
          <Select options={state.antialiasModes} value={props.antialiasMode} onChange={change('antialiasMode')}>antialias</Select>
          <Toggle value={props.focusEffect} onChange={change('focusEffect')}>focus effect</Toggle>
          <Toggle value={props.bloomEffect} onChange={change('bloomEffect')}>bloom effect</Toggle>
          <Slider range={[0, 3, 0.1]} value={props.bloomStrength} onChange={change('bloomStrength')}>bloom strength</Slider>
          <Slider range={[0, 1, 0.1]} value={props.bloomThreshold} onChange={change('bloomThreshold')}>bloom threshold</Slider>
          <Slider range={[0, 1, 0.1]} value={props.bloomRadius} onChange={change('bloomRadius')}>bloom radius</Slider>
        </Accordion>
        <Accordion header="Scene" initiallyOpened={true}>
          <Select options={state.particleTypes} value={props.particleType} onChange={change('particleType')}>particle type</Select>
          <Slider range={[0, 1, 0.01]} value={props.particleSaturation} onChange={change('particleSaturation')}>particle saturation</Slider>
          <Slider range={[0, 1, 0.01]} value={props.particleLightness} onChange={change('particleLightness')}>particle lightness</Slider>
          <Slider range={[0, 60, 1]} value={props.trailLength} onChange={change('trailLength')}>trail length</Slider>
          <Slider range={[1, 4, 1]} value={props.trailStep} onChange={change('trailStep')}>trail step</Slider>
          <Slider range={[0, 1, 0.01]} value={props.trailOpacity} onChange={change('trailOpacity')}>trail opacity</Slider>
          <Slider range={[0, 1, 0.01]} value={props.trailAttenuation} onChange={change('trailAttenuation')}>trail attenuation</Slider>
          <Slider range={[0.8, 1, 0.01]} value={props.trailFluctuation} onChange={change('trailFluctuation')}>trail fluctuation</Slider>
          <Toggle value={props.showSurface} onChange={change('showSurface')}>show surface</Toggle>
          <Toggle value={props.showSpace} onChange={change('showSpace')}>show space</Toggle>
        </Accordion>
        <Accordion header="Core" initiallyOpened={true}>
          <Toggle value={props.isPaused} onChange={change('isPaused')}>pause</Toggle>
          <Toggle value={props.showStats} onChange={change('showStats')}>show stats</Toggle>
          <Slider range={[10, 180, 1]} value={props.stepsPerSecond} onChange={change('stepsPerSecond')}>steps per second</Slider>
          <Toggle value={props.cameraRevolve} onChange={change('cameraRevolve')}>camera revolve</Toggle>
        </Accordion>
        <Accordion header="Presets" initiallyOpened={true}>
          <div className="presets">
            {state.presetNames.map(name => (
              <input
                type="button"
                value={name}
                onClick={() => props.onChange(state.presetStates[name])}
              />
            ))}
          </div>
        </Accordion>
      </Accordion>
    );
  }
}
