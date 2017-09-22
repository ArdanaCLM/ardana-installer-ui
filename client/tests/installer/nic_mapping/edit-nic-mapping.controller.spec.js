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

    describe('EditNicMappingController', function() {
        var $scope, $modalInstance, ctrl;

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
            $scope = $injector.get('$rootScope').$new();
            var $controller = $injector.get('$controller');

            var data = {
                name: 'NIC map',
                _numPorts: 2,
                'physical-ports': [
                    {'logical-name': 'eth0', 'bus-address': 'bus0'},
                    {'logical-name': 'eth1', 'bus-address': 'bus1'}
                ]
            };
            var nicMaps = [
                {name: 'map1'},
                {name: 'map2'},
                {name: 'map3'}
            ];
            var server = {role: 'controller', _ports: ['eth0', 'eth1']};
            var title = 'title';
            $modalInstance = {
                close: function(data) {
                },
                dismiss: function(reason) {
                }
            };

            ctrl = $controller('EditNicMappingController', {
                $scope: $scope,
                $modalInstance: $modalInstance,
                data: data,
                title: title,
                server: server,
                nicMaps: nicMaps
            });

            $scope.$apply();

            spyOn($modalInstance, 'close').and.callThrough();
            spyOn($modalInstance, 'dismiss').and.callThrough();
        }));

        it('should have data defined', function() {
            expect($scope.nicMap).toBeDefined();
            expect($scope.nicMap.name).toBeDefined();
            expect($scope.nicMap['physical-ports']).toBeDefined();
            expect($scope.nicMap._numPorts).toBeDefined(2);
        });

        it('should have title defined', function() {
            expect($scope.title).toBeDefined();
        });

        it('should have server defined', function() {
            expect($scope.server).toBeDefined();
        });

        it('should call $modalInstance.close with data if update called', function() {
            $scope.update();
            expect($modalInstance.close).toHaveBeenCalled();
        });

        it('should call $modalInstance.dismiss with "cancel" if cancel called', function() {
            $scope.cancel();
            expect($modalInstance.dismiss).toHaveBeenCalledWith('cancel');
        });
    });
})();
