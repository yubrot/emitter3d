import { h, Component } from 'preact';

import { Accordion, Toggle, Slider, Select, Button } from './components';
import * as state from './state';

export type Props = {
  onChange(diff: Partial<state.ApplicationState>): void;
} & state.ApplicationState;

export class Options extends Component<Props, {}> {
  constructor(props: Props) {
    super(props);

    const change: any = {};
    for (const key in state.initialApplicationState()) {
      change[key] = (value: any) => this.props.onChange({ [key]: value });
    }
    this.change = change;
  }

  private change: { [P in keyof state.ApplicationState]: (value: Props[P]) => void };

  render() {
    const { props, change } = this;

    return (
      <Accordion header="Options" className="options">
        <Accordion header="Renderer">
          <Select options={state.antialiasModes} value={props.antialiasMode} onChange={change.antialiasMode}>antialias</Select>
          <Toggle value={props.focusEffect} onChange={change.focusEffect}>focus effect</Toggle>
          <Toggle value={props.bloomEffect} onChange={change.bloomEffect}>bloom effect</Toggle>
          <Slider disabled={!props.bloomEffect} range={[0, 3, 0.1]} value={props.bloomStrength} onChange={change.bloomStrength}>bloom strength</Slider>
          <Slider disabled={!props.bloomEffect} range={[0, 1, 0.1]} value={props.bloomThreshold} onChange={change.bloomThreshold}>bloom threshold</Slider>
          <Slider disabled={!props.bloomEffect} range={[0, 1, 0.1]} value={props.bloomRadius} onChange={change.bloomRadius}>bloom radius</Slider>
        </Accordion>
        <Accordion header="Scene">
          <Slider range={[0, 1, 0.01]} value={props.particleSaturation} onChange={change.particleSaturation}>particle saturation</Slider>
          <Slider range={[0, 1, 0.01]} value={props.particleLightness} onChange={change.particleLightness}>particle lightness</Slider>
          <Select options={state.particleModes} value={props.particleMode} onChange={change.particleMode}>particle mode</Select>
          <Slider disabled={props.particleMode != 'points'} range={[0.1, 16, 0.1]} value={props.particlePointSize} onChange={change.particlePointSize}>particle point size</Slider>
          <Toggle disabled={props.particleMode != 'points'} value={props.particlePointSizeAttenuation} onChange={change.particlePointSizeAttenuation}>particle point size attenuation</Toggle>
          <Slider disabled={props.particleMode != 'points'} range={[0.05, 0.95, 0.01]} value={props.particlePointCoreWidth} onChange={change.particlePointCoreWidth}>particle point core width</Slider>
          <Slider disabled={props.particleMode != 'points'} range={[-3, 3, 0.01]} value={props.particlePointCoreSharpness} onChange={change.particlePointCoreSharpness}>particle point core sharpness</Slider>
          <Slider disabled={props.particleMode != 'points'} range={[0.05, 0.95, 0.01]} value={props.particlePointShellLightness} onChange={change.particlePointShellLightness}>particle point shell lightness</Slider>
          <Slider range={[1, 60, 1]} value={props.trailLength} onChange={change.trailLength}>trail length</Slider>
          <Slider disabled={props.trailLength == 1} range={[1, 4, 1]} value={props.trailStep} onChange={change.trailStep}>trail step</Slider>
          <Slider disabled={props.trailLength == 1} range={[0, 100, 1]} value={props.trailFluctuationScale} onChange={change.trailFluctuationScale}>trail fluctuation scale</Slider>
          <Slider disabled={props.trailLength == 1 || props.trailFluctuationScale == 0} range={[-3, 3, 0.01]} value={props.trailFluctuationBias} onChange={change.trailFluctuationBias}>trail fluctuation bias</Slider>
          <Slider disabled={props.trailLength == 1} range={[-3, 3, 0.01]} value={props.trailAttenuationBias} onChange={change.trailAttenuationBias}>trail attenuation bias</Slider>
          <Toggle value={props.showSpace} onChange={change.showSpace}>show space</Toggle>
        </Accordion>
        <Accordion header="Core" initiallyOpened={true}>
          <Toggle value={props.isPaused} onChange={change.isPaused}>pause</Toggle>
          <Toggle value={props.showStats} onChange={change.showStats}>show stats</Toggle>
          <Toggle value={props.showEditor} onChange={change.showEditor}>show editor</Toggle>
          <Slider range={[10, 180, 1]} value={props.stepsPerSecond} onChange={change.stepsPerSecond}>steps per second</Slider>
          <Toggle value={props.cameraRevolve} onChange={change.cameraRevolve}>camera revolve</Toggle>
        </Accordion>
        <Accordion header="Presets" initiallyOpened={true}>
          <div className="presets">
            {state.presetNames.map(name => (
              <Button onClick={() => props.onChange(state.presetStates[name])}>{name}</Button>
            ))}
          </div>
        </Accordion>
      </Accordion>
    );
  }
}
