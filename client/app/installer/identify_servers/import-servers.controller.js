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
        .controller('ImportServersController', ImportServersController);

    ImportServersController.$inject = [
        '$scope',
        '$translatePartialLoader',
        '$translate',
        'ardanaInstallationData',
        'DrawerService',
        'ServerCSVImportService'
    ];

    function ImportServersController($scope, $translatePartialLoader, $translate, ardanaInstallationData,
                                     DrawerService, ServerCSVImportService) {
        var ctrl = this;

        $translatePartialLoader.addPart('identify_servers');
        $translate.refresh();

        ctrl.wizard = $scope.config.wizard;

        ctrl.setStep = function(step) {
            ctrl.wizard.step = step;
            ctrl.setButtons();
        };

        ctrl.setButtons = function() {
            ctrl.wizard.busy = null;
            switch (ctrl.wizard.step) {
                case -1:
                    ctrl.wizard.busy = 'identify_servers.import.loading';
                    ctrl.wizard.title = 'identify_servers.import.title';
                    break;
                case 1:
                    ctrl.wizard.buttons.next = 'identify_servers.import.btn.complete';
                    ctrl.wizard.buttons.previous = 'identify_servers.import.btn.back';
                    ctrl.wizard.title = 'identify_servers.import.title.review';
                    break;
                case 2:
                case 3:
                    ctrl.wizard.buttons.next = null;
                    ctrl.wizard.buttons.previous = 'identify_servers.import.btn.back';
                    ctrl.wizard.title = 'identify_servers.import.title.error';
                    break;
                default:
                    ctrl.wizard.buttons.next = 'identify_servers.import.btn.continue';
                    ctrl.wizard.buttons.previous = null;
                    ctrl.wizard.title = 'identify_servers.import.title';
            }
        };

        ctrl.parse = function() {
            // Parse local CSV file
            ServerCSVImportService.parse($scope.csv_file, ardanaInstallationData.options.install_os)
                .then(function(data) {
                    // Okay - step 1 is reviewing the data in the CSF file
                    $scope.table = data;
                    ctrl.setStep(1);
                }).catch(function(error) {
                // Error occurred
                if (!error.parsed) {
                    // Step 2: could not read the CSV file (bad file or similar error)
                    ctrl.setStep(2);
                } else {
                    // Step 3: Read file, but missing fields
                    $scope.missing_fields = error.notFound;
                    ctrl.setStep(3);
                }
            });
        };

        /**
         * Reset state
         */
        ctrl.reset = function() {
            ctrl.wizard.step = 0;
            ctrl.wizard.buttons = {};
            ctrl.setButtons();
            $scope.csv_file = {};
            $scope.table = {};
            $scope.fileread = null;
            $scope.missing_fields = null;
            $scope.required_fields =
                ServerCSVImportService.getRequiredFields(ardanaInstallationData.options.install_os);
            $scope.optional_fields =
                ServerCSVImportService.getOptionalFields(ardanaInstallationData.options.install_os);
        };

        if (ctrl.wizard) {
            $scope.$watch('active', function(open) {
                if (open) {
                    ctrl.reset(); // Reset state of import UI when the drawer is open
                }
            });

            ctrl.wizard.next = function() {
                // Only step 0 and step 1 support next (0 -> reading, 1 -> finish)
                if (ctrl.wizard.step === 0) {
                    ctrl.setStep(-1);
                    // Kick off parsing of CSV File
                    ctrl.parse();
                } else {
                    // Clicked next on the final step
                    DrawerService.resolve(ServerCSVImportService.tableToArray($scope.table));
                }
            };

            ctrl.wizard.previous = function() {
                ctrl.setStep(0);
            };
        }
    };
})();
