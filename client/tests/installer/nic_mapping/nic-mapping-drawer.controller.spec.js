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

    describe('NicMappingDrawerController', function() {
        var $q, $scope, dataMock, $modal, ctrl, deferred;

        beforeEach(module('dayzero'));
        beforeEach(module('dayzero.mock'));
        beforeEach(module('dayzero.installer'));

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
            $q = $injector.get('$q');
            $scope = $injector.get('$rootScope').$new();
            var $controller = $injector.get('$controller');
            dataMock = $injector.get('DataMock');
            $modal = $injector.get('$modal');

            deferred = $q.defer();
            var fakeModal = {
                result: deferred.promise
            };

            var nicMaps = [
                {name: 'foo', 'physical-ports': []},
                {name: 'bar', 'physical-ports': []}
            ];

            $scope.this_data = nicMaps;
            $scope.config = {
                table: {
                    getEditModalConfig: function() {
                        var modalConfig = {
                            template: 'test',
                            resolve: {
                                data: function() {
                                    return {};
                                },
                                title: function() {
                                    return 'title';
                                },
                                server: function() {
                                    return null;
                                },
                                nicMaps: function() {
                                    return nicMaps;
                                }
                            }
                        };

                        return modalConfig;
                    }
                }
            };

            ctrl = $controller('NicMappingDrawerController', {
                'app.basePath': '',
                $scope: $scope,
                $modal: $modal
            });

            spyOn($modal, 'open').and.returnValue(fakeModal);
        }));

        describe('Configure NIC mapping', function() {
            it('should have called $modal.open if editNicMap called', function() {
                ctrl.editNicMap();
                expect($modal.open).toHaveBeenCalled();
            });

            it('should have added another entry to table if editNicMap called with no params', function() {
                ctrl.editNicMap();
                deferred.resolve({name: 'test'});
                $scope.$apply();
                expect($scope.this_data.length).toBe(3);
            });

            it('should have update first table row if editNicMap called with table row data', function() {
                ctrl.editNicMap($scope.this_data[0]);
                deferred.resolve({
                    name: 'test',
                    'physical-ports': [{'logical-name': 'eth0', 'bus-address': 'bus1', 'type': 'simple-port'}]
                });

                $scope.$apply();

                var port = {
                    'logical-name': 'eth0',
                    'bus-address': 'bus1',
                    'type': 'simple-port'
                };
                expect($scope.this_data.length).toBe(2);
                expect($scope.this_data[0].name).toBe('test');
                expect($scope.this_data[0]['physical-ports'][0]).toEqual(port);
            });

            it('should have update table row data with no physical ports if bus address empty', function() {
                ctrl.editNicMap($scope.this_data[0]);
                deferred.resolve({name: 'test', 'physical-ports': []});

                $scope.$apply();

                expect($scope.this_data.length).toBe(2);
                expect($scope.this_data[0].name).toBe('test');
                expect($scope.this_data[0]['physical-ports']).toEqual([]);
            });
        });
    });
})();
