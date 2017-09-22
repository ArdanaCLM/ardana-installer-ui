(function() {
    'use strict';

    describe('action-col Directive', function() {
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

            $scope.add = angular.noop;
            $scope.edit = angular.noop;
            $scope.data = {animal: 'cat'};

            spyOn($scope, 'add').and.callThrough();
            spyOn($scope, 'edit').and.callThrough();
        }));

        it('should render action column', function() {
            var markup =
                '<div action-col>' +
                '  <li role="menuitem"><a ng-click="add()">Add</a></li>' +
                '  <li role="menuitem"><a ng-click="edit(data)">Edit</a></li>' +
                '</div>';
            var element = $compile(angular.element(markup))($scope);
            $scope.$apply();

            expect(element.find('ul').length).toBe(1);
            expect(element.find('li').length).toBe(2);
        });

        it('should trigger action functions correctly', function() {
            var markup =
                '<div action-col>' +
                '  <li role="menuitem"><a id="addAction" ng-click="add()">Add</a></li>' +
                '  <li role="menuitem"><a id="editAction" ng-click="edit(data)">Edit</a></li>' +
                '</div>';
            var element = $compile(angular.element(markup))($scope);
            $scope.$apply();

            element.find('#addAction').click();
            element.find('#editAction').click();

            expect($scope.add).toHaveBeenCalled();
            expect($scope.edit).toHaveBeenCalledWith({animal: 'cat'});
        });
    });

})();
