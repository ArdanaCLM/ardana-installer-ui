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
        .directive('ardanaUnique', ardanaUnique);

    /**
     * @directive ardanaUnique validator
     * @example:
     ```html
     <form name="testForm">
     <input type="text" name="serverName" ng-model="data.serverName"
     items="servers"
     key="'name'"
     ardana-unique />
     </form>
     ```
     */

    function ardanaUnique() {
        return {
            link: link,
            require: 'ngModel',
            restrict: 'A',
            scope: {
                items: '=',
                key: '=?'
            }
        };

        function link(scope, element, attrs, ngModelController) {
            var originalModelValue;
            var items = [];

            ngModelController.$validators.ardanaUnique = validator;
            scope.$watchCollection('items', update);

            update();

            function update() {
                items = scope.items || [];
                if (scope.key) {
                    items = items.map(function(item) {
                        return item[scope.key];
                    });
                }
            }

            function validator(modelValue, viewValue) {
                if (ngModelController.$pristine) {
                    originalModelValue = modelValue;
                }
                return originalModelValue === modelValue || items.indexOf(viewValue) === -1;
            }
        }
    }

})();
