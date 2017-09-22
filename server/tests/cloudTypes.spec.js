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
var request = require('supertest');

describe('Cloud Types', function() {
    var server;
    var apiPath = '/dayzeroapi/';

    beforeEach(function() {
        // This path follows the convention in go.sh
        process.env.HOME = __dirname + '/../../../';
        server = require('../server');
    });

    afterEach(function() {
        server.close();
    });

    it('should return cloud types', function(done) {
        request(server)
            .get(apiPath + 'cloudTypes')
            .expect(function(res) {
                expect(res.body.cloudTypes).toBeDefined();
                expect(res.body.cloudTypes.length).toBeGreaterThan(0);
                res.body.cloudTypes.forEach(function(cloudType) {
                    expect(cloudType.name).toBeDefined();
                    expect(cloudType.overview).toBeDefined();
                    expect(cloudType.folder).toBeDefined();
                })
            })
            .expect(200, done);
    });
});
