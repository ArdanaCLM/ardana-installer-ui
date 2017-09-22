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

    describe('VolumeGroupsModalController', function() {
        beforeEach(module('dayzero.installer'));

        var $scope, $controller;

        beforeEach(inject(function($injector) {
            var $rootScope = $injector.get('$rootScope');
            $controller = $injector.get('$controller');
            $scope = $rootScope.$new();
            $scope.addPhysicalVolumeForm = {
                '$setPristine': angular.noop
            };
            $scope.newLogicalVolumeForm = {
                '$setPristine': angular.noop
            };
        }));

        describe('Initializing physical volumes', function() {
            it('should convert physical-volumes to string array', function() {
                var controller = $controller('VolumeGroupsModalController', {
                    'app.basePath': '',
                    $scope: $scope,
                    $modalInstance: {},
                    title: 'test',
                    volumeGroup: {
                        'physical-volumes': ['vol1', 'vol2']
                    }
                });

                var physicalVolumes = [{name: 'vol1'}, {name: 'vol2'}];
                expect(controller.physicalVolumes).toEqual(physicalVolumes);
            });
        });

        describe('Updating physical volumes table', function() {
            var controller;

            beforeEach(function() {
                controller = $controller('VolumeGroupsModalController',
                    {
                        'app.basePath': '',
                        $scope: $scope,
                        $modalInstance: {},
                        title: 'test',
                        volumeGroup: {
                            'physical-volumes': [],
                            'logical-volumes': []
                        }
                    });
            });

            describe('adding new physical volumes', function() {
                it('should indicate that it is adding a physical volume', function() {
                    controller.addPhysicalVolume();

                    expect(controller.isAddingPhysicalVolume).toBe(true);
                });

                it('should push the new volume to the list on save', function() {
                    controller.addPhysicalVolume();
                    controller.newPhysicalVolumeName = '/dev/new';

                    controller.saveNewPhysicalVolume();

                    expect(controller.physicalVolumes).toEqual([{name: '/dev/new'}]);
                    expect(controller.newPhysicalVolumeName).toEqual('');
                    expect(controller.isAddingPhysicalVolume).toBe(false);
                });

                it('should hide new physical volume field on cancel', function() {
                    controller.addPhysicalVolume();
                    controller.newPhysicalVolumeName = '/dev/new';

                    controller.cancelAddPhysicalVolume();

                    expect(controller.physicalVolumes).toEqual([]);
                    expect(controller.newPhysicalVolumeName).toEqual('');
                    expect(controller.isAddingPhysicalVolume).toBe(false);
                });
            });

            describe('editing physical volumes', function() {
                it('should set _name and _expanded to true on editPhysicalVolume', function() {
                    var data = {name: 'volume'};
                    controller.editPhysicalVolume(data);

                    expect(data._name).toBe('volume');
                    expect(data._expanded).toBe(true);
                });
            });
        });

        describe('Updating logical volumes table', function() {
            var controller;

            beforeEach(function() {
                controller = $controller('VolumeGroupsModalController',
                    {
                        'app.basePath': '',
                        $scope: $scope,
                        $modalInstance: {},
                        title: '',
                        volumeGroup: {
                            'physical-volumes': [],
                            'logical-volumes': []
                        }
                    });
            });

            describe('adding new logical volumes', function() {
                it('should indicate that it is adding a logical volume', function() {
                    controller.addLogicalVolume();

                    expect(controller.isAddingLogicalVolume).toBe(true);
                });

                it('should push the new volume to the list on save', function() {
                    controller.addLogicalVolume();
                    controller.newLogicalVolume = {new: 'volume'};

                    controller.saveNewLogicalVolume();

                    expect(controller.logicalVolumes).toEqual([{new: 'volume'}]);
                    expect(controller.newLogicalVolume).toEqual({});
                    expect(controller.isAddingLogicalVolume).toBe(false);
                });

                it('should hide new logical volume field on cancel', function() {
                    controller.addLogicalVolume();
                    controller.newLogicalVolume = {new: 'volume'};

                    controller.cancelAddLogicalVolume();

                    expect(controller.logicalVolumes).toEqual([]);
                    expect(controller.newLogicalVolume).toEqual({});
                    expect(controller.isAddingLogicalVolume).toBe(false);
                });
            });

            describe('editing logical volumes', function() {
                it('should set _name, _size, _mount, _mkfs-opts, and _expanded', function() {
                    var data = {
                        name: 'name',
                        size: 'size',
                        mount: 'mount',
                        'mkfs-opts': 'mkfs'
                    };
                    controller.editLogicalVolume(data);

                    expect(data._name).toBe('name');
                    expect(data._size).toBe('size');
                    expect(data._mount).toBe('mount');
                    expect(data['_mkfs-opts']).toBe('mkfs');
                    expect(data._expanded).toBe(true);
                });
            });
        });

        describe('Volume group modal', function() {
            var modalInstance, volumeGroup, controller;

            beforeEach(function() {
                modalInstance = {
                    close: jasmine.createSpy(),
                    dismiss: jasmine.createSpy()
                };
                volumeGroup = {
                    'physical-volumes': ['vol1', 'vol2']
                };
                controller = $controller('VolumeGroupsModalController', {
                    'app.basePath': '',
                    $scope: $scope,
                    $modalInstance: modalInstance,
                    title: 'test',
                    volumeGroup: volumeGroup
                });
            });

            it('should convert physical-volumes to string array', function() {
                var logicalVolumes = [
                    {name: 'lvolume1', size: 10, mount: 'mount 1'},
                    {name: 'lvolume1', size: 20, mount: 'mount 1', 'mkfs-opts': 'mkfs2'}
                ];

                controller.groupName = 'group 1';
                controller.logicalVolumes = logicalVolumes;
                controller.physicalVolumes = [{name: 'vol1'}, {name: 'vol2'}];
                controller.save();

                expect(volumeGroup.name).toBe('group 1');
                expect(volumeGroup['logical-volumes']).toEqual(logicalVolumes);
                expect(volumeGroup['physical-volumes']).toEqual(['vol1', 'vol2']);
                expect(modalInstance.close).toHaveBeenCalled();
            });

            it('should dismiss on cancel', function() {
                controller.cancel();
                expect(modalInstance.dismiss).toHaveBeenCalled();
            });
        });
    });
})();
