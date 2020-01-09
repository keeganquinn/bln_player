const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

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
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
