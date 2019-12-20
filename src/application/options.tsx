import { h, FunctionalComponent } from 'preact';
import { useCallback } from 'preact/hooks';
import { Window, Accordion, Toggle, Slider, Button, TransitionGraph } from './components';
import { useStore, presetNames, presetStates, ApplicationState, PresetName } from './effects/store';

export const Options: FunctionalComponent<{}> = props => {
  const store = useStore();

  const {
    bloomEffect, prism, prismTrailLength,
    particle, particleTrailLength, particleTrailDiffusionScale
  } = store.state;
  const update = store.update;

  const option = <K extends keyof ApplicationState>(key: K) => ({
    value: store.state[key],
    onChange: useCallback((value: ApplicationState[K]) => update({ [key]: value }), [update]),
  });

  const applyPreset = useCallback((name: PresetName) => update(presetStates[name]), [update]);

  return (
    <Window top="5px" right="5px" width="240px">
      <Accordion header="Renderer">
        <Slider range={[45, 90, 1]} {...option('fieldOfView')}>
          field of view
        </Slider>
        <Toggle {...option('antialias')}>
          antialias
        </Toggle>
        <Toggle {...option('bloomEffect')}>
          bloom effect
        </Toggle>
        <Slider disabled={!bloomEffect} range={[0, 3, 0.05]} {...option('bloomStrength')}>
          bloom strength
        </Slider>
        <Slider disabled={!bloomEffect} range={[0, 1, 0.02]} {...option('bloomThreshold')}>
          bloom threshold
        </Slider>
        <Slider disabled={!bloomEffect} range={[0, 1, 0.02]} {...option('bloomRadius')}>
          bloom radius
        </Slider>
      </Accordion>
      <Accordion header="Prism">
        <Toggle {...option('prism')}>
          enabled
        </Toggle>
        <Slider disabled={!prism} range={[0, 1, 0.02]} {...option('prismSaturation')}>
          saturation
        </Slider>
        <Slider disabled={!prism} range={[0, 1, 0.02]} {...option('prismLightness')}>
          lightness
        </Slider>
        <Slider disabled={!prism} range={[1, 120, 1]} {...option('prismTrailLength')}>
          trail length
        </Slider>
        <Slider disabled={!prism || prismTrailLength == 1} range={[1, 4, 1]} {...option('prismTrailStep')}>
          trail step
        </Slider>
        <TransitionGraph disabled={!prism || prismTrailLength == 1} {...option('prismTrailAttenuation')}>
          trail attenuation
        </TransitionGraph>
      </Accordion>
      <Accordion header="Particle">
        <Toggle {...option('particle')}>
          enabled
        </Toggle>
        <Slider disabled={!particle} range={[0, 1, 0.01]} {...option('particleSaturation')}>
          saturation
        </Slider>
        <Slider disabled={!particle} range={[0, 1, 0.01]} {...option('particleLightness')}>
          lightness
        </Slider>
        <Toggle disabled={!particle} {...option('particleSizeAttenuation')}>
          size attenuation
        </Toggle>
        <Slider disabled={!particle} range={[0.1, 7, 0.1]} {...option('particleCoreRadius')}>
          core radius
        </Slider>
        <Slider disabled={!particle} range={[-3, 3, 0.1]} {...option('particleCoreSharpness')}>
          core sharpness
        </Slider>
        <Slider disabled={!particle} range={[0.1, 7, 0.1]} {...option('particleShellRadius')}>
          shell radius
        </Slider>
        <Slider disabled={!particle} range={[0.02, 0.98, 0.01]} {...option('particleShellLightness')}>
          shell lightness
        </Slider>
        <Slider disabled={!particle} range={[1, 120, 1]} {...option('particleTrailLength')}>
          trail length
        </Slider>
        <TransitionGraph disabled={!particle || particleTrailLength == 1} {...option('particleTrailAttenuation')}>
          trail attenuation
        </TransitionGraph>
        <Slider disabled={!particle || particleTrailLength == 1} range={[0, 100, 1]} {...option('particleTrailDiffusionScale')}>
          trail diffusion
        </Slider>
        <TransitionGraph disabled={!particle || particleTrailLength == 1 || particleTrailDiffusionScale == 0} {...option('particleTrailDiffusionTransition')}>
          trail diffusion transition
        </TransitionGraph>
      </Accordion>
      <Accordion header="Adjusting">
        <Slider disabled={!prism} range={[0, 60, 1]} {...option('prismSnapshotOffset')}>
          prism snapshot
        </Slider>
        <Slider disabled={!particle} range={[0, 60, 1]} {...option('particleSnapshotOffset')}>
          particle snapshot
        </Slider>
        <Slider disabled={!prism} range={[0, 360, 1]} {...option('prismHueOffset')}>
          prism hue
        </Slider>
        <Slider disabled={!particle} range={[0, 360, 1]} {...option('particleHueOffset')}>
          particle hue
        </Slider>
      </Accordion>
      <Accordion header="System" initiallyOpened={true}>
        <Toggle {...option('isPaused')}>
          pause
        </Toggle>
        <Toggle {...option('showStats')}>
          show stats
        </Toggle>
        <Slider range={[10, 300, 10]} {...option('stepsPerSecond')}>
          steps per second
        </Slider>
        <Slider range={[0.2, 5, 0.1]} {...option('stepsPerUpdate')}>
          steps per update
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
