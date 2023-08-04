const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = {
  entry: {
    "content-bundle": './src/content-bundle.js',
    background: './src/background.js',
    popup: './src/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  devtool: 'cheap-module-source-map',
  plugins: [
    new WebpackObfuscator({
      rotateStringArray: true
    }, ['excluded_bundle_name.js'])
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