export const reference =
  `
--- nop
speed 1
model missile

60 nop

--- close
speed 1
model missile

60 nop
close
60 nop

--- speed + *
speed 1
model missile

60 nop
speed 0.4
60 nop
speed+ -2
60 nop
120 speed* 0.1

--- opacity + *
speed 0.5
model missile

60 opacity 0
60 opacity 1
60 opacity* 0.1
60 opacity+ 0.9

--- hue +
speed 0.5
model missile

180 hue 360
speed* -1
180 hue+ -360

--- translate
speed 0.2
model missile

90 nop
30 translate 30 0 0
90 nop
30 translate 0 30 0
90 nop
30 translate 0 0 30
30 nop

--- rotate
speed 1
model missile

90 rotate 360 0 0
90 rotate 0 360 0
90 rotate 0 0 360

--- emit
model arrow

60 emit 8 1 1 { speed 1; rotate 0 [] 0; 60 nop }
60 nop
hue+ 60
60 emit 1 8 1 { speed 1; rotate 0 [] 0; 60 nop }
60 nop
hue+ 60
60 emit 3 8 1 { speed 1; rotate 0 [] 0; 60 nop }
60 nop
hue+ 60
60 emit 1 8 3 { speed 1; rotate 0 [] 0; 60 nop }
60 nop
hue+ 60
60 emit 3 8 3 { speed 1; rotate 0 [] 0; 60 nop }
120 nop
hue+ 60
60 emit 3 1 3 { speed 1; rotate 0 [] 0; 60 nop }

--- loop
model missile
speed 1

400 loop {
  hue+ 60
  rotate 0 45 0
  emit 1 1 1 { 90 nop }
  30 nop
}

--- repeat
model missile
speed 1

repeat 12 {
  hue+ 60
  emit 1 1 1 { 90 nop }
  30 rotate 0 90 0
}

--- block
model missile
speed 1

repeat 4 {
  60 emit 1 9 1 { rotate 0 180 0; 60 nop }
|
  60 rotate 0 90 0
|
  60 hue+ 90
}

--- (model)
emit 3 1 1 {
  model [missile claw arrow]
  rotate 0 [] 0
  speed 1
  100 nop
}

--- (easing)
emit 4 1 1 {
  model missile
  rotate 0 [] 0
  speed 0
  100 [linear ease-in ease-out ease-in-out] speed 2
}

--- $each-choice
model missile
speed 1

emit 16 1 1 {
  rotate 0 [] 0;
  60 nop
  60 rotate 0 [90 -90] 0
  60 nop
}

--- $each-range
model missile
speed 1

60 emit 10 1 1 { rotate 0 [-30..30] 0; 60 nop }
speed* -1
60 emit 10 1 1 { rotate 0 [-60..60] 0; 60 nop }
speed* -1
60 emit 10 1 1 { rotate 0 [-90..90] 0; 60 nop }

--- $each-angle
model missile
speed 1

60 emit 8 1 1 { rotate 0 [] 0; hue []; 60 nop }
speed* -1
60 emit 16 1 1 { rotate 0 [] 0; hue []; 60 nop }
speed* -1
60 emit 32 1 1 { rotate 0 [] 0; hue []; 60 nop }

--- $random-choice
emit 8 1 1 {
  model <missile claw arrow>
  speed 1
  rotate 0 [] 0
  60 nop
}

--- $random-range
32 emit 1 32 1 {
  model missile
  speed 2
  60 ease-out rotate <-60..60> <-60..60> <-60..60>
  30 nop
}

--- $random-angle
32 emit 4 32 1 {
  model arrow
  speed 3
  rotate <> <> <>
  100 ease-out speed 0
}

---
`;
