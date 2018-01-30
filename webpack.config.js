// (c) Copyright 2017-2018 SUSE LLC
/**
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
**/
/* eslint no-unused-vars: 0 */
var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: [
    'react-hot-loader/patch',
    './index.js'
  ],
  output: {
    filename: 'dist/index.js'
  },
  devtool: 'cheap-module-source-map',
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'react-hot-loader/webpack'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /(node_modules|server.js)/,
        query: {
          cacheDirectory: true,
          presets: [['env', {
            // Using https://www.npmjs.com/package/babel-preset-env, determine
            // which features need to be transpiled based on the browsers we
            // need to support.
            'targets': {
              'browsers': [
                'last 2 Chrome versions',
                'last 2 Firefox versions',
                'last 2 Edge versions',
                'IE 11'
              ]}}],

          // Handle React, especially JSX
          'react',

          // Permit using arrow functions as class properties.
          // See https://babeljs.io/docs/plugins/preset-stage-2 for more
          'stage-2'
          ]
        }
      },
      {
        test: /\.css$/,
        loader: 'style-loader'
      },
      {
        test: /\.css$/,
        loader: 'css-loader'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: 'url-loader'
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        loader: 'file-loader?name=lib/fonts/[name].[ext]'
      }
    ]
  }
};
