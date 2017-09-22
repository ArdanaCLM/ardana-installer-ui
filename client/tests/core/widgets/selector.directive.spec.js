(function() {
    'use strict';

    describe('selector Directive', function() {
        var $scope, $element, DrawerService;

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

        describe('with no value set initially', function() {
            beforeEach(inject(function($injector) {
                var $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();

                $scope.items = ['cat', 'dog', 'fish'];

                var markup = '<selector items="items" value="animal"></selector>';

                $element = $compile(angular.element(markup))($scope);

                $scope.$apply();
            }));

            it('should list 3 items in dropdown', function() {
                expect($element.find('li').length).toBe(3);
            });

            it('should default value to undefined if value is not initialized', function() {
                var directiveScope = $element.isolateScope();
                expect($scope.animal).toBeUndefined();
                expect(directiveScope.placeholder).toBe('Select an option');
            });

            it('should update value if another item picked from dropdown', function() {
                expect($scope.animal).toBeUndefined();

                var directiveScope = $element.isolateScope();
                directiveScope.updateValue('dog');

                $scope.$apply();

                expect($scope.animal).toBe('dog');
            });
        });

        describe('with a value set initially', function() {
            beforeEach(inject(function($injector) {
                var $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();

                $scope.items = ['cat', 'dog', 'fish'];
                $scope.animal = 'cat';
                $scope.placeholder = 'Select an animal';

                var markup = '<selector items="items" value="animal" placeholder="placeholder"></selector>';

                $element = $compile(angular.element(markup))($scope);

                $scope.$apply();
            }));

            it('should list 3 items in dropdown', function() {
                expect($element.find('li').length).toBe(3);
            });

            it('should default value to "cat" if value is initialized to "cat"', function() {
                var directiveScope = $element.isolateScope();
                expect($scope.animal).toBe('cat');
                expect(directiveScope.placeholder).toBe('Select an animal');
            });

            it('should update value if another item picked from dropdown', function() {
                expect($scope.animal).toBe('cat');

                var directiveScope = $element.isolateScope();
                directiveScope.updateValue('dog');

                $scope.$apply();

                expect($scope.animal).toBe('dog');
            });

            it('should ignore onChange callback if not specified and selector value changes', function() {
                var isolateScope = $element.isolateScope();
                spyOn(isolateScope, 'onChange');

                $element.find('li:last-child > a').click();

                $scope.$apply();

                expect(isolateScope.onChange).not.toHaveBeenCalled();
            });
        });

        describe('with a key and label', function() {
            beforeEach(inject(function($injector) {
                var $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();

                $scope.animal = 'cat';
                $scope.items = [
                    {key: 'cat', label: 'The Cat'},
                    {key: 'dog', label: 'The Dog'},
                    {key: 'fish', label: 'The Fish'}
                ];
                $scope.key = 'key';
                $scope.label = 'label';
                $scope.dataChanged = angular.noop;
                $scope.context = 'test';

                var markup = '<selector items="items" value="animal" key="key" label="label" ' +
                    '  on-change="dataChanged(newValue, oldValue)" ng-model="animal">' +
                    '</selector>';

                $element = $compile(angular.element(markup))($scope);

                $scope.$apply();
            }));

            it('should list 3 items in dropdown', function() {
                var listItems = $element.find('li');
                expect(listItems.length).toBe(3);

                var labels = ['The Cat', 'The Dog', 'The Fish'];
                angular.forEach(listItems, function(item, idx) {
                    var label = angular.element(item).text().trim();
                    expect(label).toBe(labels[idx]);
                });
            });

            it('should default value to "cat" if value is initialized to "cat"', function() {
                expect($scope.animal).toBe('cat');
            });

            it('should update value if another item picked from dropdown', function() {
                var directiveScope = $element.isolateScope();
                directiveScope.updateValue({key: 'fish', label: 'The Fish'});

                $scope.$apply();

                expect($scope.animal).toBe('fish');
            });

            it('should update value if another item picked from dropdown', function() {
                $element.find('li:last-child > a').click();

                $scope.$apply();

                expect($scope.animal).toBe('fish');
            });

            it('should call onChange function if selector value changes', function() {
                var isolateScope = $element.isolateScope();
                spyOn(isolateScope, 'onChange').and.callThrough();

                $element.find('li:last-child > a').click();

                $scope.$apply();

                expect(isolateScope.onChange).toHaveBeenCalledWith({newValue: 'fish', oldValue: 'cat'});
            });
        });

        describe('with ngModel and form', function() {
            beforeEach(inject(function($injector) {
                var $compile = $injector.get('$compile');
                $scope = $injector.get('$rootScope').$new();

                $scope.animal = 'cat';
                $scope.items = [
                    {key: 'cat', label: 'The Cat'},
                    {key: 'dog', label: 'The Dog'},
                    {key: 'fish', label: 'The Fish'}
                ];
                $scope.key = 'key';
                $scope.label = 'label';
                $scope.dataChanged = angular.noop;
                $scope.context = 'test';

                var markup = '<form name="testForm">' +
                    '  <selector items="items" value="animal" key="key" label="label" ' +
                    '    on-change="dataChanged(newValue, oldValue)" ng-model="animal">' +
                    '  </selector>' +
                    '</form>';

                $element = $compile(angular.element(markup))($scope);

                $scope.$apply();
            }));

            it('should set view value to fish when new value is fish', function() {
                var modelCtrl = $element.find('selector').controller('ngModel');
                var isolateScope = $element.find('selector').isolateScope();
                isolateScope.updateValue({key: 'fish'});
                expect(modelCtrl.$viewValue).toBe('fish');
            });

            it('should set view value to empty string when new value is empty', function() {
                var modelCtrl = $element.find('selector').controller('ngModel');
                var isolateScope = $element.find('selector').isolateScope();
                isolateScope.updateValue({});
                expect(modelCtrl.$viewValue).toBe('');
            });
        });
    });

})();
