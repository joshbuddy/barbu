'use strict';

const path = require('path');
const webpack = require('webpack');
const appName = 'app';
const outputFile = 'index.js';

const config = {
  entry: './src/index.js',
  devtool: 'source-map',
  output: {
    path: __dirname + '/public',
    filename: outputFile,
    publicPath: '/'
  },
  module: {
    loaders: [
      {
        loader: "babel-loader",
        exclude: /(node_modules|bower_components)/,
        test: /\.jsx?$/,
        query: {
          plugins: ['transform-runtime'],
          presets: ['es2015', 'stage-0', 'react'],
        }
      },
    ],
    plugins: [
      new webpack.optimize.OccurrenceOrderPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoErrorsPlugin()
    ]
  }
};

module.exports = config;
