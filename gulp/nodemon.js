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
    nodemon = require('gulp-nodemon');

gulp.task('nodemon', function() {
    nodemon({
        script: 'server/server.js',
        ext: 'js yml',
        watch: [
            'node_modules/ardana-service/api',
            'node_modules/ardana-service/config',
            'node_modules/ardana-service/lib',
            'config.yml'
        ],
        legacyWatch: true,
        ignoreRoot: ['.git'],
        env: {env: 'development'}
    });
});
