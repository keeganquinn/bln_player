const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    main: './src/index.js',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: path.join('[name]', 'index.js'),
    library: 'bln_player',
    libraryTarget: 'umd',
  },
};
