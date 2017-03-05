export const vertexShader = `
  precision highp float;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  attribute vec3 position;
  attribute vec3 offset;
  attribute vec4 orientation;
  attribute vec3 color;
  attribute vec3 color2;

  varying vec4 vColor;

  void main() {
    vec3 vPosition = position;
    vec3 vcV = cross(orientation.xyz, vPosition);
    vPosition = vcV * (2.0 * orientation.w) + (cross(orientation.xyz, vcV) * 2.0 + vPosition);

    vColor = vec4(color * color2, 1.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(offset + vPosition, 1.0);
  }
`;

export const fragmentShader = `
  precision highp float;

  varying vec4 vColor;

  void main() {
    gl_FragColor = vColor;
  }
`;
