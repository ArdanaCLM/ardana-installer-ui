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
var waitPlugin = require('./e2e/plugins/waitPlugin');
var istanbul = require('istanbul');
var _  = require('lodash');
var collector = new istanbul.Collector();
var protractor = require('protractor');
var q = protractor.promise;

exports.config = {
    specs: ['e2e/*.spec.js'],
    directConnect: true,
    framework: 'jasmine2',
    jasmineNodeOpts: {
        defaultTimeoutInterval: 10 * 60 * 1000,
        // Remove the default 'dot' reporter
        print: function() {}
    },
    plugins: [{path: './e2e/plugins/waitPlugin.js'}],
    onPrepare: function() {
        var SpecReporter = require('jasmine-spec-reporter');
        // add jasmine spec reporter
        jasmine.getEnv().addReporter(new SpecReporter(
            {
                displayStacktrace: 'none',
                prefixes: {
                    success: '[PASS] ',
                    failure: '[FAIL] ',
                    pending: '[****] '
                }
            }
        ));

        jasmine.getEnv().addReporter(new function() {
            var deferred = [];
            var results = [];

            this.specStarted = function(spec) {
                //console.log('Spec Start   : ' + spec.id + ':: ' + spec.fullName);
            };
            this.specDone = function(spec) {
                //console.log('Spec Finished: ' + spec.id + ':: ' + spec.fullName);
                if (spec.status !== 'failed' && spec.status !== 'disabled') {
                    deferred.push(browser.driver
                        .executeScript('if (typeof(__coverage__)!=="undefined") return __coverage__;')
                        .then(function(coverageResults) {
                            if (coverageResults) {
                                console.log('Spec Coverage: ' + spec.id + ':: ' + spec.fullName);
                                results.push(coverageResults);
                                //collector.add(coverageResults)
                            } else {
                                console.log('Could not retrieve code coverage metadata - code may not be instrumented');
                            }
                        })
                    );
                }
            };
            this.jasmineDone = function() {
                console.log('Tests finished - collecting coverage metadata');
                q.all(deferred).then(function() {
                    console.log('Writing coverage report');
                    _.each(results, function(r) {
                        collector.add(r);
                    });
                    istanbul.Report.create('cobertura', {dir: 'reports/e2e/cobertura'})
                        .writeReport(collector, true);
                    istanbul.Report.create('lcov', {dir: 'reports/e2e/lcov'})
                        .writeReport(collector, true);
                    istanbul.Report.create('json', {dir: 'reports/e2e/json'})
                        .writeReport(collector, true);
                    waitPlugin.resolve();
                });
            };
        });
    }
    /*,
    onComplete: function() {
        console.log('FINISHED');
        istanbul.Report.create('cobertura', {dir: 'reports/e2e/cobertura'})
            .writeReport(collector, true);
        istanbul.Report.create('lcov', {dir: 'reports/e2e/lcov'})
            .writeReport(collector, true);
        istanbul.Report.create('json', {dir: 'reports/e2e/json'})
            .writeReport(collector, true);
        waitPlugin.resolve();
    }
    */
}
