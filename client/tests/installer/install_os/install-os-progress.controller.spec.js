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

    describe('InstallOsProgressController', function() {
        var $scope, dataMock, DrawerService, $modal, modalInstance, ctrl;

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
            $modal = $injector.get('$modal');

            ctrl = $controller('InstallOsProgressController', {
                'app.basePath': '',
                '$scope': $scope,
                ardanaInstallationData: dataMock,
                DrawerService: DrawerService
            });

            modalInstance = {
                result: {
                    then: function(confirmCallback) {
                        this.confirmCallback = confirmCallback;
                    }
                },
                close: function() {
                    this.result.confirmCallback();
                }
            };

            spyOn($modal, 'open').and.returnValue(modalInstance);

            spyOn(DrawerService, 'open').and.callThrough();
            spyOn($scope, '$emit').and.callThrough();
        }));

        it('should be defined and data should be defined', function() {
            expect(ctrl).toBeDefined();
            expect(ctrl.data.servers).toBeDefined();
            expect(ctrl.tableHeaders).toBeDefined();
            expect(ctrl.data.servers.length).toBe(7);
        });

        it('should open edit server drawer if editServer called', function() {
            var firstServer = ctrl.data.servers[0];
            ctrl.editServer(firstServer);
            expect(DrawerService.open).toHaveBeenCalled();

            DrawerService.resolve({id: 'test'});
            $scope.$apply();
            expect(ctrl.data.servers[0].id).toBe('test');
        });

        it('should remove server if removeServer called', function() {
            ctrl.removeServer(ctrl.data.servers[1]);
            modalInstance.close();
            expect(ctrl.data.servers.length).toBe(6);
        });

        it('should validate servers when removeServer called', function() {
            ctrl.data.servers[1]._status = 'status.error';
            ctrl.data.servers[3]._status = 'status.error';
            ctrl.removeServer(ctrl.data.servers[3]);
            modalInstance.close();
            ctrl.removeServer(ctrl.data.servers[1]);
            modalInstance.close();

            expect(ctrl.data.servers.length).toBe(5);
            expect($scope.$emit).toHaveBeenCalled();
        });

        it('should update data on ardanaInstallationData.update event', function() {
            dataMock.data.servers = ['foo'];
            $scope.$broadcast('ardanaInstallationData.update');
            expect(ctrl.data.servers).toEqual(['foo']);
        });
    });
})();
