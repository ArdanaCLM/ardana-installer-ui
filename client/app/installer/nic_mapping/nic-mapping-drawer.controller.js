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
        .controller('NicMappingDrawerController', NicMappingDrawerController);

    NicMappingDrawerController.$inject = ['app.basePath', '$scope', '$modal'];

    function NicMappingDrawerController(path, $scope, $modal) {
        var ctrl = this;

        ctrl.editNicMap = function(data) {
            var modalConfig = $scope.config.table.getEditModalConfig(data);
            var editModalInstance = $modal.open(modalConfig);

            editModalInstance.result.then(function(newNicMap) {
                newNicMap['physical-ports'] = _.sortBy(newNicMap['physical-ports'], function(port) {
                    return port['logical-name'];
                });
                newNicMap._numPorts = newNicMap['physical-ports'].length || 0;

                if (data) {
                    angular.extend(data, newNicMap);
                } else {
                    $scope.this_data.push(newNicMap);
                }
            });
        };
    }

})();
