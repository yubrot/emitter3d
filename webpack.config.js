module.exports = {
  mode: 'production',
  entry: __dirname + '/src/index.tsx',
  output: {
    path: __dirname + '/dist',
    publicPath: '/emitter3d',
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
  devServer: {
    contentBase: __dirname + '/dist',
    contentBasePublicPath: '/emitter3d'
  },
};
