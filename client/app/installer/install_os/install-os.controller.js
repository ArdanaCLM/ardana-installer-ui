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
        .controller('InstallOsController', InstallOsController);

    InstallOsController.$inject = [
        'app.basePath',
        '$translatePartialLoader',
        '$translate'
    ];

    function InstallOsController(path, $translatePartialLoader, $translate) {
        var ctrl = this;

        $translatePartialLoader.addPart('install_os');
        $translate.refresh();

        ctrl.installOsOptions = [
            {
                label: 'install_os.yes_option.label',
                value: true,
                description: 'install_os.yes_option.desc'
            },
            {
                label: 'install_os.no_option.label',
                value: false,
                description: 'install_os.no_option.desc'
            }
        ];
    }

})();
