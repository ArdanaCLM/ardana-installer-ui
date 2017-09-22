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
        .controller('EditInterfaceModelsController', EditInterfaceModelsController);

    EditInterfaceModelsController.$inject = ['$scope', '$modal', 'app.basePath', 'ConfirmModalService'];

    function EditInterfaceModelsController($scope, $modal, path, ConfirmModalService) {
        var ctrl = this;

        ctrl.interfaceRow = $scope.this_data;
        ctrl.usedInterfaces = getUsedInterfaces(ctrl.interfaceRow);
        ctrl.assignedNetworkGroups = getAssignedNetworkGroups(ctrl.interfaceRow);

        $scope.$watch(
            function() {
                return $scope.this_data;
            },
            function() {
                ctrl.interfaceRow = $scope.this_data;
                ctrl.tableData = createTableDataFrom(ctrl.interfaceRow);
            });

        $scope.$watch(
            function() {
                return ctrl.interfaceRow;
            },
            function() {
                ctrl.usedInterfaces = getUsedInterfaces(ctrl.interfaceRow);
                ctrl.assignedNetworkGroups = getAssignedNetworkGroups(ctrl.interfaceRow);
            },
            true
        );

        ctrl.tableData = createTableDataFrom(ctrl.interfaceRow);
        ctrl.tableHeaders = [
            {
                label: 'server_assocs.interface_models.device_name',
                key: 'interfaceName'
            },
            {
                label: 'server_assocs.interface_models.bond_alias',
                key: 'deviceName'
            },
            {
                label: 'server_assocs.interface_models.iface',
                key: 'bondDevices'
            },
            {
                label: 'server_assocs.interface_models.network_grp',
                key: 'network-group'
            }
        ];

        ctrl.tableConfig = {
            btn: {
                add: 'server_assocs.interface_models.interfaces.btn.add',
                edit: 'server_assocs.interface_models.interfaces.btn.edit',
                del: 'server_assocs.interface_models.interfaces.btn.del'
            }
        };

        ctrl.deleteInterface = function(data) {
            var deleteCfg = {
                confirmNo: 'installer.btn.cancel',
                confirmYes: 'installer.btn.remove',
                message: 'server_assocs.interface_models.interfaces.delete_msg',
                title: 'server_assocs.interface_models.interfaces.delete_title'
            };

            ConfirmModalService
                .open(deleteCfg, data)
                .then(function() {
                    var dataIdx = _.findIndex(ctrl.tableData, data);
                    if (dataIdx > -1) {
                        ctrl.tableData.splice(dataIdx, 1);
                    }
                    dataIdx = _.findIndex(ctrl.interfaceRow.model['network-interfaces'], function(o) {
                        return o.name === data.interfaceName;
                    });
                    if (dataIdx > -1) {
                        ctrl.interfaceRow.model['network-interfaces'].splice(dataIdx, 1);
                    }
                });
        };

        ctrl.editInterface = function(data) {
            var modalScope = $scope.$new();
            modalScope.interfaceModelName = ctrl.interfaceRow.model ? ctrl.interfaceRow.model.name : '';

            var dataIdx = _.findIndex(ctrl.interfaceRow.model['network-interfaces'], function(o) {
                return o.name === data.interfaceName;
            });
            modalScope.data = dataIdx > -1 ? ctrl.interfaceRow.model['network-interfaces'][dataIdx] : {};

            modalScope.title = 'server_assocs.interface_models.interfaces.edit';
            var editModal = $modal.open({
                templateUrl: path + '/installer/server_assocs/edit_network_interfaces/new_interface.html',
                size: 'lg',
                controller: 'NewInterfaceController as newInterfaceCtrl',
                resolve: {
                    assignedInterfaces: function() {
                        return ctrl.usedInterfaces;
                    },
                    assignedNetworkGroups: function() {
                        return ctrl.assignedNetworkGroups;
                    }
                },
                scope: modalScope
            });

            editModal.result.then(function(result) {
                var parsedResult = parseModalResult(result);
                var dataIdx = _.findIndex(ctrl.interfaceRow.model['network-interfaces'], function(o) {
                    return o.name === data.interfaceName;
                });
                if (dataIdx > -1) {
                    ctrl.interfaceRow.model['network-interfaces'][dataIdx] = parsedResult;
                }

                ctrl.tableData = createTableDataFrom(ctrl.interfaceRow);
            });
        };

        ctrl.addInterface = function() {
            var modalScope = $scope.$new();
            modalScope.interfaceModelName = ctrl.interfaceRow.model ? ctrl.interfaceRow.model.name : '';
            modalScope.title = 'server_assocs.interface_models.interfaces.add';
            var addModal = $modal.open({
                templateUrl: path + '/installer/server_assocs/edit_network_interfaces/new_interface.html',
                size: 'lg',
                controller: 'NewInterfaceController as newInterfaceCtrl',
                resolve: {
                    assignedInterfaces: function() {
                        return ctrl.usedInterfaces;
                    },
                    assignedNetworkGroups: function() {
                        return ctrl.assignedNetworkGroups;
                    }
                },
                scope: modalScope
            });

            addModal.result.then(function(result) {
                var parsedResult = parseModalResult(result);
                checkAndInitializeModelOn(ctrl.interfaceRow);
                ctrl.interfaceRow.model['network-interfaces'].push(parsedResult);
                ctrl.tableData = createTableDataFrom(ctrl.interfaceRow);
            });
        };
    }

    function createTableDataFrom(row) {
        var tableData = [];
        if (!_.isEmpty(row) && !_.isEmpty(row.model) && !_.isEmpty(row.model['network-interfaces'])) {
            row.model['network-interfaces'].forEach(function(interface) {
                var data = {};
                if (angular.isDefined(interface['bond-data'])) {
                    data['bondDevices'] = _.map(interface['bond-data']['devices'], function(device) {
                        return device.name;
                    }).join(', ');
                    data['bond-options'] = interface['bond-data']['options'];
                    data['interfaceName'] = interface['name'];
                    data['deviceName'] = interface['device']['name'];
                } else {
                    data['interfaceName'] = interface['name'];
                    data['deviceName'] = interface.device.name;
                }
                var networkGroups = interface['network-groups'] || [];
                var forcedNetworkGroups = interface['forced-network-groups'] || [];
                var combinedNetworkGroups = _.sortBy(_.union(networkGroups, forcedNetworkGroups));
                data['network-group'] = combinedNetworkGroups.join(', ');
                tableData.push(data);
            });
        }
        return tableData;
    }

    function parseModalResult(result) {
        var resultingModel = {};
        var interfaces = [];
        var networkGroups = [];
        var forcedNetworkGroups = [];
        _.keys(result.interfaces).forEach(function(key) {
            if (result.interfaces[key]) {
                interfaces.push({name: key});
            }
        });
        _.keys(result.networkGroups).forEach(function(key) {
            if (result.networkGroups[key]) {
                // Check to see if it is forced
                if (_.get(result.forcedNetworkGroups, key)) {
                    forcedNetworkGroups.push(key);
                } else {
                    networkGroups.push(key);
                }
            }
        });

        if (interfaces.length > 1) {
            resultingModel['bond-data'] = {provider: 'linux'};
            resultingModel.device = {};
            resultingModel['bond-data']['devices'] = interfaces;
            resultingModel['bond-data'].options = result.bondOptions;
            resultingModel['name'] = result.interfaceName || '';
            resultingModel.device['name'] = result.bondAlias || '';
        } else {
            resultingModel.device = {};
            resultingModel.device['name'] = interfaces[0].name;
            resultingModel['name'] = result.interfaceName || '';
        }
        resultingModel['network-groups'] = networkGroups;
        resultingModel['forced-network-groups'] = forcedNetworkGroups;

        return resultingModel;
    }

    function checkAndInitializeModelOn(row) {
        if (angular.isUndefined(row.model)) {
            row.model = {
                name: '',
                'network-interfaces': []
            };
        } else if (angular.isUndefined(row.model['network-interfaces'])) {
            row.model['network-interfaces'] = [];
        }
    }

    function getUsedInterfaces(interfaces) {
        var usedInterfaces = [];

        if (angular.isUndefined(interfaces.model) ||
            angular.isUndefined(interfaces.model['network-interfaces'])) {
            return usedInterfaces;
        }

        interfaces.model['network-interfaces'].forEach(function(interface) {
            if (interface['bond-data'] && interface['bond-data'].devices) {
                _.each(interface['bond-data'].devices, function(device) {
                    if (!_.includes(usedInterfaces, device.name)) {
                        usedInterfaces.push(device.name);
                    }
                });
            } else {
                usedInterfaces.push(interface.device.name);
            }
        });

        return usedInterfaces;
    }

    function getAssignedNetworkGroups(interfaces) {
        var assignedGroups = [];

        if (angular.isUndefined(interfaces.model) ||
            angular.isUndefined(interfaces.model['network-interfaces'])) {
            return assignedGroups;
        }

        interfaces.model['network-interfaces'].forEach(function(interface) {
            var networkGroups = interface['network-groups'] || [];
            var forcedNetworkGroups = interface['forced-network-groups'] || [];
            var combinedNetworkGroups = _.union(networkGroups, forcedNetworkGroups);
            combinedNetworkGroups.forEach(function(group) {
                assignedGroups.push(group);
            });
        });

        return assignedGroups;
    }
})();
