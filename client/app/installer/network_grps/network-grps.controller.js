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
        .controller('NetworkGrpsController', NetworkGrpsController);

    NetworkGrpsController.$inject = [
        'app.basePath',
        '$scope',
        '$translatePartialLoader',
        '$translate',
        'ardanaInstallationData',
        'DrawerService'
    ];

    function NetworkGrpsController(path, $scope, $translatePartialLoader, $translate, dataService, DrawerService) {
        var ctrl = this;

        $translatePartialLoader.addPart('network_grps');
        $translate.refresh();

        var addLabel = $translate.instant('network_grps_add');
        var editLabel = $translate.instant('network_grps_edit');

        ctrl.data = dataService.data['network-groups'];
        ctrl.config = getModalConfigs(ctrl.data);
        ctrl.headerTemplate = path + 'installer/network_grps/network_group.header.html';
        ctrl.tableHeaders = [
            {label: 'network_grps.network_name', key: 'name', size: 'large'},
            {label: 'network_grps.vlan', key: 'vlanid', size: 'small'},
            {label: 'network_grps.tagged_vlan', key: 'tagged-vlan', size: 'medium'},
            {label: 'network_grps.cidr', key: 'cidr', size: 'medium'},
            {label: 'network_grps.gateway', key: 'gateway-ip', size: 'medium'},
            {label: 'network_grps.ip_range', key: ['start-address', 'end-address'], sep: ' to '}
        ];

        ctrl.addNetwork = function(group) {
            var addConfig = ctrl.config[group].drawer;
            addConfig.title = addConfig.addTitle;

            DrawerService
                .open(addConfig, {})
                .then(function(data) {
                    ctrl.data[group].networks.push(data);
                });
        };

        function updateNeutronProviderNetwork(oldCidr, newData) {
            // Patch the neutron network config, if there is one
            if (newData['network-group'] === 'MANAGEMENT') {
                var configDataItems = _.get(dataService.data._defaults, 'configuration-data');
                _.each(configDataItems, function(configData) {
                    var neutron = _.get(configData, 'data.neutron_provider_networks[0]');
                    if (neutron && neutron.host_routes) {
                        _.each(neutron.host_routes, function(route) {
                            if (route.destination === oldCidr) {
                                route.destination = newData.cidr;
                            }
                        });
                    }
                });
            }
        }

        ctrl.editNetwork = function(network) {
            var group = network['network-group'];
            var editConfig = angular.copy(ctrl.config[group].drawer);
            editConfig.title = editConfig.editTitle;
            editConfig.showContinue = false;

            DrawerService
                .open(editConfig, network)
                .then(function(newData) {
                    var oldCidr = network.cidr;
                    angular.extend(network, newData);
                    updateNeutronProviderNetwork(oldCidr, newData);
                });
        };

        $scope.$watch(function() {
            var length = _.reduce(ctrl.data, function(len, group) {
                var numNetworks = group.networks ? group.networks.length : 0;
                return len + numNetworks;
            }, 0);
            return length;
        }, function(newValue, oldValue) {
            validateStep();
        });

        $scope.$on('ardanaInstallationData.update', function() {
            ctrl.data = dataService.data['network-groups'];
            ctrl.config = getModalConfigs(ctrl.data);
        });

        function editTags(group) {
            var editTagConfig = {
                cancelLabel: 'installer.btn.cancel',
                commitLabel: 'installer.btn.save',
                template: path + 'installer/network_grps/network_group.html',
                title: 'network_grps.edit'
            };

            DrawerService
                .open(editTagConfig, group)
                .then(function(newGroup) {
                    angular.extend(group, newGroup);

                    if (angular.isDefined(group.tags) && _.isEmpty(group.tags)) {
                        delete group.tags;
                    }
                });
        }

        function getModalConfigs(data) {
            var modalConfigs = {};

            angular.forEach(data, function(group, name) {
                var groupConfig = {
                    btn: {
                        add: 'network_grps.btn.add',
                        edit: 'network_grps.btn.edit',
                        del: 'network_grps.btn.delete'
                    },
                    drawer: {
                        addTitle: addLabel + name,
                        editTitle: editLabel + name,
                        cancelLabel: 'installer.btn.cancel',
                        commitLabel: 'installer.btn.save',
                        template: path + 'installer/network_grps/network.html'
                    },
                    deleteConfig: {
                        message: 'network_grps.delete_msg',
                        title: 'network_grps.delete_title'
                    },
                    header: {
                        group: group,
                        editTags: editTags
                    },
                    title: name
                };

                modalConfigs[name] = groupConfig;
            });

            return modalConfigs;
        }

        function validateStep() {
            var networkGroupsValid = _.every(ctrl.data, function(group) {
                return group.networks && group.networks.length > 0;
            });

            $scope.$emit('step:validation', {id: 'network_grps', valid: networkGroupsValid});
        }
    }

})();
