(function() {
    'use strict';

    describe('action Directive', function() {
        var $compile, $scope;

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
            $compile = $injector.get('$compile');
            $scope = $injector.get('$rootScope').$new();

            $scope.callMe = angular.noop;
            $scope.data = {animal: 'cat'};

            spyOn($scope, 'callMe').and.callThrough();
        }));

        it('should render action as list item', function() {
            var markup = '<ul><action callback="callMe">Test</action></ul>';
            var element = $compile(angular.element(markup))($scope);
            $scope.$apply();

            expect(element.find('li').length).toBe(1);
            expect(element.find('a').length).toBe(1);
        });

        it('should call "callMe" function when link is clicked', function() {
            var markup = '<ul><action callback="callMe">Test</action></ul>';
            var element = $compile(angular.element(markup))($scope);
            $scope.$apply();

            element.find('a').click();

            expect($scope.callMe).toHaveBeenCalled()
        });

        it('should call "callMe" function with data when link is clicked', function() {
            var markup = '<ul><action callback="callMe" data="data">Test</action></ul>';
            var element = $compile(angular.element(markup))($scope);
            $scope.$apply();

            element.find('a').click();

            expect($scope.callMe).toHaveBeenCalledWith({animal: 'cat'});
        });
    });

})();
