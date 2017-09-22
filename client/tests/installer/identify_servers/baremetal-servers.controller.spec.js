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

    describe('BaremetalServersController', function() {
        var $scope, dataMock, DrawerService, ctrl;

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
            dataMock = $injector.get('DataMock');
            DrawerService = $injector.get('DrawerService');
        }));

        describe('baremetalConfig is defined', function() {
            beforeEach(inject(function($injector) {
                var $controller = $injector.get('$controller');

                ctrl = $controller('BaremetalServersController', {
                    'app.basePath': '',
                    '$scope': $scope,
                    ardanaInstallationData: dataMock,
                    DrawerService: DrawerService
                });

                spyOn(DrawerService, 'open').and.callThrough();
                spyOn(dataMock, 'dataChanged').and.callThrough();
            }));

            it('should be defined and data should be defined', function() {
                expect(ctrl).toBeDefined();
                expect(ctrl.data).toBeDefined();
                expect(ctrl.config).toBeDefined();
                expect(ctrl.detailTemplate).toBeDefined();
                expect(ctrl.tableHeaders).toBeDefined();
                expect(ctrl.bm_network_edited).toBe(true);
            });

            it('should set baremetal_servers to empty array if not defined', function() {
                expect(ctrl.data.baremetalConfig.baremetal_servers.length).toBe(7);

                dataMock.data.servers = undefined;
                $scope.$broadcast('ardanaInstallationData.update');

                expect(ctrl.data.baremetalConfig.baremetal_servers).toEqual([]);
            });

            describe('addBmServerWithDrawer', function() {
                it('should call the DrawerService', function() {
                    ctrl.addBmServerWithDrawer();
                    expect(DrawerService.open).toHaveBeenCalled();
                });

                it('should add new server when drawer resolves', function() {
                    ctrl.addBmServerWithDrawer();
                    DrawerService.resolve({node_name: 'test'});

                    $scope.$apply();

                    expect(ctrl.data.baremetalConfig.baremetal_servers.length).toBe(8);
                });

                it('should add new server when on drawer notifies', function() {
                    ctrl.addBmServerWithDrawer();
                    DrawerService.notify({node_name: 'test'});

                    $scope.$apply();

                    expect(ctrl.data.baremetalConfig.baremetal_servers.length).toBe(8);
                });
            });

            describe('editBmNetworkWithDrawer', function() {
                it('should call the DrawerService', function() {
                    ctrl.editBmNetworkWithDrawer();
                    expect(DrawerService.open).toHaveBeenCalled();
                });

                it('should set network when drawer resolves', function() {
                    ctrl.editBmNetworkWithDrawer();
                    DrawerService.resolve({name: 'test'});

                    $scope.$apply();

                    expect(ctrl.data.baremetalConfig.baremetal_network.name).toEqual('test');
                    expect(ctrl.bm_network_edited).toBe(true);
                });
            });

            describe('editBmServer', function() {
                it('should call the DrawerService', function() {
                    var server = {id: 'server', role: 'ROLE-CONTROLLER'};
                    ctrl.editBmServer(server);
                    expect(DrawerService.open).toHaveBeenCalled();
                });

                it('should update server when drawer resolves', function() {
                    var server = ctrl.data.baremetalConfig.baremetal_servers[0];
                    ctrl.editBmServer(server);
                    DrawerService.resolve({id: 'test'});

                    $scope.$apply();

                    expect(ctrl.data.baremetalConfig.baremetal_servers[0].id).toBe('test');
                    expect(dataMock.dataChanged).toHaveBeenCalledWith('server', server);
                });
            });

            describe('ardanaInstallationData.update', function() {
                it('should reload the data', function() {
                    dataMock.data.baremetal = {name: 'bm network'};
                    dataMock.data.servers = ['x', 'y', 'z'];
                    $scope.$broadcast('ardanaInstallationData.update');

                    var bmConfig = ctrl.data.baremetalConfig;
                    expect(bmConfig).toBeDefined();
                    expect(ctrl.bm_network_edited).toBe(true);
                    expect(bmConfig.baremetal_network).toEqual({name: 'bm network'});
                    expect(bmConfig.baremetal_servers).toEqual(['x', 'y', 'z']);
                });
            });
        });

        describe('servers is not defined', function() {
            beforeEach(inject(function($injector) {
                dataMock.data.baremetal = null;
                dataMock.data.servers = undefined;
                var $controller = $injector.get('$controller');

                ctrl = $controller('BaremetalServersController', {
                    'app.basePath': '',
                    '$scope': $scope,
                    ardanaInstallationData: dataMock,
                    DrawerService: DrawerService
                });
            }));

            it('should be defined and data should be defined', function() {
                expect(ctrl.data.baremetalConfig.baremetal_network).toBeNull();
                expect(ctrl.data.baremetalConfig.baremetal_servers).toEqual([]);
                expect(ctrl.bm_network_edited).toBeFalsy();
            });
        });
    });
})();
