module.exports = {
  entry: './src/index.ts',
  output: {
    path: './gh-pages/js',
    publicPath: '/js/',
    filename: 'emitter3d.js',
    library: 'emitter3d'
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  }
};
