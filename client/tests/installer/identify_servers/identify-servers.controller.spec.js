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

    describe('IdentifyServersController', function() {
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
            var $controller = $injector.get('$controller');
            dataMock = $injector.get('DataMock');
            DrawerService = $injector.get('DrawerService');

            ctrl = $controller('IdentifyServersController', {
                'app.basePath': '',
                ardanaInstallationData: dataMock,
                DrawerService: DrawerService
            });

            spyOn(DrawerService, 'open').and.callThrough();
            spyOn(dataMock, 'dataChanged').and.callThrough();
        }));

        it('should be defined and data should be defined', function() {
            expect(ctrl).toBeDefined();
            expect(ctrl.data).toBeDefined();
            expect(ctrl.tableHeaders).toBeDefined();
            expect(ctrl.tableConfig).toBeDefined();
        });

        describe('editServer function', function() {
            describe('called with no data', function() {
                it('should call the DrawerService', function() {
                    ctrl.editServer();
                    expect(DrawerService.open).toHaveBeenCalled();
                });

                it('should add new server when drawer saved when editServer called with no data', function() {
                    ctrl.editServer();
                    DrawerService.resolve({id: 'test'});

                    $scope.$apply();

                    expect(ctrl.data.servers.length).toBe(8);
                });
            });

            describe('called with data', function() {
                it('should call the DrawerService if editServer called with data', function() {
                    ctrl.editServer({name: 'Server 1'});
                    expect(DrawerService.open).toHaveBeenCalled();
                });

                it('should save edited server when drawer saved', function() {
                    var server = ctrl.data.servers[0];
                    ctrl.editServer(server);
                    DrawerService.resolve({id: 'edited server'});

                    $scope.$apply();

                    expect(ctrl.data.servers.length).toBe(7);
                    expect(ctrl.data.servers[0].id).toBe('edited server');
                    expect(dataMock.dataChanged).toHaveBeenCalled();
                });
            });
        });
    });
})();
