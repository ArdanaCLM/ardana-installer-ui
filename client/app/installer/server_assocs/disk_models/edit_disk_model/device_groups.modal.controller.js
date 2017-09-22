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
        .controller('DeviceGroupsModalController', DeviceGroupsModalController);

    DeviceGroupsModalController.$inject = [
        'app.basePath',
        '$scope',
        '$modalInstance',
        'title',
        'deviceGroup'
    ];

    function DeviceGroupsModalController(path, $scope, $modalInstance, title, deviceGroup) {
        var ctrl = this;

        ctrl.title = title;

        if (angular.isUndefined(deviceGroup.consumer)) {
            deviceGroup.consumer = {};
        }

        ctrl.groupName = deviceGroup.name;
        ctrl.consumerName = deviceGroup.consumer.name;
        ctrl.consumerUsage = deviceGroup.consumer.usage;
        ctrl.consumerAttributes = angular.copy(deviceGroup.consumer.attrs);
        ctrl.devices = angular.copy(deviceGroup.devices);

        ctrl.headers = [
            {
                label: 'server_assocs.disk_models.devices.title',
                key: 'name'
            }
        ];

        ctrl.tableConfig = {
            btn: {
                add: 'server_assocs.disk_models.devices.btn.add',
                edit: 'server_assocs.disk_models.devices.btn.edit',
                del: 'server_assocs.disk_models.devices.btn.del'
            },
            deleteConfig: {
                message: 'server_assocs.disk_models.devices.delete_msg',
                title: 'server_assocs.disk_models.devices.delete_title'
            }
        };

        ctrl.editDeviceTemplate = path + 'installer/server_assocs/disk_models/edit_disk_model/device_detail.html';
        ctrl.isAddingDevice = false;

        ctrl.save = function() {
            deviceGroup.name = ctrl.groupName;
            deviceGroup.consumer.name = ctrl.consumerName;
            if (ctrl.consumerUsage) {
                deviceGroup.consumer.usage = ctrl.consumerUsage;
            } else {
                delete deviceGroup.consumer.usage;
            }
            if (!_.isEmpty(ctrl.consumerAttributes)) {
                deviceGroup.consumer.attrs = ctrl.consumerAttributes;
            } else {
                delete deviceGroup.consumer.attrs;
            }
            deviceGroup.devices = ctrl.devices;
            $modalInstance.close(deviceGroup);
        };

        ctrl.cancel = function() {
            $modalInstance.dismiss();
        };

        ctrl.editDevice = function(data) {
            data._name = data.name;
            data._expanded = true;
        };

        ctrl.addDevice = function() {
            ctrl.isAddingDevice = true;
        };

        ctrl.saveNewDevice = function() {
            ctrl.isAddingDevice = false;
            ctrl.devices.push({name: ctrl.newDeviceName});
            ctrl.newDeviceName = '';
            $scope.newDeviceForm.$setPristine();
        };

        ctrl.cancelAdd = function() {
            ctrl.isAddingDevice = false;
            ctrl.newDeviceName = '';
            $scope.newDeviceForm.$setPristine();
        };

        $scope.$watch(function() {
            return ctrl.devices.length;
        }, function() {
            ctrl.validDevices = ctrl.devices.length > 0;
        });
    }
})();
