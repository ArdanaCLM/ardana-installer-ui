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
        .factory('ardanaDeployer', ardanaDeployer);

    ardanaDeployer.$inject = ['constants', 'app.api.errorCodes', '$http', '$q', '$interval'];

    function ardanaDeployer(constants, errorCodes, $http, $q, $interval) {
        var apiPath = constants.API_ROOT + '/';

        return {
            installOs: installOs,
            commitConfig: commitConfig
        };

        function installOs(osConfig) {
            var installOsDeferred = $q.defer();

            // strip unused keys
            var cleanOsConfig = stripUnderscoreKeys(osConfig);

            if (angular.isDefined(cleanOsConfig) && angular.isDefined(cleanOsConfig.servers)) {
                angular.forEach(cleanOsConfig.servers, function(server) {
                    var serverGroup = server['server-group'];
                    if (angular.isDefined(serverGroup) && serverGroup === null) {
                        delete server['server-group'];
                    }
                });
            }

            $http
                .post(apiPath + 'osinstall', cleanOsConfig)
                .then(function() {
                    // check every 5 seconds for install status
                    var installOsStatusCheck = $interval(function() {
                        $http.get(apiPath + 'osinstall').then(function(response) {
                            var data = {
                                serverStatuses: response.data.servers
                            };

                            if (response.data.finished) {
                                if (response.data.stderr || response.data.hasError) {
                                    installOsDeferred.reject(data);
                                } else {
                                    installOsDeferred.resolve(data);
                                }

                                $interval.cancel(installOsStatusCheck);
                            } else {
                                installOsDeferred.notify(data);
                            }
                        });
                    }, 5000);
                })
                .catch(function(err) {
                    installOsDeferred.reject(err);
                });

            return installOsDeferred.promise;
        }

        function stripUnderscoreKeys(cfgCloudDef) {
            if (angular.isArray(cfgCloudDef)) {
                return _.map(cfgCloudDef, function(arrayObj) {
                    return stripUnderscoreKeys(arrayObj);
                });
            } else if (angular.isObject(cfgCloudDef)) {
                var strippedOutput = _.omit(cfgCloudDef, function(value, key, obj) {
                    return key.indexOf('_') === 0;
                });

                angular.forEach(strippedOutput, function(value, key) {
                    strippedOutput[key] = stripUnderscoreKeys(value);
                });

                return strippedOutput;
            } else {
                return cfgCloudDef;
            }
        }

        function commitConfig(commitMessage) {
            commitMessage = commitMessage || 'Committed via Ardana OpenStack Installer';
            return $http.post(apiPath + 'model/commit', {message: commitMessage})
                .catch(function(response) {
                    // The commit request will fail if there are no changes to commit (i.e. in the re-deploy case).
                    // Ensure that this is caught and ignored.
                    if (response && response.data && response.data.errorCode === errorCodes.COMMIT_NO_CHANGES.code) {
                        // Return an empty object signifying successful promise
                        return {};
                    }
                    // Return a rejected promise as if catch didn't exist
                    return $q.reject(response);
                });
        }

    }

})();
