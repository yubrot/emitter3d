import { h, Component } from 'preact';

import { Accordion, Toggle, Slider, Select, Button } from './gui';
import * as state from './state';

export type Props = {
  onChange(diff: Partial<state.ApplicationState>): void;
} & state.ApplicationState;

export class Options extends Component<Props, {}> {
  constructor(props: Props) {
    super(props);

    const update: any = {};
    for (const key in state.initialApplicationState()) {
      update[key] = (value: any) => this.props.onChange({ [key]: value });
    }
    this.update = update;
  }

  private update: { [P in keyof state.ApplicationState]: (value: Props[P]) => void };

  render() {
    const { props, update } = this;

    return (
      <Accordion header="Options" className="options">
        <Accordion header="Renderer">
          <Select options={state.antialiasModes} value={props.antialiasMode} onChange={update.antialiasMode}>antialias</Select>
          <Toggle value={props.focusEffect} onChange={update.focusEffect}>focus effect</Toggle>
          <Toggle value={props.bloomEffect} onChange={update.bloomEffect}>bloom effect</Toggle>
          <Slider range={[0, 3, 0.1]} value={props.bloomStrength} onChange={update.bloomStrength}>bloom strength</Slider>
          <Slider range={[0, 1, 0.1]} value={props.bloomThreshold} onChange={update.bloomThreshold}>bloom threshold</Slider>
          <Slider range={[0, 1, 0.1]} value={props.bloomRadius} onChange={update.bloomRadius}>bloom radius</Slider>
        </Accordion>
        <Accordion header="Scene">
          <Select options={state.particleTypes} value={props.particleType} onChange={update.particleType}>particle type</Select>
          <Slider range={[0, 1, 0.01]} value={props.particleSaturation} onChange={update.particleSaturation}>particle saturation</Slider>
          <Slider range={[0, 1, 0.01]} value={props.particleLightness} onChange={update.particleLightness}>particle lightness</Slider>
          <Slider range={[0, 60, 1]} value={props.trailLength} onChange={update.trailLength}>trail length</Slider>
          <Slider range={[1, 4, 1]} value={props.trailStep} onChange={update.trailStep}>trail step</Slider>
          <Slider range={[0, 1, 0.01]} value={props.trailOpacity} onChange={update.trailOpacity}>trail opacity</Slider>
          <Slider range={[0, 1, 0.01]} value={props.trailAttenuation} onChange={update.trailAttenuation}>trail attenuation</Slider>
          <Slider range={[0.8, 1, 0.01]} value={props.trailFluctuation} onChange={update.trailFluctuation}>trail fluctuation</Slider>
          <Toggle value={props.showSurface} onChange={update.showSurface}>show surface</Toggle>
          <Toggle value={props.showSpace} onChange={update.showSpace}>show space</Toggle>
        </Accordion>
        <Accordion header="Core" initiallyOpened={true}>
          <Toggle value={props.isPaused} onChange={update.isPaused}>pause</Toggle>
          <Toggle value={props.showStats} onChange={update.showStats}>show stats</Toggle>
          <Toggle value={props.showEditor} onChange={update.showEditor}>show editor</Toggle>
          <Slider range={[10, 180, 1]} value={props.stepsPerSecond} onChange={update.stepsPerSecond}>steps per second</Slider>
          <Toggle value={props.cameraRevolve} onChange={update.cameraRevolve}>camera revolve</Toggle>
        </Accordion>
        <Accordion header="Presets" initiallyOpened={true}>
          <div className="presets">
            {state.presetNames.map(name => (
              <Button text={name} onClick={() => props.onChange(state.presetStates[name])} />
            ))}
          </div>
        </Accordion>
      </Accordion>
    );
  }
}
