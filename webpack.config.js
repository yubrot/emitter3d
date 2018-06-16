module.exports = {
  mode: 'production',
  entry: __dirname + '/src/emitter3d.ts',
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
  resolve: {
    extensions: ['*', '.js', '.ts']
  },
  externals: {
    'three': 'THREE',
    'dat.gui': 'dat',
    'stats.js': 'Stats',
  },
};
