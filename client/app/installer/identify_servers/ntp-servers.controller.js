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
        .controller('NtpServersController', NtpServersController);

    NtpServersController.$inject = [
        'app.basePath',
        '$scope',
        'ardanaInstallationData'
    ];

    function NtpServersController(path, $scope, dataService, DrawerService) {
        var ctrl = this;

        ctrl.showNewForm = false;
        ctrl.ntpDetail = path + 'installer/identify_servers/ntp_detail.html';

        ctrl.config = {
            btn: {
                add: 'identify_servers.ntp_server.btn.add',
                edit: 'identify_servers.ntp_server.btn.edit',
                del: 'identify_servers.ntp_server.btn.delete'
            },
            deleteConfig: {
                message: 'identify_servers.ntp_server.delete_msg',
                title: 'identify_servers.ntp_server.delete_title'
            },
            title: 'identify_servers.ntp_server.title'
        };
        ctrl.tableHeaders = [
            {label: 'identify_servers.ntp_server.name', key: 'name'}
        ];

        ctrl.addNtpServer = function() {
            ctrl.newNtpServer = '';
            ctrl.showNewForm = true;
        };

        ctrl.editNtpServer = function(data) {
            data._name = data.name;
            data._expanded = true;
        };

        ctrl.cancelAdd = function() {
            ctrl.showNewForm = false;
        };

        ctrl.saveNewNtpServer = function() {
            if (!$scope.this_data.cloud['ntp-servers']) {
                $scope.this_data.cloud['ntp-servers'] = [];
            }

            $scope.this_data.cloud['ntp-servers'].push({name: ctrl.newNtpServer});
            ctrl.showNewForm = false;

            if (angular.isDefined($scope.newNtpServerForm)) {
                $scope.newNtpServerForm.$setPristine();
            }
        };
    }

})();
