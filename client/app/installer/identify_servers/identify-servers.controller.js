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
        .controller('IdentifyServersController', IdentifyServersController);

    IdentifyServersController.$inject = [
        'app.basePath',
        'ardanaInstallationData',
        'DrawerService'
    ];

    function IdentifyServersController(path, dataService, DrawerService) {
        var ctrl = this;

        ctrl.data = {
            servers: dataService.data.servers,
            serverRoles: dataService.data['server-roles']
        };
        ctrl.tableHeaders = [
            {label: 'identify_servers.servers.role', key: 'role'},
            {label: 'identify_servers.servers.node_name', key: 'id'},
            {label: 'identify_servers.servers.ip_addr', key: 'ip-addr'}
        ];
        ctrl.tableConfig = {
            btn: {
                add: 'identify_servers.servers.btn.add',
                edit: 'identify_servers.servers.btn.edit',
                del: 'identify_servers.servers.btn.delete'
            },
            drawer: {
                addTitle: 'identify_servers.servers.add',
                editTitle: 'identify_servers.servers.edit',
                cancelLabel: 'installer.btn.cancel',
                commitLabel: 'installer.btn.save',
                template: path + 'installer/identify_servers/server.html',
                metadata: {
                    roles: ctrl.data.serverRoles,
                    servers: ctrl.data.servers
                }
            },
            title: 'identify_servers.servers.title'
        };

        ctrl.editServer = function(data) {
            var drawerConfig = ctrl.tableConfig.drawer;
            drawerConfig.title = data ? drawerConfig.editTitle : drawerConfig.addTitle;

            DrawerService
                .open(drawerConfig, data ? data : {})
                .then(function(newData) {
                    if (data) {
                        angular.extend(data, newData);
                        dataService.dataChanged('server', data);
                    } else {
                        ctrl.data.servers.push(newData);
                    }
                });
        };
    }

})();
