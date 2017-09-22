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
        .controller('NicMapSelectorController', NicMapSelectorController);

    NicMapSelectorController.$inject = [
        'app.basePath',
        '$scope',
        '$modal'
    ];

    function NicMapSelectorController(path, $scope, $modal) {
        var ctrl = this;

        ctrl.addNic = {
            label: 'nic_mapping.btn.add',
            callback: addNicMappingWithModal
        };

        function addNicMappingWithModal() {
            var modalConfig = getEditModalConfig();
            var addModalInstance = $modal.open(modalConfig);

            addModalInstance.result.then(function(newNicMap) {
                newNicMap['physical-ports'] = _.sortBy(newNicMap['physical-ports'], function(port) {
                    return port['logical-name'];
                });

                newNicMap._numPorts = newNicMap['physical-ports'].length;

                $scope.config.metadata.nicMappings.push(newNicMap);
                $scope.this_data['nic-mapping'] = newNicMap.name;
            });
        }

        function getEditModalConfig() {
            var modalConfig = {
                animation: true,
                templateUrl: path + 'installer/nic_mapping/edit_nic_mapping.html',
                controller: 'EditNicMappingController',
                size: 'lg',
                resolve: {
                    data: function() {
                        return {'physical-ports': []};
                    },
                    title: function() {
                        return 'nic_mapping.add';
                    },
                    server: function() {
                        return $scope.this_data;
                    },
                    nicMaps: function() {
                        return $scope.config.metadata.nicMappings;
                    }
                }
            };

            return modalConfig;
        }
    }

})();
