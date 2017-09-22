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
        .directive('actionTable', actionTable);

    actionTable.$inject = ['app.basePath', 'defaultConfig', 'DrawerService', 'ConfirmModalService'];

    function actionTable(path, defaultCfg, DrawerService, ConfirmModalService) {
        var directive = {
            controller: 'ActionTableController as tableCtrl',
            link: link,
            restrict: 'E',
            scope: {
                actions: '=?',
                actionsLabel: '=?',
                config: '=?',
                detailTemplate: '=?',
                headerTemplate: '=?',
                headerOptions: '=?',
                noCrud: '=?',
                tableData: '=',
                tableHeaders: '=',
                addAction: '=?',
                editAction: '=?',
                deleteAction: '=?'
            },
            templateUrl: path + 'core/widgets/action-table/action-table.html',
            transclude: true
        };
        return directive;

        //////////

        function link(scope, element, attrs, ctrl, transclude) {
            var btnLabels = angular.isDefined(scope.config) ? scope.config.btn : {};
            scope.btnLabels = angular.extend({}, defaultCfg.btn, btnLabels);

            var drawerCfg = angular.isDefined(scope.config) ? scope.config.drawer : {};
            scope.drawerCfg = angular.extend({}, defaultCfg.drawer, drawerCfg);

            var deleteCfg = angular.isDefined(scope.config) ? scope.config.deleteConfig : {};
            scope.deleteCfg = angular.extend({}, defaultCfg.deleteConfig, deleteCfg);

            scope.showExpandIcon = angular.isDefined(attrs.showExpandIcon);
            scope.selectable = angular.isDefined(attrs.selectable);

            var numCols = scope.tableHeaders.length;
            scope.colSpan = numCols;

            if (!scope.noCrud) {
                var editAction = {
                    label: scope.btnLabels.edit,
                    callback: getEditCallback(scope)
                };

                var deleteAction = {
                    label: scope.btnLabels.del,
                    callback: getDeleteCallback(scope)
                };

                scope.actions = angular.isDefined(scope.actions) ?
                    scope.actions.concat([editAction, deleteAction]) : [editAction, deleteAction];
                scope.addAction = getAddCallback(scope);

                scope.$watch(function() {
                    return scope.noCrud;
                }, function(newValue, oldValue) {
                    if (newValue !== oldValue) {
                        if (newValue) {
                            scope.actions.splice(-2, 2);
                        } else {
                            scope.actions = scope.actions.concat([editAction, deleteAction]);
                        }
                    }
                });
            }

            if (scope.showExpandIcon) {
                scope.colSpan++;
            }

            if (!scope.noCrud || angular.isDefined(scope.actions)) {
                scope.colSpan++;
            }

            if (scope.selectable) {
                scope.colSpan++;
            }
        }

        function getEditCallback(scope) {
            var defaultEditAction = function(data) {
                var config = angular.copy(scope.drawerCfg);
                config.showContinue = false;
                config.title = config.editTitle;

                DrawerService
                    .open(config, data)
                    .then(function(newData) {
                        angular.extend(data, newData);
                    });
            };

            return angular.isDefined(scope.editAction) ? scope.editAction : defaultEditAction;
        }

        function getDeleteCallback(scope) {
            var defaultDeleteAction = function(data) {
                ConfirmModalService
                    .open(scope.deleteCfg, data)
                    .then(function() {
                        var dataIdx = _.findIndex(scope.tableData, data);
                        if (dataIdx > -1) {
                            scope.tableData.splice(dataIdx, 1);
                        }
                    });
            };

            return angular.isDefined(scope.deleteAction) ? scope.deleteAction : defaultDeleteAction;
        }

        function getAddCallback(scope) {
            var defaultAddAction = function(data) {
                var config = angular.copy(scope.drawerCfg);
                config.title = config.addTitle;

                DrawerService
                    .open(config, {})
                    .then(
                        function(data) {
                            scope.tableData.push(data);
                        },
                        angular.noop,
                        function(data) {
                            scope.tableData.push(data);
                        }
                    );
            };
            return angular.isDefined(scope.addAction) ? scope.addAction : defaultAddAction;
        }
    }
})();
