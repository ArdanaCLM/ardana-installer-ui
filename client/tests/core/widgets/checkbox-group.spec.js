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

    describe('widgets :', function() {

        beforeEach(module('templates'));
        beforeEach(module('dayzero', function($provide, $translateProvider) {
            $provide.factory('customLoader', function($q) {
                return function() {
                    var deferred = $q.defer();
                    deferred.resolve({});
                    return deferred.promise;
                };
            });
            $translateProvider.useLoader('customLoader');
        }));

        describe('checkbox-group: ', function() {
            var $compile, $scope, $form;

            var markup = [
                '<form name="testForm">',
                '<div name="interfaces" ardana-checkbox-group="{{ values }}" ng-model="_value">',
                '<div np-repeat="(index, value) in values">',
                '<input type="checkbox" ng-model="values[index]">',
                '</div>',
                '</div>',
                '</form>'
            ].join('/n');

            beforeEach(inject(function($injector) {
                $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();
            }));

            it('should be considered as empty if init with all false value', function() {
                $scope.values = [false, false, false, false];
                $compile(angular.element(markup))($scope);
                $form = $scope['testForm'];
                $scope.$apply();

                expect($form['interfaces'].$viewValue).toBe('');
            });

            it('should not be considered as empty if not init with all false value', function() {
                $scope.values = [true, false, false, false];
                $compile(angular.element(markup))($scope);
                $form = $scope['testForm'];
                $scope.$apply();

                expect($form['interfaces'].$viewValue).toBe('_');
            });

            it('should have proper value after change', function() {
                var element = angular.element(markup);

                $scope.values = [false, false, false, false];
                $compile(element)($scope);
                $form = $scope['testForm'];

                var firstCheckbox = element.find('input').first();
                var checkboxGroupField = element.children().first();

                firstCheckbox.prop('checked', true);
                checkboxGroupField.scope().count();
                expect($form['interfaces'].$viewValue).toBe('_');

                firstCheckbox.prop('checked', false);
                checkboxGroupField.scope().count();
                expect($form['interfaces'].$viewValue).toBe('');
            });
        });
    });
})();
