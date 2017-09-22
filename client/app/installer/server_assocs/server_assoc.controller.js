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
        .controller('ServerAssociationController', ServerAssociationController);

    ServerAssociationController.$inject = [
        '$scope',
        '$translatePartialLoader',
        '$translate',
        'ardanaInstallationData',
        'DrawerService',
        '$modal',
        'app.basePath'
    ];

    function ServerAssociationController($scope, $translatePartialLoader, $translate, ardanaInstallationData,
                                         DrawerService, $modal, path) {
        var ctrl = this;

        $translatePartialLoader.addPart('server_assocs');
        $translate.refresh();

        ctrl.showConfigDiskModel = false;

        var volEditData = {editing: false, data: {}};
        var logicalVolEditData = {editing: false, data: {}};

        var drawerConfig = {
            diskModel: {
                commitLabel: 'server_assocs.disk_models.btn.commit',
                showContinue: false,
                title: 'server_assocs.disk_models.add',
                template: path + '/installer/server_assocs/disk_models/edit_disk_model/edit_disk_model.drawer.html',
                metadata: {
                    diskModels: []
                }
            },
            interfaceModel: {
                commitLabel: 'server_assocs.interface_models.btn.commit',
                showContinue: false,
                title: 'server_assocs.interface_models.create',
                template: path + '/installer/server_assocs/edit_network_interfaces/edit_interfaces.drawer.html',
                metadata: {
                    interfaceModels: []
                }
            }
        };

        $scope.$on('ardanaInstallationData.update', function() {
            setServerAssocData();
        });

        ctrl.serverAssociationTableActions = [
            {
                label: 'server_assocs.disk_models.edit',
                callback: function(serverRole) {
                    var diskModelName = serverRole['disk-model'];
                    var diskModel = _.find(ctrl.data['disk-models'], function(model) {
                        return model.name === diskModelName;
                    });

                    if (angular.isUndefined(diskModel['device-groups'])) {
                        diskModel['device-groups'] = [];
                    }

                    if (angular.isUndefined(diskModel['volume-groups'])) {
                        diskModel['volume-groups'] = [];
                    }

                    var config = angular.copy(drawerConfig.diskModel);
                    config.title = 'server_assocs.disk_models.edit';

                    DrawerService
                        .open(config, diskModel)
                        .then(function(updatedDiskModel) {
                            angular.extend(diskModel, updatedDiskModel);
                            serverRole['disk-model'] = updatedDiskModel.name;
                        });
                }
            },
            {
                label: 'server_assocs.interface_models.edit',
                callback: function(serverRole) {
                    var ifaceModelName = serverRole['interface-model'];
                    var ifaceModel = _.find(ctrl.data['interface-models'], function(model) {
                        return model.name === ifaceModelName;
                    });

                    var config = angular.copy(drawerConfig.interfaceModel);
                    config.title = 'server_assocs.interface_models.edit';

                    DrawerService
                        .open(config, {interfaceName: ifaceModelName, model: ifaceModel})
                        .then(function(newData) {
                            angular.extend(ifaceModel, newData.model);
                            serverRole['interface-model'] = newData.model.name;
                        });
                }
            }
        ];

        ctrl.editDiskModel = function(data) {
            // Depreciated. See serverAssociationTableActions callbacks
            var config = angular.copy(drawerConfig.diskModel);
            config.title = 'server_assocs.disk_models.edit';

            DrawerService
                .open(config, data.row)
                .then(function(updatedDiskModel) {
                    angular.extend(data.row, updatedDiskModel);
                });
        };

        ctrl.createDiskModel = function() {
            var config = angular.copy(drawerConfig.diskModel);

            DrawerService
                .open(config, {'device-groups': [], 'volume-groups': []})
                .then(function(newDiskModel) {
                    ctrl.data['disk-models'].push(newDiskModel);
                });
        };

        ctrl.editInterface = function(data) {
            // Depreciated. See serverAssociationTableActions callbacks
            var config = angular.copy(drawerConfig.interfaceModel);
            config.title = 'server_assocs.interface_models.edit';

            DrawerService
                .open(config, data.row)
                .then(function(newData) {
                    angular.extend(data.row, newData.model);
                });
        };

        ctrl.createInterface = function() {
            var config = angular.copy(drawerConfig.interfaceModel);

            DrawerService
                .open(config, {})
                .then(function(newData) {
                    ctrl.data['interface-models'].push(newData.model);
                });
        };

        setServerAssocData();

        function setServerAssocData() {
            ctrl.data = {
                'disk-models': ardanaInstallationData.data['disk-models'],
                'interface-models': ardanaInstallationData.data['interface-models'],
                'server-roles': ardanaInstallationData.data['server-roles']
            };

            drawerConfig.interfaceModel.metadata.interfaceModels = ctrl.data['interface-models'];
            drawerConfig.interfaceModel.metadata.diskModels = ctrl.data['disk-models'];

            ctrl.data.interfaceModelMap = {};
            angular.forEach(ctrl.data['interface-models'], function(model) {
                ctrl.data.interfaceModelMap[model.name] = model;
            });
        }

    }
})();
