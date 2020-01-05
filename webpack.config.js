const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'production',
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
  plugins: [new HtmlWebpackPlugin({ chunks: ['example'] })],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['css-loader'],
      },
    ],
  },
};
