export const examples =
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

---
`;
