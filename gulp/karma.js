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
var gulp = require('gulp'),
    wiredep = require('wiredep').stream,
    Server = require('karma').Server,
    path = require('path');

gulp.task('client-karma', ['karma-conf-inject', 'karma-run']);

var karmaConfigDir = path.join(__dirname, '../client');

gulp.task('karma-conf-inject', function(done) {
    return gulp.src(path.join(karmaConfigDir, 'karma.conf.js'))
        .pipe(wiredep({ devDependencies: true }))
        .pipe(gulp.dest(karmaConfigDir), done);
});

// Ensure inject executes before run (would be good to make this optional)
gulp.task('karma-run', ['karma-conf-inject'], function(done) {
    new Server({
        configFile: path.join(karmaConfigDir, 'karma.conf.js'),
        singleRun: true
    }, done).start();
});


// Run Karma and swallow error - allows other tasks to continue to run afterwarrds
gulp.task('karma-run-no-fail', ['karma-conf-inject'], function(done) {
    var conf = {
        configFile: path.join(karmaConfigDir, 'karma.conf.js'),
        singleRun: true
    };
    Server.start(conf, function() {
        done();
    });
});
