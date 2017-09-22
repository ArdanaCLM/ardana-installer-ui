/**
 * (c) Copyright 2015-2017 Hewlett Packard Enterprise Development LP
 * (c) Copyright 2017 SUSE LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */
'use strict';

module.exports = function(config) {
    config.set({
        preprocessors: {
            // Used to collect templates for preprocessing.
            // NOTE: the templates must also be listed in the files section below.
            './**/*.html': ['ng-html2js'],
            './app/**/!(*.spec).js': ['coverage']
        },

        // Sets up module to process templates.
        ngHtml2JsPreprocessor: {
            moduleName: 'templates'
        },

        // Contains both source and test files.
        files: [
            // bower:js
            'lib/jquery/dist/jquery.js',
            'lib/angular/angular.js',
            'lib/angular-bootstrap/ui-bootstrap-tpls.js',
            'lib/angular-route/angular-route.js',
            'lib/angular-sanitize/angular-sanitize.js',
            'lib/angular-translate/angular-translate.js',
            'lib/angular-translate-loader-partial/angular-translate-loader-partial.js',
            'lib/bootstrap-sass-official/assets/javascripts/bootstrap.js',
            'lib/angular-websocket/angular-websocket.min.js',
            'lib/lodash/lodash.js',
            'lib/ardana-ui-common/dist/ardana-ui-common.js',
            'lib/js-yaml/dist/js-yaml.js',
            'lib/papaparse/papaparse.js',
            'lib/md5-jkmyers/md5.min.js',
            'lib/angular-mocks/angular-mocks.js',
            // endbower

            // List any module files first
            'app/**/*.module.js',

            // List application files (core and installer)
            'app/**/!(*.module).js',

            // List Jasmine spec files
            'tests/**/*.mock.js',

            // List Jasmine spec files
            'tests/**/*.spec.js',

            // List templates
            'app/**/*.html',
            'tests/**/*.html'
        ],

        autoWatch: true,

        frameworks: ['jasmine'],

        browsers: ['PhantomJS'],

        phantomjsLauncher: {
            // Have phantomjs exit if a ResourceError is encountered
            // (useful if karma exits without killing phantom)
            exitOnResourceError: true
        },

        reporters: ['progress', 'coverage'],

        plugins: [
            'karma-phantomjs-launcher',
            'karma-jasmine',
            'karma-ng-html2js-preprocessor',
            'karma-coverage'
        ],

        coverageReporter: {
            dir: '../reports/client',
            reporters: ['html', 'json']
        }
    });
};
