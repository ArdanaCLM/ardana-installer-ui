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

        describe('ardana-unique - edting with complex table data', function() {
            var $compile, $scope, $form;

            var markup =
                '<form name="testForm">"' +
                '<input type="text" name="serverName" ng-model="data.serverName" items="servers" key="\'name\'" ardana-unique />' +
                '</form>';

            beforeEach(inject(function($injector) {
                $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();
                $scope.data = {
                    serverName: 'controller1'
                };
                $scope.servers = [
                    {name: 'controller1'},
                    {name: 'controller2'},
                    {name: 'controller3'}
                ];
                $compile(angular.element(markup))($scope);
                $form = $scope['testForm'];
                $scope.$apply();
            }));

            it('should pass validation if there is no input', function() {
                expect($form['serverName'].$valid).toBe(true);
                expect($form.$valid).toBe(true);
            });

            it('should pass validation if viewValue is unique', function() {
                ['',
                    'controller1',
                    'controller4'
                ].forEach(function(name) {
                    $form['serverName'].$setViewValue(name);
                    $scope.$apply();
                    expect($form['serverName'].$valid).toBe(true);
                    expect($form.$valid).toBe(true);
                });
            });

            it('should not pass validation if viewValue is not unique', function() {
                ['controller2',
                    'controller3'
                ].forEach(function(name) {
                    var field = $form['serverName'];
                    field.$setViewValue(name);
                    expect(field.$valid).not.toBe(true);
                    expect($form.$valid).not.toBe(true);
                });
            });

        });

        describe('ardana-unique - adding with complex table data', function() {
            var $compile, $scope, $form;

            var markup =
                '<form name="testForm">"' +
                '<input type="text" name="serverName" ng-model="data.serverName" items="servers" key="\'name\'" ardana-unique />' +
                '</form>';

            beforeEach(inject(function($injector) {
                $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();
                $scope.data = {};
                $scope.servers = [
                    {name: 'controller1'},
                    {name: 'controller2'},
                    {name: 'controller3'}
                ];
                $compile(angular.element(markup))($scope);
                $form = $scope['testForm'];
                $scope.$apply();
            }));

            it('should pass validation if there is no input', function() {
                expect($form['serverName'].$valid).toBe(true);
                expect($form.$valid).toBe(true);
            });

            it('should pass validation if viewValue is unique', function() {
                ['',
                    'controller4'
                ].forEach(function(name) {
                    $form['serverName'].$setViewValue(name);
                    $scope.$apply();
                    expect($form['serverName'].$valid).toBe(true);
                    expect($form.$valid).toBe(true);
                });
            });

            it('should not pass validation if viewValue is not unique', function() {
                ['controller1',
                    'controller2',
                    'controller3'
                ].forEach(function(name) {
                    var field = $form['serverName'];
                    field.$setViewValue(name);
                    expect(field.$valid).not.toBe(true);
                    expect($form.$valid).not.toBe(true);
                });
            });

        });

        describe('ardana-unique - edting with simple table data', function() {
            var $compile, $scope, $form;

            var markup =
                '<form name="testForm">"' +
                '<input type="text" name="serverName" ng-model="data.serverName" items="servers" ardana-unique />' +
                '</form>';

            beforeEach(inject(function($injector) {
                $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();
                $scope.data = {
                    serverName: 'controller1'
                };
                $scope.servers = [
                    'controller1',
                    'controller2',
                    'controller3'
                ];
                $compile(angular.element(markup))($scope);
                $form = $scope['testForm'];
                $scope.$apply();
            }));

            it('should pass validation if there is no input', function() {
                expect($form['serverName'].$valid).toBe(true);
                expect($form.$valid).toBe(true);
            });

            it('should pass validation if viewValue is unique', function() {
                ['',
                    'controller1',
                    'controller4'
                ].forEach(function(name) {
                    $form['serverName'].$setViewValue(name);
                    $scope.$apply();
                    expect($form['serverName'].$valid).toBe(true);
                    expect($form.$valid).toBe(true);
                });
            });

            it('should not pass validation if viewValue is not unique', function() {
                ['controller2',
                    'controller3'
                ].forEach(function(name) {
                    var field = $form['serverName'];
                    field.$setViewValue(name);
                    expect(field.$valid).not.toBe(true);
                    expect($form.$valid).not.toBe(true);
                });
            });
        });

        describe('ardana-unique - adding with simple table data', function() {
            var $compile, $scope, $form;

            var markup =
                '<form name="testForm">"' +
                '<input type="text" name="serverName" ng-model="data.serverName" items="servers" ardana-unique />' +
                '</form>';

            beforeEach(inject(function($injector) {
                $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();
                $scope.data = {};
                $scope.servers = [
                    'controller1',
                    'controller2',
                    'controller3'
                ];
                $compile(angular.element(markup))($scope);
                $form = $scope['testForm'];
                $scope.$apply();
            }));

            it('should pass validation if there is no input', function() {
                expect($form['serverName'].$valid).toBe(true);
                expect($form.$valid).toBe(true);
            });

            it('should pass validation if viewValue is unique', function() {
                ['',
                    'controller4'
                ].forEach(function(name) {
                    $form['serverName'].$setViewValue(name);
                    $scope.$apply();
                    expect($form['serverName'].$valid).toBe(true);
                    expect($form.$valid).toBe(true);
                });
            });

            it('should not pass validation if viewValue is not unique', function() {
                ['controller1',
                    'controller2',
                    'controller3'
                ].forEach(function(name) {
                    var field = $form['serverName'];
                    field.$setViewValue(name);
                    expect(field.$valid).not.toBe(true);
                    expect($form.$valid).not.toBe(true);
                });
            });
        });
    });
})();
