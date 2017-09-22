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

    describe('NetworkGrpsController', function() {
        var $scope, $translate, dataMock, DrawerService, ctrl;

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
            $translate = $injector.get('$translate');
            var $controller = $injector.get('$controller');
            dataMock = $injector.get('DataMock');
            DrawerService = $injector.get('DrawerService');

            ctrl = $controller('NetworkGrpsController', {
                'app.basePath': '',
                '$scope': $scope,
                '$translate': $translate,
                ardanaInstallationData: dataMock,
                DrawerService: DrawerService
            });

            spyOn(DrawerService, 'open').and.callThrough();
        }));

        it('should be defined and data should be defined', function() {
            expect(ctrl).toBeDefined();
            expect(ctrl.data).toBeDefined();
            expect(ctrl.config).toBeDefined();
            expect(ctrl.tableHeaders).toBeDefined();
            expect(Object.keys(ctrl.config)).toEqual(['EXTERNAL_API', 'EXTERNAL_VM', 'GUEST', 'MGMT']);
        });

        describe('addNetwork function', function() {
            it('should call the DrawerService if addNetwork called', function() {
                ctrl.addNetwork('EXTERNAL_API');
                expect(DrawerService.open).toHaveBeenCalled();
            });

            it('should add new network to EXTERNAL_API group when drawer saved', function() {
                ctrl.addNetwork('EXTERNAL_API');
                DrawerService.resolve({name: 'new network'});

                $scope.$apply();

                expect(ctrl.data['EXTERNAL_API'].networks.length).toBe(2);
            });
        });

        describe('ardanaInstallationData.update event', function() {
            it('should update data and config when ardanaInstallationData updated', function() {
                dataMock.data['network-groups'] = {
                    'NET-GROUP-1': {},
                    'NET-GROUP-2': {}
                };
                $scope.$broadcast('ardanaInstallationData.update');

                expect(ctrl.data['NET-GROUP-1']).toEqual({});
                expect(ctrl.data['NET-GROUP-2']).toEqual({});
                expect(Object.keys(ctrl.config)).toEqual(['NET-GROUP-1', 'NET-GROUP-2']);
            });
        });
    });
})();
