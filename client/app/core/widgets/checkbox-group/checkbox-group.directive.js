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
        .directive('ardanaCheckboxGroup', ardanaCheckboxGroup);

    function ardanaCheckboxGroup() {
        var directive = {
            link: link,
            require: 'ngModel',
            restrict: 'A'
        };
        return directive;

        ////////////

        function link(scope, element, attrs, ngModelCtrl) {
            var selection = angular.fromJson(attrs['ardanaCheckboxGroup']);
            element.click(count);

            scope.count = count;

            initCount();

            function initCount() {
                var countCheckedBoxes = 0;
                angular.forEach(selection, function(value) {
                    if (value) {
                        countCheckedBoxes += 1;
                    }
                });
                ngModelCtrl.$setViewValue(countCheckedBoxes === 0 ? '' : '_');
            }

            function count() {
                var countCheckedBoxes = 0;
                element.find('input').each(function() {
                    if ($(this).prop('checked')) {
                        countCheckedBoxes += 1;
                    }
                });
                ngModelCtrl.$setViewValue(countCheckedBoxes === 0 ? '' : '_');
            }
        }
    }

})();
