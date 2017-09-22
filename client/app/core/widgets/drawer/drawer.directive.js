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
        .module('dayzero')
        .directive('drawer', drawer);

    drawer.$inject = ['app.basePath', '$rootScope', 'DrawerService', '$window'];

    function drawer(path, $rootScope, DrawerService, $window) {
        var directive = {
            link: link,
            restrict: 'E',
            scope: {},
            templateUrl: path + 'core/widgets/drawer/drawer.html'
        };
        return directive;

        function link($scope) {
            var defaultLabels = {
                cancelLabel: 'Cancel',
                commitLabel: 'Submit',
                continueLabel: 'Continue'
            };

            $scope.cancel = function() {
                if ($scope.config && $scope.config.wizard && $scope.config.wizard.cancel) {
                    $scope.config.wizard.cancel();
                } else {
                    DrawerService.reject('cancel');
                }
            };

            $scope.commit = function() {
                DrawerService.resolve($scope.this_data);
            };

            $scope.continue = function() {
                var savedData = $scope.this_data;
                DrawerService.notify(savedData);

                $scope.this_data = {};
                $scope.drawerForm.$setPristine();
            };

            $scope.next = function() {
                $scope.config.wizard.next();
            };

            $scope.previous = function() {
                $scope.config.wizard.previous();
            };

            $rootScope.$on('drawer.open', handleDrawerOpen);
            $rootScope.$on('drawer.close', handleDrawerClose);

            function handleDrawerOpen(event, config, data) {
                $scope.active = true;
                $scope.config = angular.extend({}, defaultLabels, config);
                $scope.this_data = angular.copy(data) || {};
                $scope.drawerForm.$setPristine();
            }

            function handleDrawerClose(event) {
                angular.forEach($scope.drawerForm, function(property) {
                    if (property && property.$invalid) {
                        property.$$lastCommittedViewValue = undefined;
                        property.$rollbackViewValue();
                    }
                });
                $scope.active = false;
            }
        }
    }

})();
