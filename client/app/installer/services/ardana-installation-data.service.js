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
        .factory('ardanaInstallationData', ardanaInstallationData);

    ardanaInstallationData.$inject = ['$rootScope', 'config'];

    function ardanaInstallationData($rootScope, config) {
        var service = this, persistIntervalObj, persistIntervalMs;

        // initialize the config file data
        service = {
            dataMeta: {},
            data: {},
            options: {
                install_os: true
            },
            dataChanged: dataChanged,
            setData: setData,
            setPersistTimer: setPersistTimer
        };

        return service;

        //////////

        function dataChanged(key, data) {
            var broadcastEvent = 'ardanaInstallationData.update:' + key;
            $rootScope.$broadcast(broadcastEvent, data);
        }

        function setData(newConfigData) {
            service.dataMeta = {
                fileInfo: newConfigData.fileInfo,
                version: newConfigData.version,
                name: newConfigData.name
            };
            service.data = newConfigData.inputModel;

            $rootScope.$broadcast('ardanaInstallationData.update');
        }

        function setPersistTimer(msInterval) {
            if (msInterval > 0) {
                if (msInterval !== persistIntervalMs) {
                    clearInterval(persistIntervalObj);
                    persistIntervalObj = setInterval(_persist, msInterval);
                }
            } else {
                clearInterval(persistIntervalObj);
            }
            persistIntervalMs = msInterval;
        }

        function _persist() {
            config.persistConfig({
                fileInfo: service.dataMeta.fileInfo,
                data: service.data,
                version: service.dataMeta.version,
                name: service.dataMeta.name
            }).catch(function(err) {
                console.error('Failed to automatically persist input model', err);
            });
        }
    }
})();
