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
    vec3 vPosition = position + cross(orientation.xyz, cross(orientation.xyz, position) + orientation.w * position) * 2.0;

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
