(function() {
    'use strict';

    describe('utils Directives', function() {
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

        describe('password filter', function() {
            var passwordFilter;

            beforeEach(inject(function($injector) {
                passwordFilter = $injector.get('passwordFilter');
            }));

            it('should return null if original value is null', function() {
                var returnedValue = passwordFilter(null);
                expect(returnedValue).toBe(null);
            });

            it('should return undefined if original value is undefined', function() {
                var returnedValue = passwordFilter(undefined);
                expect(returnedValue).toBe(undefined);
            });

            it('should return blank string if original value is blank string', function() {
                var returnedValue = passwordFilter('');
                expect(returnedValue).toBe('');
            });

            it('should return **********', function() {
                var returnedValue = passwordFilter('Passw0rd!');
                expect(returnedValue).toBe('**********');
            });
        });

        describe('selectAll Directive', function() {
            var $scope, $element;

            beforeEach(inject(function($injector) {
                var $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();

                $scope.rows = [
                    {name: 'one'},
                    {name: 'two'},
                    {name: 'three'}
                ];
                var markup = '<form><input type="checkbox" select-all="rows"></form>';

                $element = angular.element(markup);
                $compile($element)($scope);

                $scope.$apply();
            }));

            it('should set _selected in all rows to true', function() {
                $element.find('input').click();

                $scope.$apply();

                angular.forEach($scope.rows, function(row) {
                    expect(row._selected).toBe(true);
                });
            });
        });

        describe('yamlize Directive', function() {
            var $scope, input;

            beforeEach(inject(function($injector) {
                var $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();

                $scope.modelValue = {stringValue: 'one'};
                var markup = '<form name="testForm">' +
                    '<textarea name="yaml" ng-model="modelValue" yamlize></textarea>' +
                    '</form>';

                var $element = angular.element(markup);
                input = $element.find('textarea');
                $compile($element)($scope);

                $scope.$apply();
            }));

            it('should show string value in YAML format', function() {
                expect(input.val().trim()).toBe('stringValue: one');
            });

            it('should show array value in YAML format', function() {
                $scope.modelValue = {arrayValue: ['one', 'two']};
                $scope.$apply();

                expect(input.val().trim()).toBe('arrayValue:\n  - one\n  - two');
            });

            it('should show object value in YAML format', function() {
                $scope.modelValue = {objectValue: {test: 'value'}};
                $scope.$apply();

                expect(input.val().trim()).toBe('objectValue:\n  test: value');
            });

            it('should return empty YAML value if data is empty', function() {
                $scope.modelValue = '';
                $scope.$apply();

                expect(input.val().trim()).toBe('');
            });

            describe('converting YAML to JSON', function() {
                it('should set empty object for model value when input is empty', function() {
                    $scope.testForm.yaml.$setViewValue('');
                    $scope.$apply();

                    expect($scope.modelValue).toEqual({});
                });

                it('should convert YAML to object for model value', function() {
                    $scope.testForm.yaml.$setViewValue('stringValue: two');
                    $scope.$apply();

                    expect($scope.modelValue).toEqual({stringValue: 'two'});
                });

                it('should convert YAML to object for model value', function() {
                    $scope.testForm.yaml.$setViewValue('arrayValue:\n  - one\n  - two');
                    $scope.$apply();

                    expect($scope.modelValue).toEqual({arrayValue: ['one', 'two']});
                });

                it('should convert YAML to object for model value', function() {
                    $scope.testForm.yaml.$setViewValue('objectValue:\n  test: value');
                    $scope.$apply();

                    expect($scope.modelValue).toEqual({objectValue: {test: 'value'}});
                });

                it('should emit an error message when conversion fails', function(done) {
                    $scope.$on('json.conversion.failed', function() {
                        done();
                    });
                    $scope.$apply();

                    $scope.testForm.yaml.$setViewValue('objectValue: test::');
                    $scope.$apply();
                });

                it('should emit a success message when conversion succeeds', function(done) {
                    $scope.$on('json.conversion.succeeded', function() {
                        done();
                    });
                    $scope.$apply();

                    $scope.testForm.yaml.$setViewValue('objectValue: test');
                    $scope.$apply();
                });
            });
        });
    });

})();
