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

    describe('InstallOsController', function() {
        var ctrl;

        beforeEach(module('dayzero', function($provide, $translateProvider) {
            $provide.factory('customLoader', function($q) {
                return function() {
                    var deferred = $q.defer();
                    deferred.resolve({});
                    return deferred.promise;
                };
            });

            $translateProvider.useLoader('customLoader');
        }));

        beforeEach(module('dayzero.installer'));

        beforeEach(inject(function($injector) {
            var $controller = $injector.get('$controller');
            ctrl = $controller('InstallOsController', {
                'app.basePath': '',
                $translatePartialLoader: $injector.get('$translatePartialLoader'),
                $translate: $injector.get('$translate')
            });
        }));

        it('should be defined and data should be defined', function() {
            expect(ctrl).toBeDefined();
            expect(ctrl.installOsOptions).toBeDefined();
        });
    });
})();
