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

var request = require('supertest');
var apiTestHelper = require('./utils/test.helper');

describe('Config endpoint', function() {
    var server, mockApi;
    var apiPath = '/dayzeroapi/';

    beforeEach(function() {
        // This path follows the convention in go.sh
        process.env.HOME = __dirname + '/../../../';
        var stub = apiTestHelper.stubApi();
        mockApi = stub.mockApi;
        server = stub.server;
    });

    afterEach(function() {
        server.close();
        apiTestHelper.resetCache();
    });

    it('should return the requested cloud configuration', function(done) {
        var cloudName = 'entry-scale-with-vsa';

        request(server)
            .get(apiPath + 'config?cloud=' + cloudName)
            .expect(function(response) {
                expect(mockApi.cloudConfigCallback).toHaveBeenCalled();
            })
            .end(done);
    });
});
