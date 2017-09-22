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
        .controller('EditNicMappingController', EditNicMappingController);

    EditNicMappingController.$inject = [
        '$scope',
        '$modalInstance',
        'data',
        'title',
        'server',
        'nicMaps'
    ];

    function EditNicMappingController($scope, $modalInstance, nicMap, title, server, nicMaps) {
        var ports = nicMap['physical-ports'];

        $scope.nicMap = nicMap;
        $scope.title = title;
        $scope.server = server;
        $scope.nicMaps = nicMaps;
        $scope.numNics = ports.length || 1;

        $scope.addRemovePort = function() {
            if (!$scope.nicMapForm || $scope.nicMapForm.nicmap_numNics.$valid) {
                if ($scope.numNics > 0) {
                    var diff = $scope.numNics - $scope.nicMap['physical-ports'].length;
                    if (diff > 0) {
                        _.times(diff, function() {
                            $scope.nicMap['physical-ports'].push({type: 'simple-port'});
                        });
                    } else if (diff < 0) {
                        $scope.nicMap['physical-ports'].splice(diff, -diff);
                    }
                }
            }
        };

        $scope.update = function() {
            $modalInstance.close($scope.nicMap);
        };

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };

        $scope.addRemovePort();
    }

})();
