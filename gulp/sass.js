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
    sass = require('gulp-sass'),
    browserSync = require('browser-sync').create();

gulp.task('sass', function() {
    return gulp.src('./client/app/app.scss')
        .pipe(sass())
        .pipe(gulp.dest('./client/app/'))
        .pipe(browserSync.stream());
});

gulp.task('watch', ['nodemon'], function() {

    browserSync.use({
        plugin: function() { /* noop */
        },
        hooks: {
            'client:js': require('fs').readFileSync('./gulp/plugins/reloader.js', 'utf-8') // Link to your file
        }
    });

    browserSync.init({
        open: false,
        browser: ['chrome'],
        proxy: 'http://localhost:3000',
        port: 3001,
        ws: true,
        ghostMode: false
    });

    gulp.watch('client/app/scss/*.*', ['sass']);
    gulp.watch('client/**/*.html').on('change', browserSync.reload);
});
