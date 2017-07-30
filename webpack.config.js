const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const appTitle = 'concurrent-panes';

module.exports = {
  entry: './src/client/index.tsx',
  output: {
    filename: 'client.js',
    path: __dirname + '/dist'
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: 'source-map',

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.json']
  },


  plugins: [
    new HtmlWebpackPlugin({
      title: 'concurrent-panes',
      filename: 'dist/index.html'
    })
  ],

  module: {

    rules: [
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },

      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      { test: /\.tsx?$/, loader: 'awesome-typescript-loader' },

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' }
    ]
  }
};
