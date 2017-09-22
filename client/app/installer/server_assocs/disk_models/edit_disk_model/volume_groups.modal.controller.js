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

    angular
        .module('dayzero.installer')
        .controller('VolumeGroupsModalController', VolumeGroupsModalController);

    VolumeGroupsModalController.$inject = [
        'app.basePath',
        '$scope',
        '$modalInstance',
        'title',
        'volumeGroup'
    ];

    function VolumeGroupsModalController(path, $scope, $modalInstance, title, volumeGroup) {
        var ctrl = this;

        ctrl.title = title;
        ctrl.groupName = volumeGroup.name;
        ctrl.physicalVolumes = getPhysicalVolumesFrom(volumeGroup);
        ctrl.logicalVolumes = angular.copy(volumeGroup['logical-volumes']);
        ctrl.isAddingPhysicalVolume = false;
        ctrl.newPhysicalVolumeName = '';
        ctrl.isAddingLogicalVolume = false;
        ctrl.newLogicalVolume = {};
        ctrl.editPhysicalVolumeTemplate = path + 'installer/server_assocs/disk_models/edit_disk_model/' +
            'physical_volume_detail.html';
        ctrl.editLogicalVolumeTemplate = path + 'installer/server_assocs/disk_models/edit_disk_model/' +
            'logical_volume_detail.html';

        ctrl.physicalVolumesTableHeaders = [
            {
                label: 'server_assocs.disk_models.physical_volumes.title',
                key: 'name'
            }
        ];

        ctrl.logicalVolumesTableHeaders = [
            {
                label: 'server_assocs.disk_models.logical_volumes.title',
                key: 'name'
            }
        ];

        ctrl.physicalVolumesTableConfig = {
            btn: {
                add: 'server_assocs.disk_models.physical_volumes.btn.add',
                edit: 'server_assocs.disk_models.physical_volumes.btn.edit',
                del: 'server_assocs.disk_models.physical_volumes.btn.del'
            },
            deleteConfig: {
                message: 'server_assocs.disk_models.physical_volumes.delete_msg',
                title: 'server_assocs.disk_models.physical_volumes.delete_title'
            }
        };

        ctrl.logicalVolumesTableConfig = {
            btn: {
                add: 'server_assocs.disk_models.logical_volumes.btn.add',
                edit: 'server_assocs.disk_models.logical_volumes.btn.edit',
                del: 'server_assocs.disk_models.logical_volumes.btn.del'
            },
            deleteConfig: {
                message: 'server_assocs.disk_models.logical_volumes.delete_msg',
                title: 'server_assocs.disk_models.logical_volumes.delete_title'
            }
        };

        ctrl.save = function() {
            volumeGroup.name = ctrl.groupName;
            volumeGroup['logical-volumes'] = ctrl.logicalVolumes;
            addPhysicalVolumesTo(volumeGroup);
            $modalInstance.close(volumeGroup);
        };

        ctrl.cancel = function() {
            $modalInstance.dismiss();
        };

        ctrl.addPhysicalVolume = function() {
            ctrl.isAddingPhysicalVolume = true;
        };

        ctrl.addLogicalVolume = function() {
            ctrl.isAddingLogicalVolume = true;
        };

        ctrl.saveNewPhysicalVolume = function() {
            ctrl.physicalVolumes.push({name: ctrl.newPhysicalVolumeName});
            ctrl.newPhysicalVolumeName = '';
            ctrl.isAddingPhysicalVolume = false;
            $scope.addPhysicalVolumeForm.$setPristine();
        };

        ctrl.saveNewLogicalVolume = function() {
            ctrl.isAddingLogicalVolume = false;
            ctrl.newLogicalVolume = _.pick(ctrl.newLogicalVolume, function(value, key) {
                return value !== null && value !== '';
            });
            ctrl.logicalVolumes.push(ctrl.newLogicalVolume);
            ctrl.newLogicalVolume = {};
            $scope.newLogicalVolumeForm.$setPristine();
        };

        ctrl.cancelAddPhysicalVolume = function() {
            ctrl.newPhysicalVolumeName = '';
            ctrl.isAddingPhysicalVolume = false;
            $scope.addPhysicalVolumeForm.$setPristine();
        };

        ctrl.cancelAddLogicalVolume = function() {
            ctrl.newLogicalVolume = {};
            ctrl.isAddingLogicalVolume = false;
            $scope.newLogicalVolumeForm.$setPristine();
        };

        ctrl.editPhysicalVolume = function(data) {
            data._name = data.name;
            data._expanded = true;
        };

        ctrl.editLogicalVolume = function(data) {
            var fields = ['name', 'size', 'mount', 'fstype', 'mkfs-opts'];
            angular.forEach(fields, function(field) {
                data['_' + field] = data[field];
            });
            data._expanded = true;
        };

        $scope.$watch(function() {
            return ctrl.physicalVolumes.length + ctrl.logicalVolumes.length;
        }, validateVolumeGroup);

        function getPhysicalVolumesFrom(volumeGroup) {
            var physicalVolumes = [];
            volumeGroup['physical-volumes'].forEach(function(volumeName) {
                physicalVolumes.push({name: volumeName});
            });

            return physicalVolumes;
        }

        function addPhysicalVolumesTo(volumeGroup) {
            var volumesAsStrings = [];
            ctrl.physicalVolumes.forEach(function(volume) {
                volumesAsStrings.push(volume.name);
            });
            volumeGroup['physical-volumes'] = volumesAsStrings;
        }

        function validateVolumeGroup() {
            ctrl.validVolumes = ctrl.physicalVolumes.length > 0 && ctrl.logicalVolumes.length > 0;
        }
    }

})();
