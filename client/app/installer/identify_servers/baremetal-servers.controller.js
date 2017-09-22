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
        .controller('BaremetalServersController', BaremetalServersController);

    BaremetalServersController.$inject = [
        'app.basePath',
        '$scope',
        '$translatePartialLoader',
        '$translate',
        'ardanaInstallationData',
        'DrawerService'
    ];

    function BaremetalServersController(path, $scope, $translatePartialLoader, $translate, ardanaInstallationData,
                                        DrawerService) {
        var ctrl = this;
        var requiredFields = ['netmask', 'subnet'];
        var serverRequiredFields = ['id', 'role', 'nic-mapping', 'ip-addr'];
        var bmServerRequiredFields = ['mac-addr', 'ilo-ip', 'ilo-user', 'ilo-password'];

        $translatePartialLoader.addPart('identify_servers');
        $translate.refresh();

        ctrl.config = {
            btn: {
                add: 'identify_servers.servers.btn.add',
                edit: 'identify_servers.servers.btn.edit',
                del: 'identify_servers.servers.btn.delete'
            },
            drawer: {
                addTitle: 'identify_servers.servers.add',
                editTitle: 'identify_servers.servers.edit',
                commitLabel: 'identify_servers.servers.btn.complete',
                continueLabel: 'identify_servers.servers.btn.next',
                showContinue: true,
                template: path + 'installer/identify_servers/add_baremetal_server.html',
                metadata: {
                    roles: []
                }
            },
            deleteConfig: {
                message: 'identify_servers.delete_msg',
                title: 'identify_servers.delete_title'
            },
            title: 'identify_servers.title'
        };
        ctrl.detailTemplate = path + 'installer/identify_servers/bmserver_detail.html';
        ctrl.tableHeaders = [
            {label: 'identify_servers.servers.node_name', key: 'id', sorted: true},
            {label: 'identify_servers.servers.role', key: 'role'},
            {label: 'identify_servers.servers.ip_addr', key: 'ip-addr'},
            {label: 'identify_servers.servers.group', key: 'server-group'},
            {label: 'identify_servers.servers.nic_map', key: 'nic-mapping'}
        ];

        ctrl.headerTemplate = path + 'installer/identify_servers/section_identify_servers_header.html';
        ctrl.headerOptions = {
            import: function() {
                ctrl.importFile();
            }
        };

        ctrl.addBmServerWithDrawer = function() {
            ctrl.config.drawer.title = ctrl.config.drawer.addTitle;
            ctrl.config.drawer.showContinue = true;

            if (!ardanaInstallationData.options.install_os) {
                ctrl.config.drawer.template = path + 'installer/identify_servers/server.html';
            } else {
                ctrl.config.drawer.template = path + 'installer/identify_servers/add_baremetal_server.html';
            }

            DrawerService
                .open(ctrl.config.drawer, {})
                .then(
                    function(data) {
                        ctrl.data.baremetalConfig.baremetal_servers.push(data);
                        ardanaInstallationData.dataChanged('server', data);
                    },
                    angular.noop,
                    function(data) {
                        ctrl.data.baremetalConfig.baremetal_servers.push(data);
                        ardanaInstallationData.dataChanged('server', data);
                    }
                );
        };

        ctrl.importConfig = {
            drawer: {
                template: path + 'installer/identify_servers/import_servers.html',
                wizard: {}
            }
        };

        ctrl.importFile = function() {
            DrawerService
                .open(ctrl.importConfig.drawer, {})
                .then(
                    function(data) {
                        _.each(data, function(server) {
                            ctrl.data.baremetalConfig.baremetal_servers.push(server);
                            ardanaInstallationData.dataChanged('server', server);
                        });
                    }
                );
        };

        ctrl.editBmNetworkWithDrawer = function() {
            var drawerConfig = {
                title: 'identify_servers.network.title',
                template: path + 'installer/identify_servers/add_baremetal_network.html',
                metadata: {
                    requestPassword: ardanaInstallationData.options.install_os
                }
            };

            DrawerService
                .open(drawerConfig, ctrl.data.baremetalConfig.baremetal_network)
                .then(
                    function updateBmNetwork(data) {
                        angular.extend(ctrl.data.baremetalConfig.baremetal_network, data);
                        ctrl.bm_network_edited = true;
                        validateStep();
                    },
                    angular.noop
                );
        };

        ctrl.editBmServer = function(data) {
            var drawerConfig = ctrl.config.drawer;
            drawerConfig.title = drawerConfig.editTitle;
            drawerConfig.showContinue = false;

            if (!ardanaInstallationData.options.install_os) {
                ctrl.config.drawer.template = path + 'installer/identify_servers/server.html';
            } else {
                ctrl.config.drawer.template = path + 'installer/identify_servers/add_baremetal_server.html';
            }

            DrawerService
                .open(drawerConfig, data ? data : {})
                .then(function(newData) {
                    angular.extend(data, newData);
                    ardanaInstallationData.dataChanged('server', data);
                    validateStep();
                });
        };

        $scope.$watch(function() {
            return ctrl.data.baremetalConfig.baremetal_servers.length;
        }, validateStep);

        $scope.$on('installOs.update', function() {
            ctrl.config.drawer.metadata.installOs = ardanaInstallationData.options.install_os;
            updateDetailTemplate();
            validateStep();
        });

        $scope.$on('ardanaInstallationData.update', function() {
            setBmServerData();
        });

        setBmServerData();

        function setBmServerData() {
            ctrl.data = {
                baremetalConfig: {
                    baremetal_network: ardanaInstallationData.data.baremetal,
                    baremetal_servers: ardanaInstallationData.data.servers
                }
            };

            ctrl.config.drawer.metadata.nicMappings = ardanaInstallationData.data['nic-mappings'];
            ctrl.config.drawer.metadata.roles = ardanaInstallationData.data['server-roles'];
            ctrl.config.drawer.metadata.serverGroups = ardanaInstallationData.data['server-groups'];
            ctrl.config.drawer.metadata.installOs = ardanaInstallationData.options.install_os;

            var bmCfg = ctrl.data.baremetalConfig;
            ctrl.bm_network_edited = !_.isEmpty(bmCfg.baremetal_network);

            if (angular.isUndefined(bmCfg.baremetal_servers)) {
                bmCfg.baremetal_servers = [];
            }

            ctrl.config.drawer.metadata.servers = bmCfg && bmCfg.baremetal_servers || [];

            updateDetailTemplate();
            validateStep();
        }

        function updateDetailTemplate() {
            if (ardanaInstallationData.options.install_os) {
                ctrl.detailTemplate = path + 'installer/identify_servers/bmserver_detail.html';
            } else {
                ctrl.detailTemplate = path + 'installer/identify_servers/server_detail.html';
            }
        }

        function validateStep() {
            var bmCfg = ctrl.data.baremetalConfig;
            var installOs = ardanaInstallationData.options.install_os;

            var networkValid = _.every(requiredFields, function(key) {
                var value = bmCfg.baremetal_network && bmCfg.baremetal_network[key];
                return angular.isDefined(value) && value !== null;
            });

            var stepRequiredFields = serverRequiredFields;
            if (installOs) {
                stepRequiredFields = stepRequiredFields.concat(bmServerRequiredFields);
            }
            var validServers = _.every(bmCfg.baremetal_servers, function(server) {
                return _.every(stepRequiredFields, function(key) {
                    return angular.isDefined(server[key]) && server[key] !== null;
                });
            });

            var valid = networkValid && bmCfg.baremetal_servers.length > 0 && validServers &&
                (!installOs || angular.isDefined(bmCfg.baremetal_network.user_password));

            $scope.$emit('step:validation', {id: 'identify_servers', valid: valid});
        }
    }

})();
