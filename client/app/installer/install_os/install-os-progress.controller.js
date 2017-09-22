/**
 * (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
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
        .controller('InstallOsProgressController', InstallOsProgressController);

    InstallOsProgressController.$inject = [
        'app.basePath',
        '$scope',
        '$translatePartialLoader',
        '$translate',
        'ardanaInstallationData',
        'DrawerService',
        'ConfirmModalService'
    ];

    function InstallOsProgressController(path, $scope, $translatePartialLoader, $translate, ardanaInstallationData,
                                         DrawerService, ConfirmModalService) {
        var ctrl = this;

        $translatePartialLoader.addPart('install_os_progress');
        $translate.refresh();

        var drawerConfig = {
            title: 'identify_servers.servers.edit',
            commitLabel: 'identify_servers.servers.btn.complete',
            template: path + 'installer/identify_servers/add_baremetal_server.html',
            metadata: {
                roles: []
            }
        };

        ctrl.tableHeaders = [
            {label: 'install_os_progress.name', key: 'id', sorted: true},
            {label: 'install_os_progress.server', key: 'pxe_ip_addr'},
            {label: 'install_os_progress.server_status', key: '_status', translate: true}
        ];

        ctrl.editServer = function(data) {
            DrawerService
                .open(drawerConfig, data)
                .then(function updateBmNetwork(updatedBmServer) {
                    angular.extend(data, updatedBmServer);
                    var dataIdx = _.findIndex(ctrl.data.servers, data);
                    if (dataIdx > -1) {
                        ardanaInstallationData.dataChanged('server', ctrl.data.servers[dataIdx]);
                    }
                });
        };

        ctrl.removeServer = function(data) {
            var deleteCfg = {
                confirmNo: 'installer.btn.cancel',
                confirmYes: 'installer.btn.remove',
                message: 'install_os_progress.delete_msg',
                title: 'install_os_progress.delete_title'
            };

            ConfirmModalService
                .open(deleteCfg, data)
                .then(function() {
                    var dataIdx = _.findIndex(ctrl.data.servers, data);
                    if (dataIdx > -1) {
                        ctrl.data.servers.splice(dataIdx, 1);
                    }
                    validateServers();
                });
        };

        $scope.$on('ardanaInstallationData.update', function() {
            setBmServerData();
        });

        setBmServerData();

        function setBmServerData() {
            ctrl.data = {
                servers: ardanaInstallationData.data.servers,
                roles: ardanaInstallationData.data['server-roles'],
                serverGroups: ardanaInstallationData.data['server-groups'],
                nicMappings: ardanaInstallationData.data['nic-mappings']
            };

            drawerConfig.metadata.nicMappings = ctrl.data.nicMappings;
            drawerConfig.metadata.roles = ctrl.data.roles;
            drawerConfig.metadata.servers = ctrl.data.servers || [];
            drawerConfig.metadata.serverGroups = ctrl.data.serverGroups;
        }

        function validateServers() {
            var hasError = false;
            angular.forEach(ctrl.data.servers, function(server) {
                if (server._status === 'status.error' || server._status === 'status.pwr_error') {
                    hasError = true;
                }
            });

            if (!hasError && ctrl.data.servers.length > 0) {
                $scope.$emit('installOs:serversValid');
            }
        }
    }

})();
