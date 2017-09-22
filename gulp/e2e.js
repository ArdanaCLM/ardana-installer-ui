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
/**
 * Tasks to run the end-to-end (e2e) selenium/protractor tests
 **/

var gulp = require('gulp'),
    fs = require('fs'),
    _ = require('lodash'),
    path = require('path'),
    del = require('del'),
    fork = require('child_process').fork,
    spawn = require('child_process').spawn,
    istanbul = require('gulp-istanbul'),
    vfs = require('vinyl-fs');

var server = null;

gulp.task('e2e-clean', ['index', 'sass'], function() {
    return del(['./tmp/e2e-client', './reports/e2e']);
});

gulp.task('e2e-instrumentjs-prep', ['e2e-clean'], function() {
    // In the dev world we 'bower link' some dependencies (i.e. ardana-ui-common). gulp.src fails to process these
    // (see http://stackoverflow.com/questions/28079374/gulp-giving-error-on-symlinks-in-gulp-src/28115830#28115830)
    // So instead of standard node-glob use vinyls-fs with relevant options
    return vfs.src('./client/**/*', { followSymlinks: true, follow: true })
        .pipe(vfs.dest('./tmp/e2e-client'));
});

gulp.task('e2e-instrumentjs', ['e2e-instrumentjs-prep'], function() {
    return gulp.src('./client/app/**/*.js')
        .pipe(istanbul({
            instrumentation: {
                'include-all-sources': true,
                variable: '__coverage__'
            },
            includeUntested: true,
            coverageVariable: '__coverage__'
        }))
        .pipe(gulp.dest('./tmp/e2e-client/app'));
});

gulp.task('e2e-start-server', ['e2e-instrumentjs'], function() {
    var logFile = fs.openSync('./tmp/e2e-server.log', 'w');
    var options = {};
    options.stdio = ['pipe', logFile, logFile];
    options.env = _.clone(process.env);
    options.env.NODE_ENV = 'development';
    options.env.client_folder = 'tmp/e2e-client';
    var configFileArg = '--config=' + path.join(__dirname, '../e2e/config/test-config.yml');

    // Can't use fork as we want to redirect the log to a file
    //TODO: Detect if another server is already running on default port
    server = spawn('node', ['server/server.js', configFileArg], options);
});

gulp.task('e2e-tests', ['e2e-start-server'], function(cb) {
    // Use the protractor in out node_modules folder
    var cmd = './node_modules/protractor/lib/cli.js';
    var options = {};
    options.env = _.clone(process.env);
    options.env.NODE_ENV = 'development';
    var c = fork(cmd,
        // You can add a spec file if you just want to run one set of test specs
        //['./protractor.conf.js', '--specs=./e2e/section_cloud_needs.spec.js'],
        //['./protractor.conf.js', '--specs=./e2e/section_deploy.spec.js'],
        //['./protractor.conf.js', '--specs=./e2e/section_get_started.spec.js'],
        //['./protractor.conf.js', '--specs=./e2e/section_identify_servers.spec.js'],
        //['./protractor.conf.js', '--specs=./e2e/section_install_os.spec.js'],
        //['./protractor.conf.js', '--specs=./e2e/section_network_grps.spec.js'],
        //['./protractor.conf.js', '--specs=./e2e/section_nic_mapping.spec.js'],
        //['./protractor.conf.js', '--specs=./e2e/section_server_assocs.spec.js'],
        //['./protractor.conf.js', '--specs=./e2e/subflow_continuations.spec.js'],
        //['./protractor.conf.js', '--specs=./e2e/subflow_device_groups.spec.js'],
        //['./protractor.conf.js', '--specs=./e2e/subflow_import_servers.spec.js'],
        //['./protractor.conf.js', '--specs=./e2e/subflow_interfaces_and_networks.spec.js'],
        //['./protractor.conf.js', '--specs=./e2e/subflow_nic_and_nameservers.spec.js'],
        //['./protractor.conf.js', '--specs=./e2e/subflow_volume_groups.spec.js'],
        ['./protractor.conf.js'],
        options);
    c.on('close', function() {
        cb();
    });
});

gulp.task('e2e-model-tests', ['e2e-start-server'], function(cb) {
    // Use the protractor in out node_modules folder
    var cmd = './node_modules/protractor/lib/cli.js';
    var options = {};
    options.env = _.clone(process.env);
    options.env.NODE_ENV = 'development';
    var c = fork(cmd,
        ['./protractor.conf.js', '--specs=./e2e/model_validation/section_model_tests.spec.js'],
        options);
    c.on('close', function() {
       cb();
    });
});

gulp.task('client-e2e', ['e2e-tests'], function() {
    if (server) {
        server.kill();
    }
});

gulp.task('model-tests', ['e2e-model-tests'], function() {
    if (server) {
        server.kill();
    }
});
