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
var proxyquire = require('proxyquire');

describe('api', function() {
    var api, fs, mkdirParent, config;

    beforeEach(function() {
        var path = jasmine.createSpy('path');
        fs = require('fs');
        config = {
            LOGS_DIR: '/fake/log/dir',
            USER_MODEL_DIR: '/fake/user/dir',
            EXAMPLES_DIR: '/fake/examples/dir'
        };
        mkdirParent = jasmine.createSpy('mkdirParent');
        spyOn(fs, 'existsSync').andReturn(false);

        api = proxyquire('../app/services/api', {
            '../utils/mkdirParent': mkdirParent,
            'path': path
        });
    });

    describe('init', function() {
        it('should create any missing directories at paths given in config', function() {
            api.init(config);

            expect(mkdirParent).toHaveBeenCalledWith(config.LOGS_DIR);
            expect(mkdirParent).toHaveBeenCalledWith(config.USER_MODEL_DIR);
        });
    });

    describe('retrieveCloudTypes', function() {
        var response;
        beforeEach(function() {
            spyOn(fs, 'readdirSync').andReturn([]);
            api.init(config);
            response = {
                json: jasmine.createSpy('response.json')
            };
        });

        it('should read from the EXAMPLES_DIR', function() {
            api.retrieveCloudTypes({}, response);

            expect(fs.readdirSync).toHaveBeenCalledWith('/fake/examples/dir');
        });

        it('should respond with a 200 OK', function() {
            api.retrieveCloudTypes({}, response);
            expect(response.json).toHaveBeenCalled();
        });
    });
});
