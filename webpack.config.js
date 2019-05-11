module.exports = {
  mode: 'production',
  entry: __dirname + '/src/main.tsx',
  output: {
    path: __dirname + '/gh-pages/js',
    publicPath: '/js/',
    filename: 'emitter3d.js',
    library: 'emitter3d'
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.ts', '.tsx']
  },
};
