export const text = `
--- nop
speed 1

60 nop

--- close
speed 1

60 nop
close
60 nop

--- speed + *
speed 1
30 nop

rotate 0 90 0
speed 0.4
60 nop

rotate 0 90 0
60 speed+ 2

rotate 0 90 0
60 speed* 0.1

--- opacity + *
speed 0.5

60 opacity 0
60 opacity 1
60 opacity* 0.1
60 opacity+ 0.9

--- hue +
speed 0.5

180 hue 360
rotate 0 90 0
180 hue+ -360

--- translate
speed 0.2

90 nop
30 translate 30 0 0
90 nop
30 translate 0 30 0
90 nop
30 translate 0 0 30
60 nop

--- rotate
speed 1

90 rotate 360 0 0
90 rotate 0 360 0
90 rotate 0 0 360

--- emit
60 emit 5 1 1 { speed 1; rotate 0 [] 0; 60 nop }
60 nop
hue+ 60
60 emit 1 8 1 { speed 1; rotate 0 [] 0; 60 nop }
60 nop
hue+ 60
60 emit 5 8 1 { speed 1; rotate 0 [] 0; 60 nop }
60 nop
hue+ 60
60 emit 1 8 3 { speed 1; rotate 0 [] 0; 60 nop }
60 nop
hue+ 60
60 emit 5 8 3 { speed 1; rotate 0 [] 0; 60 nop }
120 nop
hue+ 60
60 emit 5 1 3 { speed 1; rotate 0 [] 0; 60 nop }

--- loop
speed 1

400 loop {
  hue+ 10
  rotate 0 15 0
  emit 1 1 1 { 90 nop }
  10 nop
}

--- repeat
speed 1

repeat 12 {
  hue+ 60
  emit 1 1 1 { 90 nop }
  30 rotate 0 90 0
}

--- block
speed 1

{
  360 emit 1 36 1 { rotate 0 180 0; 60 nop }
|
  180 rotate 0 360 0
  180 rotate 0 -360 0
|
  360 hue+ 360
}

--- (easing)
emit 4 1 1 {
  translate [-20..20] 0 0
  [40..200] nop
  speed 2
  100 [linear ease-in ease-out ease-in-out] speed 0
}

--- $each-choice
128 emit 1 24 1 {
  speed 1
  30 nop
  30 rotate 0 [-60 -20 20 60] 0
  60 nop
}

--- $each-range
60 emit 10 1 1 { speed 1; rotate 0 [-30..30] 0; 60 nop }
translate 0 10 0
60 emit 10 1 1 { speed 1; rotate 0 [-60..60] 0; 60 nop }
translate 0 10 0
60 emit 10 1 1 { speed 1; rotate 0 [-90..90] 0; 60 nop }

--- $each-angle
60 emit 16 1 1 { speed 0.7; rotate 0 [] 0; hue []; 180 nop }
60 emit 32 1 1 { speed 1; rotate 0 [] 0; hue []; 120 nop }
60 emit 64 1 1 { speed 1.5; rotate 0 [] 0; hue []; 60 nop }

--- $random-choice
speed 3
rotate <-90 0 90> <-90 0 90> 0; 10 nop
rotate <-90 0 90> <-90 0 90> 0; 10 nop
rotate <-90 0 90> <-90 0 90> 0; 10 nop
rotate <-90 0 90> <-90 0 90> 0; 10 nop
rotate <-90 0 90> <-90 0 90> 0; 10 nop
rotate <-90 0 90> <-90 0 90> 0; 10 nop
rotate <-90 0 90> <-90 0 90> 0; 10 nop

--- $random-range
32 emit 1 32 1 {
  speed 2
  60 ease-out rotate <-60..60> <-60..60> <-60..60>
  30 nop
}

--- $random-angle
32 emit 4 32 1 {
  speed 3
  rotate <> <> <>
  100 ease-out speed 0
}

---
`;
