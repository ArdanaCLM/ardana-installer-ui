(function() {
    'use strict';

    describe('DrawerService', function() {
        var $scope, DrawerService;
        var testData = {animal: 'cat'};

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
            $scope = $injector.get('$rootScope');
            DrawerService = $injector.get('DrawerService');

            spyOn($scope, '$emit').and.callThrough();

            $scope.$apply();
        }));

        it('should emit a drawer.open event on open()', function() {
            DrawerService.open({}, {});

            expect($scope.$emit).toHaveBeenCalledWith('drawer.open', {}, {});
        });

        it('should reject previous promise on open()', function() {
            DrawerService
                .open({}, {})
                .then(angular.noop, function handleReject(reason) {
                    expect(reason).toBe('only one drawer allowed');
                });

            // call open again without rejecting/resolving previous drawer
            DrawerService.open({}, {});
        });

        it('should emit a drawer.open event on open()', function() {
            DrawerService
                .open({}, {})
                .then(angular.noop, angular.noop, function handleNotify(data) {
                    expect(data).toEqual({animal: 'cat'});
                });

            DrawerService.notify(testData);
        });

        it('should emit a drawer.close event on resolve()', function() {
            DrawerService.open({}, {});
            DrawerService.resolve();

            expect($scope.$emit).toHaveBeenCalledWith('drawer.close');
        });

        it('should emit a drawer.close event on reject()', function() {
            DrawerService.open({}, {});
            DrawerService.reject();

            expect($scope.$emit).toHaveBeenCalledWith('drawer.close');
        });
    });

})();
