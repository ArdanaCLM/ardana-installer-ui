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
        .factory('config', config);

    config.$inject = ['constants', '$http', '$q'];

    function config(constants, $http, $q) {
        var apiPath = constants.API_ROOT + '/';
        var modalHashCode;

        var config = {
            persistConfig: persistConfig,
            getPersistedConfig: getPersistedConfig,
            getCloudTypes: getCloudTypes,
            getConfig: getConfig,
            getExpandedModel: getExpandedModel
        };

        return config;

        /**
         * Return the available cloud types for deploy
         */
        function getCloudTypes() {
            return $http.get(apiPath + 'templates').then(function(response) {
                // Sort templates by their template name
                if (angular.isArray(response.data)) {
                    response.data = _.sortBy(response.data, function(template) {
                        return template.name;
                    });
                }
                return response.data;
            });
        }

        /**
         * Return the configuration for the specified example
         */
        function getConfig(example) {
            var query = apiPath + 'templates/' + example;

            return $http.get(query).then(function(response) {
                if (response.data && response.data.errors && response.data.errors.length > 0) {
                    return $q.reject(response.data.errors);
                } else {
                    // Transmogrify backend response into something the front end can work with
                    response.data.inputModel = _parseCloudConfig(response.data.inputModel);
                    return response.data;
                }
            });
        }

        /**
         * Return configuration that the user has previously persisted
         */
        function getExpandedModel() {
            var query = apiPath + 'model/expanded';

            return $http.get(query).then(function(response) {
                if (response.data && response.data.errors && response.data.errors.length > 0) {
                    return $q.reject(response.data.errors);
                } else {
                    return response.data;
                }
            });
        }

        /**
         * Return configuration that the user has previously persisted
         */
        function getPersistedConfig() {
            var query = apiPath + 'model';

            return $http.get(query).then(function(response) {
                if (response.data && response.data.errors && response.data.errors.length > 0) {
                    return $q.reject(response.data.errors);
                } else {
                    response.data.inputModel = _parseCloudConfig(response.data.inputModel);
                    modalHashCode = _hashCode(response.data.inputModel);
                    return response.data;
                }
            });
        }

        /**
         * Persist the configuration edited by the installer
         */
        function persistConfig(cloudDef) {
            // FIXME: should rename data to inputModel for consistency with the service response
            if (!cloudDef || !cloudDef.fileInfo || !cloudDef.version || !cloudDef.name || !cloudDef.data) {
                return $q.reject('Missing required object or value in cloudDef');
            }

            // Ensure that we don't push a model that already exists in the backend.
            // This also ensures any repeat calls, for instances those on timers, do not interrupt the deploy process
            var currentHashCode = _hashCode(cloudDef.data);
            if (modalHashCode === currentHashCode) {
                // The current model matches the persisted model, return an 'ok' http response
                return $q.when({status: 200, data: {}});
            }

            return $http.post(apiPath + 'model', {
                name: cloudDef.name,
                version: cloudDef.version,
                fileInfo: cloudDef.fileInfo,
                inputModel: _parseClientConfig(cloudDef.data)
            }).then(function(response) {
                modalHashCode = currentHashCode;
                return response;
            });
        }

        function _stripUnderscoreKeys(cfgCloudDef) {
            if (angular.isArray(cfgCloudDef)) {
                return _.map(cfgCloudDef, function(arrayObj) {
                    return _stripUnderscoreKeys(arrayObj);
                });
            } else if (angular.isObject(cfgCloudDef)) {
                var strippedOutput = _.omit(cfgCloudDef, function(value, key, obj) {
                    return key.indexOf('_') === 0;
                });

                angular.forEach(strippedOutput, function(value, key) {
                    strippedOutput[key] = _stripUnderscoreKeys(value);
                });

                return strippedOutput;
            } else {
                return cfgCloudDef;
            }
        }

        /**
         * Convert the configuration from the official input model format to that required by the installer. This
         * adds ease of use accesors amongst other things.
         */
        function _parseCloudConfig(cloudConfig) {

            if (!cloudConfig) {
                cloudConfig = {};
            }

            // Create a new model object in the format required by the installer. This includes storing any non-required
            // properties in '_defaults'
            var clientConfig = {
                '_defaults': {},
                'baremetal': {},
                'disk-models': [],
                'interface-models': [],
                'network-groups': {},
                'nic-mappings': [],
                'server-groups': [],
                'server-roles': [],
                'servers': []
            };

            // For each property in the input modal pull out any we specifically need, store the rest.
            angular.forEach(cloudConfig, function(value, key) {

                switch (key) {
                    case 'disk-models':
                        angular.forEach(value, function(diskModel) {
                            clientConfig['disk-models'].push(diskModel);
                        });
                        break;
                    case 'interface-models':
                        angular.forEach(value, function(interfaceModel) {
                            clientConfig['interface-models'].push(interfaceModel);
                        });
                        break;
                    case 'network-groups':
                        angular.forEach(value, function(networkGroup) {
                            var cloudNetworkGroup = clientConfig['network-groups'][networkGroup.name];
                            networkGroup.networks = [];
                            if (angular.isDefined(cloudNetworkGroup)) {
                                networkGroup.networks = cloudNetworkGroup.networks;
                            }
                            clientConfig['network-groups'][networkGroup.name] = networkGroup;
                        });
                        break;
                    case 'networks':
                        angular.forEach(value, function(network) {
                            var networkGroup = network['network-group'];
                            if (angular.isDefined(clientConfig['network-groups'][networkGroup])) {
                                clientConfig['network-groups'][networkGroup].networks.push(network);
                            } else {
                                clientConfig['network-groups'][networkGroup] = {
                                    name: networkGroup,
                                    networks: [network]
                                };
                            }
                        });
                        break;
                    case 'nic-mappings':
                    case 'server-groups':
                    case 'server-roles':
                        clientConfig[key] = value;
                        break;
                    case 'servers':
                        clientConfig.baremetal = cloudConfig.baremetal || {};
                        clientConfig.servers = cloudConfig.servers || [];
                        break;
                    default:
                        // Save anything else to 'defaults' to be brought back into the model before model is pushed to
                        // server (ignore baremetal, it's dealt with as a special case).
                        if (key !== 'baremetal') {
                            clientConfig._defaults[key] = value;
                        }
                        break;
                }
            });

            // Recreate the 'cloud' object in the baremetal property
            var cloudData = {};
            if (angular.isDefined(cloudConfig.cloud)) {
                // NTP Servers
                cloudData['ntp-servers'] = _.map(cloudConfig.cloud['ntp-servers'], function(ntpServer) {
                    return {name: ntpServer};
                });
                // DNS Name Servers
                var dnsSettings = cloudConfig.cloud['dns-settings'];
                if (dnsSettings && dnsSettings['nameservers'] && dnsSettings['nameservers'].length) {
                    cloudData['dns-settings'] = {};
                    cloudData['dns-settings']['nameservers'] = _.map(dnsSettings['nameservers'], function(nameServer) {
                        return {name: nameServer};
                    });
                }
            }
            clientConfig.baremetal.cloud = cloudData;

            return clientConfig;
        }

        /**
         * Convert the configuration from the format required by the installer into the official input model format
         */
        function _parseClientConfig(clientConfig) {

            // Recreate the input model in a format we can push to the backend
            var cloudConfig = {};

            // Add the defaults/non-installer required properties back in
            var defaultFiles = clientConfig._defaults || {};
            angular.forEach(defaultFiles, function(data, key) {
                cloudConfig[key] = data;
            });

            // Re-add the generic arrays that haven't been changed
            var configTypes = ['interface-models', 'nic-mappings', 'server-groups', 'server-roles'];
            angular.forEach(configTypes, function(configType) {
                var key = configType;
                if (angular.isDefined(clientConfig[key]) && _.size(clientConfig[key]) > 0) {
                    var cfgCloudDef = clientConfig[key];

                    if (key === 'server-groups') {
                        if (cfgCloudDef && cfgCloudDef.length > 0 && cfgCloudDef[0].name === null) {
                            cfgCloudDef.splice(0, 1);
                        }
                    }

                    cloudConfig[key] = cfgCloudDef;
                }
            });

            // Add servers + baremetal
            processServers();

            // Add disk-models
            var diskModels = clientConfig['disk-models'];
            if (angular.isDefined(diskModels) && _.size(diskModels) > 0) {
                processDiskModels();
            }

            // Add network-groups and networks
            var cloudNetworkGroups = clientConfig['network-groups'];
            if (angular.isDefined(cloudNetworkGroups) && _.size(cloudNetworkGroups) > 0) {
                processNetworkGroups();
            }

            function processServers() {
                // Convert the UI's config.baremetal.cloud object back into model's config.cloud
                if (angular.isDefined(clientConfig.baremetal)) {

                    // Ensure that we break the reference with the passed in clientModel
                    cloudConfig.baremetal = JSON.parse(JSON.stringify(clientConfig.baremetal || {}));

                    if (angular.isDefined(cloudConfig.baremetal.cloud)) {

                        // Convert the ntp-servers array format from [ { name: 'x'}, { name: 'y' } ] back to ['x', 'y']
                        var ntpServers = cloudConfig.baremetal.cloud['ntp-servers'];
                        if (angular.isDefined(ntpServers)) {
                            ntpServers = _.map(ntpServers, function(ntpSvr) {
                                return ntpSvr.name;
                            });
                            cloudConfig.baremetal.cloud['ntp-servers'] = ntpServers.length ? ntpServers : null;
                        }

                        // Convert DNS settings -> name servers back to array of names
                        // (UI uses array of objects so it can store other state)
                        var dnsSettings = cloudConfig.baremetal.cloud['dns-settings'];
                        if (dnsSettings) {
                            var nameServers = dnsSettings['nameservers'];
                            if (angular.isDefined(nameServers)) {
                                nameServers = _.map(nameServers, function(nameSvr) {
                                    return nameSvr.name;
                                });
                                dnsSettings['nameservers'] = nameServers.length ? nameServers : null;
                            }
                        }

                        // Create the config.cloud property from the config.baremetal.cloud object
                        cloudConfig.cloud = cloudConfig.cloud || {};
                        // (extend will overwrite existing properties at the root level in cloudConfig.cloud and
                        // add any new)
                        _.extend(cloudConfig.cloud, cloudConfig.baremetal.cloud);
                        // Remove the original
                        delete cloudConfig.baremetal.cloud;
                    }

                    // Don't persist the password
                    if (angular.isDefined(cloudConfig.baremetal.user_password)) {
                        delete cloudConfig.baremetal.user_password;
                    }
                }

                // Remove server 'null' server-group properties (if found)
                if (angular.isDefined(clientConfig.servers) && _.size(clientConfig.servers) > 0) {
                    angular.forEach(clientConfig.servers, function(server) {
                        var serverGroup = server['server-group'];
                        if (angular.isDefined(serverGroup) && serverGroup === null) {
                            delete server['server-group'];
                        }
                    });
                    cloudConfig.servers = clientConfig.servers || [];
                }
            }

            function processDiskModels() {
                angular.forEach(diskModels, function(diskModel) {
                    var groupTypeCount = 2;
                    var deviceGroups = diskModel['device-groups'];
                    var volumeGroups = diskModel['volume-groups'];

                    if (angular.isUndefined(deviceGroups) || deviceGroups.length === 0) {
                        delete diskModel['device-groups'];
                        groupTypeCount--;
                    }

                    if (angular.isUndefined(volumeGroups) || volumeGroups.length === 0) {
                        delete diskModel['volume-groups'];
                        groupTypeCount--;
                    }

                    if (groupTypeCount > 0) {
                        cloudConfig['disk-models'] = cloudConfig['disk-models'] || [];
                        cloudConfig['disk-models'].push(diskModel);
                    }
                });
            }

            function processNetworkGroups() {
                var networkGroups = [], networks = [];
                angular.forEach(cloudNetworkGroups, function(networkGroup, networkGrpName) {
                    angular.forEach(networkGroup.networks, function(network, idx) {
                        network['network-group'] = networkGrpName;
                        networkGroup.networks[idx] = _.pick(network, function(value, key) {
                            return value !== null && value !== '';
                        });
                    });

                    networks = networks.concat(networkGroup.networks);
                    // Ensure we break the reference with the parsed in client model
                    networkGroup = JSON.parse(JSON.stringify(networkGroup));
                    delete networkGroup.networks;

                    if (networkGroup['load-balancers']) {
                        angular.forEach(networkGroup['load-balancers'], function(loadBalancer) {
                            if (loadBalancer['external-name'] === null) {
                                delete loadBalancer['external-name'];
                            }
                        });
                    }

                    networkGroups.push(networkGroup);
                });

                cloudConfig['network-groups'] = networkGroups;
                cloudConfig.networks = networks;
            }

            return _stripUnderscoreKeys(cloudConfig);
        }

        /**
         * TODO: move this to ardana-utils service in ardana-ui-common
         * TODO: bring in tests from app-core and update to test _ properties correctly skipped and hashkeys
         * This function returns a hash code (MD5) based on the argument object.
         * pmav, 2010
         *
         * NB: the following have no impact on the hash:
         * - nulls, undefined, empty arrays and empty objects
         * - properties starting with '_'
         * - '$$hashKey' properties
         * julien, 2016
         */
        function _hashCode(object) {

            var serialize = function(object) {
                // Private
                var i, element, subSerial;
                var serializedCode = '';

                // Bail early for null values
                if (object === null) {
                    return serializedCode;
                }

                var type = typeof object;
                switch (type) {
                    case 'object':
                        // Special case for date objects which don't have any properties
                        if (typeof object.getTime === 'function') {
                            serializedCode += object.getTime();
                        } else {
                            if (Array.isArray(object)) { // Order in Arrays should change the hashCode
                                for (i = 0; i < object.length; i++) {
                                    subSerial = serialize(object[i]);
                                    if (subSerial !== '') {
                                        serializedCode += subSerial;
                                    }
                                }
                            } else { // Order in objects shouldn't change the hashCode
                                var tmp = [];
                                for (element in object) {
                                    if (!object.hasOwnProperty(element)) {
                                        continue;
                                    }
                                    // RC ignore hash key properties or installer properties starting with underscore
                                    if (element !== '$$hashKey' && element[0] !== '_') {
                                        tmp.push(element);
                                    }
                                }
                                tmp.sort();
                                for (i = 0; i < tmp.length; i++) {
                                    element = tmp[i];
                                    subSerial = serialize(object[element]);
                                    if (subSerial !== '') {
                                        serializedCode += type + element + subSerial;
                                    }
                                }
                            }

                        }
                        break;
                    case 'function':
                        serializedCode += type + object.toString();
                        break;
                    default:
                        serializedCode += type + object;
                }
                return serializedCode;
            };

            return md5(serialize(object));
        }

    }

})();
