import { h, FunctionalComponent } from 'preact';
import { useCallback } from 'preact/hooks';
import { Window, Accordion, Toggle, Slider, Button } from './components';
import { useStore, presetNames, presetStates, ApplicationState, PresetName } from './effects/store';

export const Options: FunctionalComponent<{}> = props => {
  const store = useStore();

  const { bloomEffect, particlePoint, trailLength, trailFluctuationScale } = store.state;
  const update = store.update;

  const option = <K extends keyof ApplicationState>(key: K) => ({
    value: store.state[key],
    onChange: useCallback((value: ApplicationState[K]) => update({ [key]: value }), [update]),
  });

  const applyPreset = useCallback((name: PresetName) => update(presetStates[name]), [update]);

  return (
    <Window top="5px" right="5px" width="240px">
      <Accordion header="Renderer">
        <Toggle {...option('antialias')}>
          antialias
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
        <Toggle {...option('particlePoint')}>
          point particle
        </Toggle>
        <Slider disabled={!particlePoint} range={[0.1, 16, 0.1]} {...option('particlePointSize')}>
          particle point size
        </Slider>
        <Toggle disabled={!particlePoint} {...option('particlePointSizeAttenuation')}>
          particle point size attenuation
        </Toggle>
        <Slider disabled={!particlePoint} range={[0.05, 0.95, 0.01]} {...option('particlePointCoreWidth')}>
          particle point core width
        </Slider>
        <Slider disabled={!particlePoint} range={[-3, 3, 0.01]} {...option('particlePointCoreSharpness')}>
          particle point core sharpness
        </Slider>
        <Slider disabled={!particlePoint} range={[0.05, 0.95, 0.01]} {...option('particlePointShellLightness')}>
          particle point shell lightness
        </Slider>
        <Toggle {...option('particlePrism')}>
          prism particle
        </Toggle>
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
