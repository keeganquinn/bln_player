const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    example: './src/example.js',
    main: './src/index.js',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    library: 'bln_player',
    libraryTarget: 'umd',
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['example'],
      title: 'bln_player',
    }),
    new HtmlWebpackTagsPlugin({
      tags: ['style.css'],
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    }),
  ],
};
