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
        .filter('password', password)
        .directive('selectAll', selectAll)
        .directive('yamlize', yamlize);

    function password() {
        return function(item) {
            return item ? '**********' : item;
        };
    }

    function selectAll() {
        var directive = {
            link: link,
            restrict: 'A',
            scope: {
                rows: '=selectAll'
            }
        };
        return directive;

        //////////

        function link(scope, element) {
            element.on('click', function() {
                scope.$apply(function() {
                    scope.$evalAsync(function() {
                        var checkedState = element.prop('checked');
                        angular.forEach(scope.rows, function(row) {
                            row._selected = checkedState;
                        });
                    });
                });
            });
        }
    }

    function yamlize() {
        var directive = {
            link: link,
            require: 'ngModel',
            restrict: 'A'
        };
        return directive;

        //////////

        function link(scope, element, attrs, ngModelCtrl) {
            ngModelCtrl.$parsers.push(asJson);
            ngModelCtrl.$formatters.push(asYaml);

            function asJson(data) {
                if (data) {
                    try {
                        var jsonData = {};
                        jsonData = jsyaml.safeLoad(data);
                        ngModelCtrl.$setValidity('yaml', true);
                        scope.$emit('json.conversion.succeeded');
                        return jsonData;
                    }
                    catch (error) {
                        ngModelCtrl.$setValidity('yaml', false);
                        scope.$emit('json.conversion.failed', error);
                    }
                }
                return {};
            }

            function asYaml(data) {
                if (data) {
                    return jsyaml.safeDump(data);
                }
            }
        }
    }
})();
