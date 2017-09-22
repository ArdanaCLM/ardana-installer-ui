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
        .directive('selector', selector);

    selector.$inject = ['app.basePath'];

    function selector(path) {
        var directive = {
            link: link,
            require: '?ngModel',
            scope: {
                items: '=',
                value: '=',
                addItem: '=?',
                addItemContext: '=?',
                key: '=?',
                label: '=?',
                onChange: '&?',
                placeholder: '=?'
            },
            templateUrl: path + 'core/widgets/selector/selector.html'
        };
        return directive;

        //////////

        function link(scope, element, attrs, ngModelCtrl) {
            if (angular.isUndefined(scope.placeholder)) {
                scope.placeholder = 'Select an option';
            }

            if (angular.isDefined(attrs.menuRight)) {
                scope.menuRight = true;
            }

            scope.updateValue = function(newItem) {
                var oldValue = scope.value;
                scope.value = scope.key ? newItem[scope.key] : newItem;
                if (scope.onChange && attrs.onChange) {
                    scope.onChange({newValue: scope.value, oldValue: oldValue});
                }
                updateViewValue(scope.value);
            };

            scope.$watch('value', updateViewValue);

            updateViewValue(scope.value);

            function updateViewValue(value) {
                ngModelCtrl && ngModelCtrl.$setViewValue(value || '');
            }
        }
    }

})();
