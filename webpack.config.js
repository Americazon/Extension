const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: {
    "content-bundle": './src/content-bundle.js',
    background: './src/background.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  devtool: 'cheap-module-source-map',
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true
  },
  resolve: {
    fallback: { 
      path: require.resolve("path-browserify"),
      util: require.resolve("util"),
      fs: false,
      process: require.resolve("process")
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.wasm$/,
        type: 'javascript/auto',
        loader: 'wasm-loader',
        options: {
          export: 'instance'
        }
      },
    ]
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        minify: TerserPlugin.swcMinify,
        terserOptions: {
          compress: true
        }
      })
    ] 
  }
};