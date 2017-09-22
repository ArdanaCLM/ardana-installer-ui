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

    describe('EditDiskModelController', function() {
        describe('Updating the disk model', function() {

            beforeEach(module('dayzero.installer'));

            var $scope, $rootScope, $controller, $q;

            beforeEach(inject(function($injector, _$q_) {
                $rootScope = $injector.get('$rootScope');
                $controller = $injector.get('$controller');
                $scope = $rootScope.$new();
                $q = _$q_;
            }));

            it('should display the properties of the selected model', function() {
                $scope.this_data = {
                    name: 'INITIALLIY_SELECTED_DISK_MODEL',
                    'device-groups': ['INITIAL_DEVICE_GROUP'],
                    'volume-groups': ['INITIAL_VOLUME_GROUP']
                };

                var controller = $controller('EditDiskModelController', {
                    $scope: $scope,
                    $modal: {},
                    'app.basePath': ''
                });

                $scope.$apply();
                expect(controller.diskModelRow.name).toEqual('INITIALLIY_SELECTED_DISK_MODEL');
                expect(controller.diskModelRow['device-groups']).toEqual(['INITIAL_DEVICE_GROUP']);
                expect(controller.diskModelRow['volume-groups']).toEqual(['INITIAL_VOLUME_GROUP']);

                // Select the model
                $scope.this_data = {
                    name: "NEW_DISK_MODEL",
                    'device-groups': ['NEW_DEVICE_GROUP'],
                    'volume-groups': ['NEW_VOLUME_GROUP']
                };

                $scope.$apply();
                // Setup assertion to trigger when new disk model is selected
                expect(controller.diskModelRow.name).toEqual('NEW_DISK_MODEL');
                expect(controller.diskModelRow['device-groups']).toEqual(['NEW_DEVICE_GROUP']);
                expect(controller.diskModelRow['volume-groups']).toEqual(['NEW_VOLUME_GROUP']);
            });

            describe('editDeviceGroup function', function() {
                var modal, controller;

                beforeEach(function() {
                    $scope.this_data = {
                        'device-groups': [{ name: 'INITIAL_DEVICE_GROUP' }]
                    };

                    modal = {
                        open: function(options) {
                            var deferred = $q.defer();
                            deferred.resolve('deviceGroup');
                            return {
                                result: deferred.promise
                            };
                        }
                    };

                    controller = $controller('EditDiskModelController', {
                        $scope: $scope,
                        $modal: modal,
                        'app.basePath': ''
                    });

                    spyOn(modal, 'open').and.callThrough();
                });

                it('should call modal with correct config', function() {
                    $scope.$apply();
                    controller.editDeviceGroup({ name: 'INITIAL_DEVICE_GROUP' });
                    $scope.$apply();

                    var config = modal.open.calls.argsFor(0)[0];
                    expect(modal.open).toHaveBeenCalled();
                    expect(config.controller).toBe('DeviceGroupsModalController as deviceGroupsModalCtrl');
                    expect(config.resolve.title()).toBe('server_assocs.disk_models.device_groups.edit');
                    expect(config.resolve.deviceGroup()).toEqual({ name: 'INITIAL_DEVICE_GROUP' });
                });
            });

            describe('editVolumeGroup function', function() {
                var modal, controller;

                beforeEach(function() {
                    $scope.this_data = {
                        'volume-groups': [{ name: 'INITIAL_VOLUME_GROUP' }]
                    };

                    modal = {
                        open: function(options) {
                            var deferred = $q.defer();
                            deferred.resolve('volumeGroup');
                            return {
                                result: deferred.promise
                            };
                        }
                    };

                    controller = $controller('EditDiskModelController', {
                        $scope: $scope,
                        $modal: modal,
                        'app.basePath': ''
                    });

                    spyOn(modal, 'open').and.callThrough();
                });

                it('should call modal with correct config', function() {
                    $scope.$apply();
                    controller.editVolumeGroup({ name: 'INITIAL_VOLUME_GROUP' });
                    $scope.$apply();

                    var config = modal.open.calls.argsFor(0)[0];
                    expect(modal.open).toHaveBeenCalled();
                    expect(config.controller).toBe('VolumeGroupsModalController as volumeGroupsModalCtrl');
                    expect(config.resolve.title()).toBe('server_assocs.disk_models.volume_groups.edit');
                    expect(config.resolve.volumeGroup()).toEqual({ name: 'INITIAL_VOLUME_GROUP' });
                });
            });

            describe('addDeviceGroup function', function() {
                var modal, controller;

                beforeEach(function() {
                    modal = {
                        open: function(options) {
                            var deferred = $q.defer();
                            deferred.resolve('deviceGroup');
                            return {
                                result: deferred.promise
                            }
                        }
                    }

                    controller = $controller('EditDiskModelController', {
                        $scope: $scope,
                        $modal: modal,
                        'app.basePath': ''
                    });

                    spyOn(modal, 'open').and.callThrough();
                });

                it('should add device group', function() {
                    $scope.this_data = {
                        'device-groups': []
                    };
                    $scope.$apply();
                    controller.addDeviceGroup();
                    $scope.$apply();

                    expect(controller.deviceGroups[0]).toBe('deviceGroup');
                });

                it('should call modal with correct config', function() {
                    $scope.this_data = {
                        'device-groups': []
                    };
                    controller.addDeviceGroup();

                    var config = modal.open.calls.argsFor(0)[0];
                    expect(modal.open).toHaveBeenCalled();
                    expect(config.controller).toBe('DeviceGroupsModalController as deviceGroupsModalCtrl');
                    expect(config.resolve.title()).toBe('server_assocs.disk_models.device_groups.add');
                    expect(config.resolve.deviceGroup()).toEqual({devices: []});
                });
            });

            describe('addVolumeGroup function', function() {
                var modal, controller;

                beforeEach(function() {
                    modal = {
                        open: function(options) {
                            var deferred = $q.defer();
                            deferred.resolve('volumeGroup');
                            return {
                                result: deferred.promise
                            }
                        }
                    };

                    controller = $controller('EditDiskModelController', {
                        $scope: $scope,
                        $modal: modal,
                        'app.basePath': ''
                    });

                    spyOn(modal, 'open').and.callThrough();
                });

                it('should add volume group', function() {
                    $scope.this_data = {
                        'volume-groups': []
                    };
                    $scope.$apply();
                    controller.addVolumeGroup();
                    $scope.$apply();

                    expect(controller.volumeGroups[0]).toBe('volumeGroup');
                });

                it('should call modal with correct config', function() {
                    $scope.this_data = {
                        'volume-groups': []
                    };
                    controller.addVolumeGroup();

                    var config = modal.open.calls.argsFor(0)[0];
                    expect(modal.open).toHaveBeenCalled();
                    expect(config.controller).toBe('VolumeGroupsModalController as volumeGroupsModalCtrl');
                    expect(config.resolve.title()).toBe('server_assocs.disk_models.volume_groups.add');
                    expect(config.resolve.volumeGroup()).toEqual({'physical-volumes': [], 'logical-volumes': []});
                });
            });
        });
    });
})();
