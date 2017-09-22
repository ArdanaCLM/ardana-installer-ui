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
 * Test report and misc test tasks
 **/

var gulp = require('gulp'),
    _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    tap = require('gulp-tap'),
    istanbul = require('gulp-istanbul'),
    combine = require('istanbul-combine'),
    runSequence = require('run-sequence').use(gulp);

var basepath = path.normalize(path.join(__dirname, '..'));

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
}

function replaceAll(target, search, replacement) {
    return target.replace(new RegExp(escapeRegExp(search), 'g'), replacement);
}

function makeRelative(k) {
    if (k.startsWith(basepath)) {
        // Remove the base directory from the start
        k = '.' + k.substr(basepath.length);
    } else if (k.startsWith('./app')) {
        k = './client' + k.substr(1);
    }
    return replaceAll(k, '\\', '/');
}

function fixPath(obj) {
    if (obj.path) {
        obj.path = makeRelative(obj.path);
    }
    return obj;
}

/*
gulp.task('gen-html', function() {

    var collector = new ist.Collector(),
        reporter = new ist.Reporter(null, './reports'),
        sync = true;

    collector.add(JSON.parse(fs.readFileSync('reports/coverage-final.json', 'utf8')));
    reporter.addAll(['text', 'lcov', 'html']);
    reporter.write(collector, sync, function() {
        console.log('All reports generated');
    });

});
*/

gulp.task('coverage-fix-paths', function() {
    return gulp.src('./reports/**/*.json')
        .pipe(tap(
            function(f) {
                var js = JSON.parse(f.contents);
                var obj = {};
                _.each(js, function(v, k) {
                    k = makeRelative(k);
                    obj[k] = fixPath(v);
                });
                f.contents = new Buffer(JSON.stringify(obj, null, 4));
            })
        )
        .pipe(gulp.dest('./tmp/reports/json'));
});

gulp.task('coverage-combine', ['coverage-fix-paths'], function() {
    var opts = {
        dir: 'reports/_combined',                       // output directory for combined report(s)
        pattern: 'tmp/reports/json/**/*.json',   // json reports to be combined
        print: 'summary',                      // print to the console (summary, detail, both, none)
        reporters: {
            html: {},
        }
    };
    combine.sync(opts);
});

// Our custom report style
gulp.task('coverage-custom-report-style', function() {
    return gulp.src('e2e/report/*')
        .pipe(gulp.dest('./reports/_combined'));
});


// Run karma unit and protractor e2e tests and combine the results into a single coverage report
gulp.task('client-all', function(cb) {
    runSequence('karma-run-no-fail', 'client-e2e', 'coverage-combine', 'coverage-custom-report-style', cb);
});
