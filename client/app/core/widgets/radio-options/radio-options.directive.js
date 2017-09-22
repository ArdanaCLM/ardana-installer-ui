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

    /**
     * @ngdoc directive
     * @name radioOptions
     * @description
     * A widget that displays a set of options from which
     * the user can choose one.
     *
     * @restrict E
     * @example
     * ```
     * <radio-options options="ctrl.myOptions"
     *   model-value="ctrl.selectedOption"
     *   overview-template="'my_options.html'">
     * </radio-options>
     *
     * var ctrl = this;
     * ctrl.myOptions = [
     *   {
   *     value: 'option-one',
   *     label: 'Option One',
   *     description: 'This is the first option',
   *     overview: 'This is the first option overview'
   *   },
     *   {
   *     value: 'option-two',
   *     label: 'Option Two',
   *     description: 'This is the second option',
   *     overview: 'This is the second option overview'
   *   }
     * ];
     * ctrl.selectedOption = 'option-one';
     * ```
     */
    angular
        .module('dayzero')
        .directive('radioOptions', optionList);

    optionList.$inject = ['$timeout', 'app.basePath'];

    function optionList($timeout, path) {
        var directive = {
            link: link,
            restrict: 'E',
            scope: {
                modelValue: '=',
                onClick: '=?',
                options: '=',
                overviewTemplate: '=',
                beforeUpdateSelection: '=?',
                locked: '=?'
            },
            templateUrl: path + 'core/widgets/radio-options/radio-options.html'
        };
        return directive;

        //////////

        function link(scope, element) {
            var mouseTimeout;
            scope.hoverOption = 0;
            scope.hoverValue =
                (scope.options &&
                Array.isArray(scope.options) &&
                scope.options.length > 0) ? scope.options[0].value : '';

            // Option button clicked so update data
            scope.updateSelection = function updateSelection(optionValue) {
                if (optionValue === scope.modelValue) {
                    return;
                }

                if (angular.isFunction(scope.beforeUpdateSelection)) {
                    scope.beforeUpdateSelection().then(function() {
                        _updateSelection(optionValue);
                    });
                } else {
                    _updateSelection(optionValue);
                }
            };

            // Mouse entered the option button, so show its overview
            element.on('mouseenter', '.option-button', function() {
                var option = this.value;

                clearMouseTimeout();

                scope.$apply(function() {
                    scope.$evalAsync(function() {
                        scope.hoverOption = option;
                        scope.hoverValue = scope.options[option].value;
                    });
                });
            });

            // Mouse left the option button, so reset the overview to default
            element.on('mouseleave', '.option-button', function() {
                resetOverview();
            });

            // Mouse entered the overview panel, don't reset the overview
            element.on('mouseenter', '.option-overview', function() {
                clearMouseTimeout();
            });

            // Mouse left the overview, reset the overview panel to default
            element.on('mouseleave', '.option-overview', function() {
                resetOverview();
            });

            function _updateSelection(optionValue) {
                var oldValue = scope.modelValue;
                scope.modelValue = optionValue;
                if (scope.onClick && optionValue !== oldValue) {
                    scope.onClick(optionValue, oldValue);
                }
            }

            // Clear the mouse timeout to prevent flickering
            function clearMouseTimeout() {
                if (mouseTimeout) {
                    $timeout.cancel(mouseTimeout);
                }
            }

            // Reset the overview panel to show the first option's info (default)
            function resetOverview() {
                clearMouseTimeout();

                mouseTimeout = $timeout(function() {
                    var option = 0;
                    for (var i = 0; i < scope.options.length; i++) {
                        if (scope.options[i].value == scope.modelValue) {
                            option = i;
                            break;
                        }
                    }
                    scope.hoverOption = option;
                    scope.hoverValue = scope.options[option].value;
                }, 200);
            }
        }
    }

})();
