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
        .module('dayzero', [
            'pascalprecht.translate',
            'ngSanitize',
            'dayzero.installer',
            'ui.bootstrap',
            'ardanaCommon'
        ])
        .constant('app.basePath', 'app/')
        .constant('constants', {
            API_ROOT: '/dayzeroapi'
        })
        .constant('app.api.errorCodes', {
            COMMIT_NO_CHANGES: {
                code: 1
            }
        })
        .constant('app.persistIntervalMs', 20 * 1000)
        // DEMO Mode - disable OS selection etc - used for demo systems
        // You must edit this here, in place to enable
        .constant('app.demoMode', false)
        .config(translationConfig);

    // Translation configuration - load language JSON files from 'locales'
    translationConfig.$inject = [
        '$translateProvider',
        '$translatePartialLoaderProvider',
        'app.basePath'
    ];

    function translationConfig($translateProvider, $translatePartialLoaderProvider, path) {
        $translatePartialLoaderProvider.addPart('branding');
        $translatePartialLoaderProvider.addPart('common');
        $translatePartialLoaderProvider.addPart('get_started');
        $translatePartialLoaderProvider.addPart('cloud_needs');
        $translatePartialLoaderProvider.addPart('ready');
        $translatePartialLoaderProvider.addPart('errors');
        $translatePartialLoaderProvider.addPart('deploy');
        $translatePartialLoaderProvider.addPart('success');

        $translateProvider.useLoader('$translatePartialLoader', {
            urlTemplate: path + 'locales/{lang}/{part}.json'
        });

        $translateProvider.preferredLanguage('en');
        $translateProvider.useSanitizeValueStrategy('sanitize');
    }

})();
