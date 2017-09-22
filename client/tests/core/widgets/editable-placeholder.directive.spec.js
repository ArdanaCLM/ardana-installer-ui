(function() {
    'use strict';

    describe('editable-placeholder Directive', function() {
        var $scope, $element;

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

        beforeEach(inject(function($injector) {
            var $compile = $injector.get('$compile');
            $scope = $injector.get('$rootScope').$new();

            $scope.isSet = false;
            $scope.addAction = angular.noop;

            var markup = '<editable-placeholder is-set="isSet" add-action="addAction()" ' +
                'label="Test Label" add-action-label="Test Action Label">' +
                '<div>Test</div>' +
                '</editable-placeholder>';

            $element = angular.element(markup);
            $compile($element)($scope);

            spyOn($scope, 'addAction').and.callThrough();

            $scope.$apply();
        }));

        it('should initially show placeholder', function() {
            expect($element.find('.ep-cue').length).toBe(1);
        });

        it('should hide placeholder when isSet is changed to true', function() {
            $scope.isSet = true;
            $scope.$apply();

            expect($element.find('.ep-cue').length).toBe(0);
            expect($element.find('.ep-component').length).toBe(1);
        });

        it('should display the correct placeholder label', function() {
            expect($element.find('.ep-label').text().trim()).toBe('Test Label');
        });

        it('should display the correct add action label', function() {
            expect($element.find('.ep-action').text().trim()).toBe('Test Action Label');
        });

        it('should invoke the add action function when action button is clicked', function() {
            $element.find('.ep-action').click();

            expect($scope.addAction).toHaveBeenCalled();
        });
    });

})();
