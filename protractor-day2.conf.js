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
var HtmlReporter = require('protractor-beautiful-reporter');

exports.config = {
  //specs: ['./test/**/*.spec.js'],
  suites: {
   clm_admin_console_service: './test/e2e/suites/day2/clm_admin_console_services/*.spec.js',
  },

  capabilities: {
    browserName: 'chrome',

    // allows different specs to run in parallel.
    // If this is set to be true, specs will be sharded by file
    // (i.e. all files to be run by this set of capabilities will run in parallel).
    // Default is false.
    shardTestFiles: true,

    // Maximum number of browser instances that can run in parallel for this
    // set of capabilities. This is only needed if shardTestFiles is true.
    // Default is 1.
    maxInstances: 1,
   },

 // Options to be passed to Jasmine-node
 jasmineNodeOpts: {
    showColors: true, // Use colors in the command line report.
    defaultTimeoutInterval: 100000, // set timeout for async calls
  },

  baseUrl: 'http://localhost:2209',
  framework: 'jasmine',

  onPrepare: function() {
    browser.ignoreSynchronization = true;

    // Add a screenshot reporter and store screenshots to `/tmp/screenshots`:
    jasmine.getEnv().addReporter(new HtmlReporter({
        baseDirectory: 'tmp/screenshots'
    }).getJasmine2Reporter());
  }
};
