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
        .controller('ViewNicMappingsController', ViewNicMappingsController);

    ViewNicMappingsController.$inject = [
        'app.basePath',
        '$scope',
        '$translatePartialLoader',
        '$translate',
        'ardanaInstallationData',
        'DrawerService'
    ];

    function ViewNicMappingsController(path, $scope, $translatePartialLoader, $translate, dataService, DrawerService) {
        var ctrl = this;

        $translatePartialLoader.addPart('nic_mapping');
        $translate.refresh();

        ctrl.viewNicMappings = function() {
            var config = {
                commitLabel: 'nic_mapping.btn.save',
                title: 'nic_mapping.title',
                template: path + 'installer/nic_mapping/view_nic_mappings.html',
                table: {
                    config: {
                        btn: {
                            add: 'nic_mapping.btn.add',
                            edit: 'nic_mapping.btn.edit',
                            del: 'nic_mapping.btn.delete'
                        },
                        deleteConfig: {
                            message: 'nic_mapping.delete_msg',
                            title: 'nic_mapping.delete_title'
                        }
                    },
                    getEditModalConfig: getEditModalConfig,
                    tableHeaders: [
                        {label: 'nic_mapping.name', key: 'name'},
                        {label: 'nic_mapping.num_nics', key: '_numPorts'}
                    ]
                }
            };

            DrawerService
                .open(config, ctrl.data.nicMappings)
                .then(function(data) {
                    var nicMappings = ctrl.data.nicMappings;
                    nicMappings.length = 0;
                    nicMappings.push.apply(nicMappings, data);

                    updateServerNicMapNames(nicMappings);
                });
        };

        loadData();

        $scope.$on('ardanaInstallationData.update', function() {
            loadData();
        });

        function getEditModalConfig(data, server) {
            var addOrEdit = data ? 'edit' : 'add';
            var modalConfig = {
                animation: true,
                templateUrl: path + 'installer/nic_mapping/edit_nic_mapping.html',
                controller: 'EditNicMappingController',
                size: 'lg',
                resolve: {
                    data: function() {
                        return data ? angular.copy(data) : {'physical-ports': []};
                    },
                    title: function() {
                        return 'nic_mapping.' + addOrEdit;
                    },
                    server: function() {
                        return server;
                    },
                    nicMaps: function() {
                        return ctrl.data.nicMappings;
                    }
                }
            };

            return modalConfig;
        }

        function loadData() {
            ctrl.data = {
                nicMappings: dataService.data['nic-mappings'],
                servers: dataService.data.servers
            };

            // set number of ports
            angular.forEach(ctrl.data.nicMappings, function(nicMap) {
                nicMap._name = nicMap.name;
                nicMap._numPorts = angular.isDefined(nicMap['physical-ports']) ?
                    nicMap['physical-ports'].length : 0;
            });
        }

        function updateServerNicMapNames(nicMappings) {
            var nicMapNames = _.map(nicMappings, 'name');
            var editedNames = _.filter(nicMappings, function(nicMap) {
                return nicMap._name !== nicMap.name;
            });
            var nameMap = _.chain(editedNames)
                .map(function(nicMap) {
                    return [nicMap._name, nicMap.name];
                })
                .object()
                .value();

            angular.forEach(ctrl.data.servers, function(server) {
                var serverNicMapName = server['nic-mapping'];
                if (serverNicMapName) {
                    var newName = nameMap[serverNicMapName];
                    if (angular.isDefined(newName)) {
                        server['nic-mapping'] = newName;
                    } else if (nicMapNames.indexOf(serverNicMapName) < 0) {
                        delete server['nic-mapping'];
                    }
                }
            });

            _.each(editedNames, function(nicMap) {
                nicMap._name = nicMap.name;
            });
        }
    }

})();
