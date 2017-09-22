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

    describe('ardanaDeployer Service', function() {
        var $scope, $httpBackend, $interval, service;
        var apiPath = '/dayzeroapi/';

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

        beforeEach(inject(function($injector) {
            $scope = $injector.get('$rootScope').$new();
            $httpBackend = $injector.get('$httpBackend');
            $interval = $injector.get('$interval');
            service = $injector.get('ardanaDeployer');
        }));

        it('should be defined', function() {
            expect(service).toBeDefined();
        });

        describe('API calls', function() {
            it('should called installOs', function() {
                $httpBackend
                    .when('POST', apiPath + 'osinstall')
                    .respond('success');

                service.installOs().then(function(response) {
                    expect(response.data).toBe('success');
                });

                $httpBackend.flush();
            });


            it('should commit ', function() {

                $httpBackend
                    .when('POST', apiPath + 'model/commit')
                    .respond('success');

                service.commitConfig().then(function(response) {
                    expect(response.data).toBe('success');
                });

                $httpBackend.flush();

            });

            it('should handle commit failure', function() {

                $httpBackend
                    .when('POST', apiPath + 'model/commit')
                    .respond(500);

                service.commitConfig().then(function(response) {
                    fail('Expecting a failed promise');
                });

                $httpBackend.flush();

            });

            it('should handle commit failure (no changes)', function() {

                $httpBackend
                    .when('POST', apiPath + 'model/commit')
                    .respond(500, {
                        errorCode: 1
                    });

                service.commitConfig().then(function(response) {
                    expect(_.isEqual(response, {})).toBe(true);
                });

                $httpBackend.flush();

            });

        });

        describe('installOs function', function() {
            beforeEach(function() {
                $httpBackend
                    .when('POST', apiPath + 'osinstall')
                    .respond('ok');
            });

            afterEach(function() {
                $httpBackend.flush();
                $interval.flush(5000);
                $httpBackend.flush();
            });

            describe('on error', function() {
                it('should reject', function() {
                    $interval.flush(5000);
                    $httpBackend
                        .when('GET', apiPath + 'osinstall')
                        .respond({servers: ['server1', 'server2'], finished: true, hasError: true});

                    service.installOs().then(angular.noop, function(response) {
                        expect(response).toEqual({serverStatuses: ['server1', 'server2']});
                    });
                });

                it('should reject', function() {
                    $httpBackend
                        .when('GET', apiPath + 'osinstall')
                        .respond({servers: ['server1', 'server2'], finished: true, stderr: 'error'});

                    service.installOs().then(angular.noop, function(response) {
                        expect(response).toEqual({serverStatuses: ['server1', 'server2']});
                    });
                });
            });

            describe('on no error', function() {
                it('should notify with server statuses if not finished', function() {
                    $httpBackend
                        .when('GET', apiPath + 'osinstall')
                        .respond({servers: ['server1', 'server2'], finished: false});

                    service.installOs().then(
                        angular.noop,
                        angular.noop,
                        function(response) {
                            expect(response).toEqual({serverStatuses: ['server1', 'server2']});
                        }
                    );
                });

                it('should resolve with server statuses if finished', function() {
                    $httpBackend
                        .when('GET', apiPath + 'osinstall')
                        .respond({servers: ['server1', 'server2'], finished: true});

                    service.installOs().then(function(response) {
                        expect(response).toEqual({serverStatuses: ['server1', 'server2']});
                    });
                });

                it('should clean config', function() {
                    $httpBackend
                        .when('GET', apiPath + 'osinstall')
                        .respond({servers: ['server1', 'server2'], finished: false});

                    service.installOs({
                        servers: [
                            {
                                id: 'server1',
                                'server-group': null
                            },
                            {
                                id: 'server2',
                                'server-group': 'a'
                            }
                        ]


                    }).then(
                        angular.noop,
                        angular.noop,
                        function(response) {
                            expect(response).toEqual({serverStatuses: ['server1', 'server2']});
                        }
                    );
                });
            });
        });

    });

})();
