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
    angular
        .module('dayzero.installer')
        .controller('EditDiskModelController', EditDiskModelController);

    EditDiskModelController.$inject = ['$scope', '$modal', 'app.basePath'];

    function EditDiskModelController($scope, $modal, path) {

        var ctrl = this;

        $scope.$watch(
            function() {
                return $scope.this_data;
            },
            function() {
                ctrl.diskModelRow = $scope.this_data;
                ctrl.deviceGroups = ctrl.diskModelRow['device-groups'];
                ctrl.volumeGroups = ctrl.diskModelRow['volume-groups'];
            }
        );

        ctrl.deviceGroupTableHeader = [
            {
                label: 'server_assocs.disk_models.device_groups.title',
                key: 'name'
            }
        ];

        ctrl.volumeGroupTableHeader = [
            {
                label: 'server_assocs.disk_models.volume_groups.title',
                key: 'name'
            }
        ];

        ctrl.deviceGroupTableConfig = {
            btn: {
                add: 'server_assocs.disk_models.device_groups.btn.add',
                edit: 'server_assocs.disk_models.device_groups.btn.edit',
                del: 'server_assocs.disk_models.device_groups.btn.del'
            },
            deleteConfig: {
                message: 'server_assocs.disk_models.device_groups.delete_msg',
                title: 'server_assocs.disk_models.device_groups.delete_title'
            }
        };

        ctrl.volumeGroupTableConfig = {
            btn: {
                add: 'server_assocs.disk_models.volume_groups.btn.add',
                edit: 'server_assocs.disk_models.volume_groups.btn.edit',
                del: 'server_assocs.disk_models.volume_groups.btn.del'
            },
            deleteConfig: {
                message: 'server_assocs.disk_models.volume_groups.delete_msg',
                title: 'server_assocs.disk_models.volume_groups.delete_title'
            }
        };

        ctrl.editDeviceGroup = function(row) {
            $modal.open({
                templateUrl: path + 'installer/server_assocs/disk_models/edit_disk_model/device_groups.modal.html',
                size: 'lg',
                controller: 'DeviceGroupsModalController as deviceGroupsModalCtrl',
                resolve: {
                    title: function() {
                        return 'server_assocs.disk_models.device_groups.edit';
                    },
                    deviceGroup: function() {
                        var dataIdx = _.findIndex(ctrl.deviceGroups, row);
                        if (dataIdx > -1) {
                            return ctrl.deviceGroups[dataIdx];
                        }
                        return {};
                    }
                }
            });
        };

        ctrl.editVolumeGroup = function(row) {
            $modal.open({
                templateUrl: path + 'installer/server_assocs/disk_models/edit_disk_model/volume_groups.modal.html',
                size: 'lg',
                controller: 'VolumeGroupsModalController as volumeGroupsModalCtrl',
                resolve: {
                    title: function() {
                        return 'server_assocs.disk_models.volume_groups.edit';
                    },
                    volumeGroup: function() {
                        var dataIdx = _.findIndex(ctrl.volumeGroups, row);
                        if (dataIdx > -1) {
                            return ctrl.volumeGroups[dataIdx];
                        }
                    }
                }
            });
        };

        ctrl.addVolumeGroup = function(row) {
            var modal = $modal.open({
                templateUrl: path + 'installer/server_assocs/disk_models/edit_disk_model/volume_groups.modal.html',
                size: 'lg',
                controller: 'VolumeGroupsModalController as volumeGroupsModalCtrl',
                resolve: {
                    title: function() {
                        return 'server_assocs.disk_models.volume_groups.add';
                    },
                    volumeGroup: function() {
                        return {
                            'physical-volumes': [],
                            'logical-volumes': []
                        };
                    }
                }
            });

            modal.result.then(function(volumeGroup) {
                ctrl.volumeGroups.push(volumeGroup);
            });
        };

        ctrl.addDeviceGroup = function() {
            if (angular.isUndefined(ctrl.deviceGroups)) {
                ctrl.deviceGroups = [];
            }

            var modal = $modal.open({
                templateUrl: path + 'installer/server_assocs/disk_models/edit_disk_model/device_groups.modal.html',
                size: 'lg',
                controller: 'DeviceGroupsModalController as deviceGroupsModalCtrl',
                resolve: {
                    title: function() {
                        return 'server_assocs.disk_models.device_groups.add';
                    },
                    deviceGroup: function() {
                        return {
                            devices: []
                        };
                    }
                }
            });

            modal.result.then(function(deviceGroup) {
                ctrl.deviceGroups.push(deviceGroup);
            });
        };
    }
})();
