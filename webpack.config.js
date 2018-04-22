module.exports = {
  mode: 'production',
  entry: __dirname + '/src/index.ts',
  output: {
    path: __dirname + '/gh-pages/js',
    publicPath: '/js/',
    filename: 'emitter3d.js',
    library: 'emitter3d'
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  },
  externals: {
    'three': 'THREE',
    'dat.gui': 'dat',
    'stats.js': 'Stats',
  },
};
