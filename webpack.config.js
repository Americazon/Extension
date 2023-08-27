const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin')

const isProd = process.env.NODE_ENV === "production"

module.exports = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
            configFile: 'tsconfig.json',
        },
      },
      {
          test: /\.wasm$/,
          loader: 'wasm-loader'
      },
    ]
  },
  entry: {
    "content-bundle": './src/content-bundle.js',
    background: './src/background.js',
    popup: './src/popup.js',
    utils: './src/utils.js',
    "helloworld_demo": './wasm/pkg/helloworld_demo.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  devtool: 'cheap-module-source-map',
  plugins: [
    // ...((isProd) ? new WebpackObfuscator({
    //   rotateStringArray: true
    // }, ['excluded_bundle_name.js']) : {}),
    // new WasmPackPlugin({
    //   crateDirectory: path.resolve(__dirname, 'wasm')
    // })
  ],
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