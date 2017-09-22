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
    inject = require('gulp-inject'),
    angularFilesort = require('gulp-angular-filesort'),
    rename = require('gulp-rename'),
    fs = require('fs');

gulp.task('index', function() {
    return _index();
});

gulp.task('production', function() {
    return _index(true);
});

function _index(isProduction) {

    var template = isProduction ? './client/index.html.tmpl.production' : './client/index.html.tmpl';

    // Create the index.html from the template provided. Bower and app dependencies will be injected manually and not
    // via wiredep (to use min version if available, tech debt until we make dist folder).

    //TODO: This whole process needs improving. The production task should create a dist folder and move in
    //TODO: (cont.) concatenated and minify JS/CSS (plus fonts/etc). At lot of this can be swapped out for
    //TODO: (cont.) wiredep/concat/minify tasks

    // Discover bower JS + CSS
    var bowerDependencies = require('wiredep')();
    var depsCSS = bowerDependencies.css || [];
    var depsJsNonMin = bowerDependencies.js || [];

    // Switch bower deps JS file to .min (if provided). We should in future use bower main js, concat and minify to dist
    var depsJs;
    if (isProduction) {
        depsJs = [];
        for (var i = 0; i < depsJsNonMin.length; i++) {
            var file = depsJsNonMin[i];
            var newPath = file.replace(/.([^.]+)$/g, '.min.$1');
            try {
                fs.accessSync(newPath, fs.F_OK);
                depsJs.push(newPath);
            } catch (e) {
                depsJs.push(file);
            }
        }
    } else {
        depsJs = depsJsNonMin;
    }

    // Create the template, inject the dependencies
    var appJSSrc = gulp.src('./client/app/**/*.js').pipe(angularFilesort());
    var depsJSSrc = gulp.src(depsJs, {read: false});
    var depsCSS = gulp.src(depsCSS, {read: false});

    return gulp.src(template)
        .pipe(inject(appJSSrc, {relative: true, name: 'app'}))
        .pipe(inject(depsJSSrc, {relative: true, name: 'bower'}))
        .pipe(inject(depsCSS, {relative: true, name: 'bower'}))
        .pipe(rename({
            basename: 'index',
            extname: '.html'
        }))
        .pipe(gulp.dest('./client'));
}
