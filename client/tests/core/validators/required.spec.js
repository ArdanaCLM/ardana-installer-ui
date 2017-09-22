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

    describe('validators :', function() {

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

        describe('required validator', function() {
            var $compile, $scope, $form, formElement;

            var markup = [
                '<form name="testForm">',
                '<div class="control-label">Subnet</div>',
                '<input name="subnet" class="control-input" type="text" ng-model="data.subnet" required />',
                '</form>'
            ].join('/n');

            beforeEach(inject(function($injector) {
                $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();
                $scope.data = {};

                formElement = angular.element(markup);

                $compile(formElement)($scope);
                $form = $scope['testForm'];
                $scope.$apply();
            }));

            it('should pass validation if input is a valid IP address', function() {
                expect(formElement.find('div').hasClass('required')).toBe(true);
            });
        });

        describe('required validator has no control-label', function() {
            var $compile, $scope, $form, formElement;

            var markup = [
                '<form name="testForm">',
                '<div>Subnet</div>',
                '<input name="subnet" class="control-input" type="text" ng-model="data.subnet" required />',
                '</form>'
            ].join('/n');

            beforeEach(inject(function($injector) {
                $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();
                $scope.data = {};

                formElement = angular.element(markup);

                $compile(formElement)($scope);
                $form = $scope['testForm'];
                $scope.$apply();
            }));

            it('should not add required class to label', function() {
                expect(formElement.find('div').hasClass('required')).toBe(false);
            });
        });

    });
})();
