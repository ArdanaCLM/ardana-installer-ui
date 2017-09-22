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
        .directive('required', requiredDirective);

    /**
     * @directive required validator
     * Based on Angular's built-in implementation, but adding `required` css
     * class name to prev-sibling element.
     *
     * @description
     * With this directive, when an form field has a `required` attribute specified,
     * its previous-sibling element will get a `required` css class name automatically,
     * based on the assumption that there always be such a sibling element as a label pair
     * to the form element.
     *
     * This directive will not only save a lot of typing, it will also prevent
     * that in a pair of form element and label element, one specified as required
     * while other is not.
     *
     * @example:
     ```html
     <div class="control-label">Subnet</div>
     <input name="subnet" class="control-input" type="text" ng-model="this_data.subnet" required />
     ```
     */

    function requiredDirective() {
        return {
            link: link,
            require: 'ngModel',
            restrict: 'A'
        };

        function link(scope, element, attr, ngModelController) {
            if (!ngModelController) {
                return;
            }
            attr.required = true;

            var prevSibling = element.prev();
            if (prevSibling.hasClass('control-label')) {
                prevSibling.addClass('required');
            }

            ngModelController.$validators.required = validator;

            attr.$observe('required', function() {
                ngModelController.$validate();
            });

            function validator(modelValue, viewValue) {
                return !attr.required || !ngModelController.$isEmpty(viewValue);
            }
        }
    }

})();
