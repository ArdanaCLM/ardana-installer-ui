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
        .directive('ardanaNumericButtons', ardanaNumericButtons);

    ardanaNumericButtons.$inject = ['app.basePath'];

    function ardanaNumericButtons(path) {
        return {
            restrict: 'E',
            scope: {
                for: '@'
            },
            templateUrl: path + 'core/widgets/ardana-numeric-buttons/ardana-numeric-buttons.html',
            controller: numericButtonscontroller,
            controllerAs: 'ctrl',
            replace: true
        };

        //////////

        function numericButtonscontroller($scope) {
            var ctrl = this;
            // Get the linked input element, so we can read the min and max values
            var el = angular.element('input#' + $scope.for);
            if (el) {
                ctrl.max = parseInt(el.attr('max'));
                ctrl.min = parseInt(el.attr('min'));
                ctrl.element = el;
                el.addClass('custom-spinner');
            }

            ctrl.increment = function(v) {
                var val = parseInt(ctrl.element.val());
                if (!val) {
                    val = angular.isDefined(ctrl.min) ? ctrl.min : 0;
                } else {
                    val++;
                    if (angular.isDefined(ctrl.max) && val > ctrl.max) {
                        val = ctrl.max;
                    }
                }
                ctrl.element.focus();
                ctrl.element.val(val);
                ctrl.element.triggerHandler('change');
            };

            ctrl.decrement = function(v) {
                var val = parseInt(ctrl.element.val());
                if (!val) {
                    val = angular.isDefined(ctrl.min) ? ctrl.min : 0;
                } else {
                    val--;
                    if (angular.isDefined(ctrl.min) && val < ctrl.min) {
                        val = ctrl.min;
                    }
                }
                ctrl.element.focus();
                ctrl.element.val(val);
                ctrl.element.triggerHandler('change');
            };
        }
    }
})();
