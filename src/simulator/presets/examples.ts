export const text =
  `
--- sphere
model arrow
hue <>
rotate <> <> <>
emit 20 1 1 {
  rotate 0 [] 0
  emit 20 1 1 {
    rotate [-90..90] 0 0
    speed 3
    { 60 ease-out speed 0.1 | 20 nop; 50 opacity 0.1 }
    [0..40] nop
    { 20 hue+ 120 | 20 opacity 0.7 }
    [80..0] nop
    { 20 hue+ 120 | 20 opacity 0.4 }
    { 30 opacity 0 | 30 speed 1 }
  }
}

--- spin
hue 120
model arrow
44 emit 1 7 3 {
  rotate 0 [] 0
  hue+ 60
  model claw
  speed 2.13
  { 86 ease-out speed 0.6 | 86 ease-in rotate 47 6 118 }
  {
    66 emit 1 8 1 {
      rotate 0 180 0
      hue+ 60
      model arrow
      speed 1.16
      46 nop
      0 emit 2 1 1 {
        rotate 0 [] 0
        hue+ 60
        model missile
        speed 0.3
        23 nop
        { 45 ease-in speed* 4.27 | 45 ease-in rotate 0 36 8 }
        52 close
        120 nop
        30 opacity 0
      }
    }
  |
    66 ease-in rotate 98 0 0
  }
}
---
`;
