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
(function() {
    'use strict';

    describe('underscore Module', function() {
        var $window, underscoreService;

        beforeEach(module('underscore'));

        beforeEach(inject(function($injector) {
            $window = $injector.get('$window');
            underscoreService = $injector.get('_');
        }));

        it('should have underscore', function() {
            expect(underscoreService).toBeDefined();
        });

        it('should have underscore', function() {
            expect($window._).toBeDefined();
        });
    });

    describe('md5 Module', function() {
        var $window, md5Service;

        beforeEach(inject(function($injector) {
            $window = $injector.get('$window');
        }));

        it('should have md5', function() {
            expect($window.md5).toBeDefined();
        });
    });

})();
