/**
 * (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
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

        describe('IP address validator directives `ardana-valid-ip-address`', function() {
            var $compile, $scope, $form;

            var markup = [
                '<form name="testForm">',
                '<input name="ip" type="text" ng-model="data.ip" ardana-valid-ip-address />',
                '</form>'
            ].join('/n');

            beforeEach(inject(function($injector) {
                $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();
                $scope.data = {};
                $compile(angular.element(markup))($scope);
                $form = $scope['testForm'];
                $scope.$apply();
            }));

            it('should pass validation initially when data.ip is undefined and input is empty', function() {
                expect($form['ip'].$valid).toBe(true);
                expect($form.$valid).toBe(true);
            });

            it('should not pass validation if input is an invalid IP address', function() {
                ['something',
                    '192.',
                    '192.168',
                    '192.168.1',
                    '192.168.1.',
                    '192.168.1.256'
                ].forEach(function(ip) {
                    $form['ip'].$setViewValue(ip);
                    $scope.$apply();
                    expect($form['ip'].$valid).toBe(false);
                    expect($form.$valid).toBe(false);
                });
            });

            it('should pass validation if input is a valid IP address', function() {
                ['',
                    '0.0.0.0',
                    '192.168.1.1'
                ].forEach(function(ip) {
                    $form['ip'].$setViewValue(ip);
                    $scope.$apply();
                    expect($form['ip'].$valid).toBe(true);
                    expect($form.$valid).toBe(true);
                });
            });
        });

        describe('Mac address validator directives `ardana-valid-mac-address`', function() {
            var $compile, $scope, $form;

            var markup = [
                '<form name="testForm">',
                '<input name="mac" type="text" ng-model="data.mac" ardana-valid-mac-address />',
                '</form>'
            ].join('/n');

            beforeEach(inject(function($injector) {
                $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();
                $scope.data = {};
                $compile(angular.element(markup))($scope);
                $form = $scope['testForm'];
                $scope.$apply();
            }));

            it('should pass validation initially when data.mac is undefined and input is empty', function() {
                expect($form['mac'].$valid).toBe(true);
                expect($form.$valid).toBe(true);
            });

            it('should not pass validation if input is an invalid mac address', function() {
                ['something',
                    'b:72:8d:ac:7c',
                    'b22:72:8d:ac:7c',
                    'x2:72:8d:ac:7c:6f',
                    '72:8d:ac:7c:6f'
                ].forEach(function(mac) {
                    $form['mac'].$setViewValue(mac);
                    $scope.$apply();
                    expect($form['mac'].$valid).toBe(false);
                    expect($form.$valid).toBe(false);
                });
            });

            it('should pass validation if input is a valid mac address', function() {
                ['',
                    'b2:72:8d:ac:7c:6f'
                ].forEach(function(mac) {
                    $form['mac'].$setViewValue(mac);
                    $scope.$apply();
                    expect($form['mac'].$valid).toBe(true);
                    expect($form.$valid).toBe(true);
                });
            });
        });

        describe('IP range address validator directives `ardana-valid-ip-range`', function() {
            var $compile, $scope, $form;

            var markup = [
                '<form name="testForm">',
                '<input name="ip-range" type="text" ng-model="data.ip_range" ardana-valid-ip-range />',
                '</form>'
            ].join('/n');

            beforeEach(inject(function($injector) {
                $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();
                $scope.data = {};
                $compile(angular.element(markup))($scope);
                $form = $scope['testForm'];
                $scope.$apply();
            }));

            it('should pass validation initially when data.ip_range is undefined and input is empty', function() {
                expect($form['ip-range'].$valid).toBe(true);
                expect($form.$valid).toBe(true);
            });

            it('should not pass validation if input is an invalid IP range', function() {
                ['something',
                    '10.1.1.256',
                    '10.1.1.0/256',
                    '15.0.1.2/33'
                ].forEach(function(mac) {
                    $form['ip-range'].$setViewValue(mac);
                    $scope.$apply();
                    expect($form['ip-range'].$valid).toBe(false);
                    expect($form.$valid).toBe(false);
                });
            });

            it('should pass validation if input is a valid IP range', function() {
                ['',
                    '10.1.1.0/0',
                    '10.1.1.0/1',
                    '10.1.1.0/24',
                    '15.0.1.2/32'
                ].forEach(function(mac) {
                    $form['ip-range'].$setViewValue(mac);
                    $scope.$apply();
                    expect($form['ip-range'].$valid).toBe(true);
                    expect($form.$valid).toBe(true);
                });
            });
        });

        describe('Name validator directive `ardana-valid-name`', function() {
            var $compile, $scope, $form;

            var markup = [
                '<form name="testForm">',
                '<input name="name" type="text" ng-model="data.name" ardana-valid-name />',
                '</form>'
            ].join('/n');

            beforeEach(inject(function($injector) {
                $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();
                $scope.data = {};
                $compile(angular.element(markup))($scope);
                $form = $scope['testForm'];
                $scope.$apply();
            }));

            it('should pass validation initially when data.name is undefined and input is empty', function() {
                expect($form['name'].$valid).toBe(true);
                expect($form.$valid).toBe(true);
            });

            it('should not pass validation if input is an invalid name', function() {
                ['badname!',
                    '1bad_bad-name',
                    'not$good(name)',
                    'not good name'
                ].forEach(function(name) {
                    $form['name'].$setViewValue(name);
                    $scope.$apply();
                    expect($form['name'].$valid).toBe(false);
                    expect($form.$valid).toBe(false);
                });
            });

            it('should pass validation if input is a valid name', function() {
                ['good_name1',
                    'goodname',
                    'good-name'
                ].forEach(function(name) {
                    $form['name'].$setViewValue(name);
                    $scope.$apply();
                    expect($form['name'].$valid).toBe(true);
                    expect($form.$valid).toBe(true);
                });
            });
        });

        describe('Integer validator directive `ardana-integer`', function() {
            var $compile, $scope, $form;

            var markup = [
                '<form name="testForm">',
                '<input name="integer" type="text" ng-model="data.integer" ardana-integer />',
                '</form>'
            ].join('/n');

            beforeEach(inject(function($injector) {
                $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();
                $scope.data = {};
                $compile(angular.element(markup))($scope);
                $form = $scope['testForm'];
                $scope.$apply();
            }));

            it('should pass validation initially when data.integer is undefined and input is empty', function() {
                expect($form['integer'].$valid).toBe(true);
                expect($form.$valid).toBe(true);
            });

            it('should not pass validation if input is an invalid integer', function() {
                ['xyz',
                    '!!!',
                    '0.1'
                ].forEach(function(name) {
                    $form['integer'].$setViewValue(name);
                    $scope.$apply();
                    expect($form['integer'].$valid).toBe(false);
                    expect($form.$valid).toBe(false);
                });
            });

            it('should pass validation if input is a valid integer', function() {
                ['1',
                    '1000',
                    '0'
                ].forEach(function(name) {
                    $form['integer'].$setViewValue(name);
                    $scope.$apply();
                    expect($form['integer'].$valid).toBe(true);
                    expect($form.$valid).toBe(true);
                });
            });
        });

        describe('PCI Address validator directive `ardana-pci-address`', function() {
            var $compile, $scope, $form;

            var markup = [
                '<form name="testForm">',
                '<input name="pci-address" type="text" ng-model="data.eth0" ardana-pci-address />',
                '</form>'].join('/n');

            beforeEach(inject(function($injector) {
                $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();
                $scope.data = {};
                $compile(angular.element(markup))($scope);
                $form = $scope['testForm'];
                $scope.$apply();
            }));

            it('should pass validation when pci-address is undefined and input is empty', function() {
                expect($form['pci-address'].$valid).toBe(true);
                expect($form.$valid).toBe(true);
            });

            it('should not pass if pci-address is invalid', function() {
                [
                    'gggg:08:00.1',
                    '0000:00:1g.0',
                    '0000:0g:0b.2',
                    'ffff:ff:1f.8',
                    'xyz@0000:0f:0e.0'
                ].forEach(function(name) {
                    $form['pci-address'].$setViewValue(name);
                    $scope.$apply();
                    expect($form['pci-address'].$valid).toBe(false);
                    expect($form.$valid).toBe(false);
                })
            })

            it('should pass if pci-address is valid', function() {
                [
                    '0000:08:00.1',
                    '0000:00:1a.0',
                    '0000:0f:0b.2',
                    'ffff:ff:1f.7',
                    'pci@0000:0f:0e.0'
                ].forEach(function(name) {
                    $form['pci-address'].$setViewValue(name);
                    $scope.$apply();
                    expect($form['pci-address'].$valid).toBe(true);
                    expect($form.$valid).toBe(true);
                })
            })

        });

        describe('Host-or-ip-address validator directive `ardana-valid-ip-address-or-hostname', function() {
                            var $compile, $scope, $form;

            var markup = [
                '<form name="testForm">',
                '<input name="name" type="text" ng-model="data.name" ardana-valid-ip-address-or-hostname />',
                '</form>'
            ].join('/n');

            beforeEach(inject(function($injector) {
                $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();
                $scope.data = {};
                $compile(angular.element(markup))($scope);
                $form = $scope['testForm'];
                $scope.$apply();
            }));

            it('should pass validation initially when data.name is undefined and input is empty', function() {
                expect($form['name'].$valid).toBe(true);
                expect($form.$valid).toBe(true);
            });

            // For whatever reason, jasmine tests reject the str.repeat() function, so have to spell it all out here
            var domain = '.twentyfivechardomainname' +
                         '.twentyfivechardomainname' +
                         '.twentyfivechardomainname' +
                         '.twentyfivechardomainname' +
                         '.twentyfivechardomainname' +
                         '.twentyfivechardomainname' +
                         '.twentyfivechardomainname' +
                         '.twentyfivechardomainname' +
                         '.twentyfivechardomainname' +
                         '.twentyfivechardomainname';

            it('should not pass validation if input is an invalid ip address or hostname', function() {
                ['badname!',
                    '1bad_bad-name',
                    'not$good(name)',
                    'not good name',
                    '-notgood.com',
                    'notgood-.com',
                    'name.-notgood.com',
                    'name.notgood-.com',
                    'name-invalid-because-it-is-longer-than-63-characters-00000000000',
                    'ungood' + domain,  // 256 chars total
                    '.missing.host.com',
                    'extradot..com',
                    'missingdomain.',
                    'tldmissingchars.1234',
                    '192.168.1',
                    '192.168.1.1234',
                    '256.256.256.256',
                    '256.256',
                    '192.168.100.1000'
                ].forEach(function(name) {
                    $form['name'].$setViewValue(name);
                    $scope.$apply();
                    expect($form['name'].$valid).toBe(false);
                    expect($form.$valid).toBe(false);
                });
            });

            it('should pass validation if input is a valid ip address or hostname', function() {
                ['good-name1',
                    'goodname',
                    'GOODNAME',
                    'good-name',
                    'good-name.us.com',
                    'good-name.com',
                    'good.12.com',
                    'good.1.com',
                    '34.12.com',
                    '3-4.12.com',
                    '0.0.0.0',
                    '192.168.1.1',
                    'host1' + domain, // 255 chars total
                    'A.ISI.EDU',      // These 3 are valid examples given in RFC-1034
                    'XX.LCS.MIT.EDU',
                    'SRI-NIC.ARPT'
                ].forEach(function(name) {
                    $form['name'].$setViewValue(name);
                    $scope.$apply();
                    expect($form['name'].$valid).toBe(true);
                    expect($form.$valid).toBe(true);
                });
            });
        });
    });
})();
