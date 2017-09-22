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

var MOCK_API_PATH = 'dayzeroapi/mock-api';

var needle = require('needle');
var protractor = require('protractor');
var config = require('../e2e.conf');

// Make request to Mock API back-end to configure it
function doRequest(method, data) {
    browser.controlFlow().execute(function() {
        var deferred = protractor.promise.defer();
        var url = config.UI_HOST + MOCK_API_PATH;
        var options = { json: true };
        needle.request(method, url, data, options, function(err, resp) {
            if (err) {
                console.log('ERROR: ' + method);
                deferred.reject(err);
            } else {
                console.log('OK: ' + method);
                console.log(data);
                deferred.fulfill(resp);
            }
        });
        return (deferred.promise);
    });
};

function set(data) {
    doRequest('post', data);
}

function reset() {
    doRequest('delete', null);
}

module.exports = {
    set: set,
    reset: reset
};
