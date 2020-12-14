export const text = `
--- sphere
hue <>
rotate <> <> <>
emit 16 1 1 {
  rotate 0 [] 0
  emit 16 1 1 {
    rotate [-80..80] 0 0
    speed 3
    { 60 ease-out speed 0.1 | 20 nop; 50 opacity 0.1 }
    [0..40] nop
    { 20 hue+ 120 | 20 opacity 0.7 }
    [80..0] nop
    { 20 hue+ 120 | 20 opacity 0.4 }
    { 30 opacity 0 | 30 speed 1 }
  }
}

--- rope
hue 320
32 emit 4 32 1 {
  speed 2.5
  rotate <> <> <>
  { 50 ease-out speed 0.5 |
    50 rotate <-40..40> <-40..40> 0 |
    50 hue+ [40..80] }
  emit 3 1 1 {
    speed 0.5
    { 100 ease-out speed 2.5 |
      50 rotate <-40..40> <-40..40> 0 }
  }
}

--- fish
hue 38
rotate <> <> <>
0 emit 3 1 1 {
  rotate 0 [0..40] 0
  hue+ 60
  { speed 0.1; 58 nop |
    57 ease-in rotate 17 5 14 }
  40 emit 1 20 1 {
    rotate 0 0 [0..330]
    rotate 120 0 0
    hue+ [60..100]
    { speed 1.34; 33 nop |
      46 ease-in rotate 14 5 22 }
    0 emit 4 1 1 {
      rotate 0 [41 .. 101] 0
      hue+ 60
      speed 1.06
      70 ease-out rotate 40 61 0
      50 close
      120 nop
      30 opacity 0
    }
  }
}

--- random-walk
128 emit 1 128 1 {
  hue []
  speed 1
  rotate <-90 0 90 180> <-90 0 90 180> 0
  20 nop
  speed 2
  rotate <-90 0 90 180> <-90 0 90 180> 0
  20 nop
  speed 3
  rotate <-90 0 90 180> <-90 0 90 180> 0
  20 nop
  speed 4
  rotate <-90 0 90 180> <-90 0 90 180> 0
  20 nop
  speed 5
  rotate <-90 0 90 180> <-90 0 90 180> 0
  20 nop
  speed 6
  rotate <-90 0 90 180> <-90 0 90 180> 0
  20 nop
}

---
`;
