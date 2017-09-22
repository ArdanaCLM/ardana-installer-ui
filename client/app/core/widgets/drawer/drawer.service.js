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
        .service('DrawerService', DrawerService);

    DrawerService.$inject = ['$rootScope', '$q'];

    function DrawerService($rootScope, $q) {
        var drawerConfig = {
            deferred: null
        };

        var service = {
            open: open,
            notify: notify,
            reject: reject,
            resolve: resolve
        };
        return service;

        //////////

        function open(config, data) {
            var previousDeferred = drawerConfig.deferred;
            drawerConfig.deferred = $q.defer();

            if (previousDeferred) {
                previousDeferred.reject('only one drawer allowed');
            }

            $rootScope.$emit('drawer.open', config, data);

            return drawerConfig.deferred.promise;
        }

        function notify(notification) {
            if (!drawerConfig.deferred) {
                return;
            }

            drawerConfig.deferred.notify(notification);
        }

        function reject(reason) {
            if (!drawerConfig.deferred) {
                return;
            }

            drawerConfig.deferred.reject(reason);
            drawerConfig.deferred = null;
            $rootScope.$emit('drawer.close');
        }

        function resolve(response) {
            if (!drawerConfig.deferred) {
                return;
            }

            drawerConfig.deferred.resolve(response);
            drawerConfig.deferred = null;
            $rootScope.$emit('drawer.close');
        }
    }

})();
