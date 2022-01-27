const isProduction = process.env.NODE_ENV == 'production';

module.exports = {
  mode: 'production',
  entry: __dirname + '/src/index.tsx',
  output: {
    path: __dirname + '/dist',
    publicPath: '/emitter3d',
    filename: 'emitter3d.js',
    library: 'emitter3d',
  },
  module: {
    rules: [{ test: /\.tsx?$/, loader: 'ts-loader' }],
  },
  resolve: {
    extensions: ['*', '.js', '.ts', '.tsx'],
  },
  devtool: isProduction ? false : 'source-map',
  devServer: {
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    },
    static: {
      directory: __dirname + '/dist',
      publicPath: '/emitter3d',
    },
  },
};
