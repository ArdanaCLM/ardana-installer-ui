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
        .controller('NewInterfaceController', NewInterfaceController);

    NewInterfaceController.$inject = ['$scope', '$modalInstance', 'ardanaInstallationData', 'assignedInterfaces',
        'assignedNetworkGroups'];

    function NewInterfaceController($scope, $modalInstance, ardanaInstallationData, assignedInterfaces,
                                    assignedNetworkGroups) {
        var ctrl = this;

        $scope.bondRequired = false;
        ctrl.checkIfBondRequired = checkIfBondRequired;

        ctrl.interface = getInterfaceModel();
        ctrl.isInvalid = false;
        getNetworkGroups();

        $scope.$watch('data', function() {
            ctrl.interface = getInterfaceModel();
        });

        $scope.$on('json.conversion.failed', function() {
            ctrl.isInvalid = true;
        });

        $scope.$on('json.conversion.succeeded', function() {
            ctrl.isInvalid = false;
        });

        ctrl.save = function() {
            $modalInstance.close(ctrl.interface);
        };

        ctrl.cancel = function() {
            $modalInstance.dismiss();
        };

        checkIfBondRequired();

        function checkIfBondRequired() {
            var countAssignedInterfaces = 0;
            var interfaces = ctrl.interface.interfaces;
            for (var deviceName in interfaces) {
                if (interfaces[deviceName]) {
                    countAssignedInterfaces += 1;
                }
            }
            $scope.bondRequired = (countAssignedInterfaces > 1);
        }

        ctrl.isInterfaceUnavailable = function(name) {
            return !ctrl.interface.interfaces[name] && _.includes(assignedInterfaces, name);
        };

        ctrl.isNetworkGroupUnavailable = function(name) {
            return !ctrl.interface.networkGroups[name] && _.includes(assignedNetworkGroups, name);
        };

        ctrl.hasAtLeastOneNetworkGroupSelected = function() {
            return _.reduce(ctrl.interface.networkGroups, function(result, grp) {
                return grp ? (result + 1) : result;
            }, 0) > 0;
        };

        function getInterfaceModel() {
            var interfaceModel = {
                interfaces: {},
                networkGroups: getNetworkGroups(),
                forcedNetworkGroups: getNetworkGroups(),
                'interfaceName': '',
                'bondAlias': ''
            };

            // Get the logical names from NIC maps
            var nicMappings = ardanaInstallationData.data['nic-mappings'];
            if (angular.isDefined(nicMappings)) {
                angular.forEach(nicMappings, function(nicMap) {
                    var physicalPorts = nicMap['physical-ports'];
                    if (angular.isDefined(physicalPorts)) {
                        angular.forEach(physicalPorts, function(port) {
                            interfaceModel.interfaces[port['logical-name']] = false;
                        });
                    }
                });
            }

            if (angular.isDefined($scope.data)) {
                if (angular.isDefined($scope.data['bond-data'])) {
                    $scope.data['bond-data'].devices.forEach(function(data) {
                        interfaceModel.interfaces[data.name] = true;
                    });
                    interfaceModel.bondOptions = $scope.data['bond-data'].options;
                    interfaceModel.interfaceName = $scope.data.name;
                    interfaceModel.bondAlias = $scope.data.device.name;
                } else {
                    interfaceModel.interfaceName = $scope.data.name;
                    if ($scope.data.device.name) {
                        interfaceModel.interfaces[$scope.data.device.name] = true;
                    }
                }

                var networkGroups = $scope.data['network-groups'] || [];
                var forcedNetworkGroups = $scope.data['forced-network-groups'] || [];
                var combinedNetworkGroups = _.sortBy(_.union(networkGroups, forcedNetworkGroups));
                combinedNetworkGroups.forEach(function(groupName) {
                    interfaceModel.networkGroups[groupName] = true;
                    interfaceModel.forcedNetworkGroups[groupName] = _.contains(forcedNetworkGroups, groupName);
                });

            }

            return interfaceModel;
        }

        function getNetworkGroups() {
            var groups = {};
            _.keys(ardanaInstallationData.data['network-groups']).forEach(function(key) {
                groups[key] = false;
            });
            return groups;
        }
    }
})();
