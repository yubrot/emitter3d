import { h, FunctionalComponent } from 'preact';
import { useCallback } from 'preact/hooks';
import { Window, Accordion, Toggle, Slider, Select, Button } from './components';
import {
  useStore, antialiasModes, particleModes, presetNames, presetStates,
  ApplicationState, PresetName,
} from './effects/store';

export const Options: FunctionalComponent<{}> = props => {
  const store = useStore();

  const { bloomEffect, particleMode, trailLength, trailFluctuationScale } = store.state;
  const update = store.update;

  const option = <K extends keyof ApplicationState>(key: K) => ({
    value: store.state[key],
    onChange: useCallback((value: ApplicationState[K]) => update({ [key]: value }), [update]),
  });

  const applyPreset = useCallback((name: PresetName) => update(presetStates[name]), [update]);

  return (
    <Window top="5px" right="5px" width="240px">
      <Accordion header="Renderer">
        <Select options={antialiasModes} {...option('antialiasMode')}>
          antialias
        </Select>
        <Toggle {...option('focusEffect')}>
          focus effect
        </Toggle>
        <Toggle {...option('bloomEffect')}>
          bloom effect
        </Toggle>
        <Slider disabled={!bloomEffect} range={[0, 3, 0.1]} {...option('bloomStrength')}>
          bloom strength
        </Slider>
        <Slider disabled={!bloomEffect} range={[0, 1, 0.1]} {...option('bloomThreshold')}>
          bloom threshold
        </Slider>
        <Slider disabled={!bloomEffect} range={[0, 1, 0.1]} {...option('bloomRadius')}>
          bloom radius
        </Slider>
      </Accordion>
      <Accordion header="Scene">
        <Slider range={[0, 1, 0.01]} {...option('particleSaturation')}>
          particle saturation
        </Slider>
        <Slider range={[0, 1, 0.01]} {...option('particleLightness')}>
          particle lightness
        </Slider>
        <Select options={particleModes} {...option('particleMode')}>
          particle mode
        </Select>
        <Slider disabled={particleMode != 'points'} range={[0.1, 16, 0.1]} {...option('particlePointSize')}>
          particle point size
        </Slider>
        <Toggle disabled={particleMode != 'points'} {...option('particlePointSizeAttenuation')}>
          particle point size attenuation
        </Toggle>
        <Slider disabled={particleMode != 'points'} range={[0.05, 0.95, 0.01]} {...option('particlePointCoreWidth')}>
          particle point core width
        </Slider>
        <Slider disabled={particleMode != 'points'} range={[-3, 3, 0.01]} {...option('particlePointCoreSharpness')}>
          particle point core sharpness
        </Slider>
        <Slider disabled={particleMode != 'points'} range={[0.05, 0.95, 0.01]} {...option('particlePointShellLightness')}>
          particle point shell lightness
        </Slider>
        <Slider range={[1, 60, 1]} {...option('trailLength')}>
          trail length
        </Slider>
        <Slider disabled={trailLength == 1} range={[1, 4, 1]} {...option('trailStep')}>
          trail step
        </Slider>
        <Slider disabled={trailLength == 1} range={[0, 100, 1]} {...option('trailFluctuationScale')}>
          trail fluctuation scale
        </Slider>
        <Slider disabled={trailLength == 1 || trailFluctuationScale == 0} range={[-3, 3, 0.01]} {...option('trailFluctuationBias')}>
          trail fluctuation bias
        </Slider>
        <Slider disabled={trailLength == 1} range={[-3, 3, 0.01]} {...option('trailAttenuationBias')}>
          trail attenuation bias
        </Slider>
        <Toggle {...option('showSpace')}>
          show space
        </Toggle>
      </Accordion>
      <Accordion header="Core" initiallyOpened={true}>
        <Toggle {...option('isPaused')}>
          pause
        </Toggle>
        <Toggle {...option('showStats')}>
          show stats
        </Toggle>
        <Slider range={[10, 180, 1]} {...option('stepsPerSecond')}>
          steps per second
        </Slider>
        <Toggle {...option('cameraRevolve')}>
          camera revolve
        </Toggle>
      </Accordion>
      <Accordion header="Presets" initiallyOpened={true}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {presetNames.map(presetName => (
            <Button onClick={() => applyPreset(presetName)}>
              {presetName}
            </Button>
          ))}
        </div>
      </Accordion>
    </Window>
  );
};
