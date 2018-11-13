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
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {

  const productionMode = (argv.mode === 'production');
  const devMode = ! productionMode;

  let config = {
    entry: [
      '@babel/polyfill',
      'whatwg-fetch',
      './index.js'
    ],
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.js'
    },
    plugins: [
      // Generates index.html automatically with the given parameters,
      // automatically populating with a link to the script generated in the
      // output filename defined a couple lines above. The
      new HtmlWebpackPlugin({
        title: 'SUSE Openstack Cloud',
        favicon: 'src/images/favicon.ico',
        meta: {
          viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no',
          'theme-color': '#000000'
        },
        hash: true,   // avoid loading stale versions from cache
      }),

      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
      }),

      new webpack.DefinePlugin({'PRODUCTION': JSON.stringify(productionMode)})
    ],

    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
          query: {
            cacheDirectory: true,
            presets: [['@babel/preset-env', {
              // Using https://www.npmjs.com/package/@babel/preset-env, determine
              // which features need to be transpiled based on the browsers we
              // need to support.
              'targets': {
                'browsers': [
                  'last 2 versions'
                ]}}],

            // Handle React, especially JSX
            '@babel/preset-react'
            ]
          }
        },
        {
          test: /\.(c|le)ss$/,
          use: [
            // In development the css will be packaged into the index.js bundle and
            // served up with hot reloading.  In production the css will be provided in
            // a separate file and automatically linked into the generated html (via the
            // HtmlWebPack plugin).  This logic was taken directly from the documentation
            // for the MiniCssExtractPlugin: https://github.com/webpack-contrib/mini-css-extract-plugin
            { loader: devMode ? 'style-loader' : MiniCssExtractPlugin.loader },
            { loader: 'css-loader',       // Treat url() in css as an import
              options: { sourceMap: devMode }},
            { loader: 'less-loader',      // Compile less to CSS
              options: { sourceMap: devMode }},
          ]
        },
        {
          test: /favicon.ico/,
          loaders: 'file-loader',
          options: {
            name: '[name].[ext]' // retain original filename
          }
        },
        {
          test: /\.(jpe?g|png|gif|svg)$/i,
          loaders: 'url-loader',
          options: {
            name: '[name].[ext]', // retain original filename
            outputPath: 'images',
            limit: 8192           // files smaller that this will be imbedded into the bundled js
          }
        },
        {
          test: /\.(svg|eot|ttf|woff|woff2)$/,
          loader: 'file-loader',
          options: {
            name: '[name].[ext]', // retain original filename
            outputPath: 'fonts'
          }
        }
      ]
    }
  };

  // Create a source map in development mode
  if (argv.mode === 'development') {
    config.devtool = 'cheap-module-source-map';
  }

  // Populate global variables that are available to the running application
  config.plugins.push(
    new webpack.DefinePlugin({
      'PRODUCTION': JSON.stringify(argv.mode === 'production')
    })
  );

  return config;
};
