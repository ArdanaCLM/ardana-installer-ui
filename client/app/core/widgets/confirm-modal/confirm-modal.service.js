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
        .service('ConfirmModalService', ConfirmModalService);

    ConfirmModalService.$inject = ['app.basePath', '$modal'];

    function ConfirmModalService(path, $modal) {
        var service = {
            open: open
        };
        return service;

        //////////

        function open(config, scope) {
            var modalConfig = {
                animation: true,
                templateUrl: path + 'core/widgets/confirm-modal/confirm-modal.html',
                controller: 'ConfirmModalController',
                controllerAs: 'confirmCtrl',
                resolve: {
                    modalData: function() {
                        return scope;
                    },
                    modalConfig: function() {
                        return config;
                    },
                },
                size: 'sm'
            };

            return $modal.open(modalConfig).result;
        }
    }

})();
