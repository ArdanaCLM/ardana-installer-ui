(function() {
    'use strict';

    describe('drawer Directive', function() {
        var $scope, $element, DrawerService;
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
            $scope = $injector.get('$rootScope').$new();
            DrawerService = $injector.get('DrawerService');

            var markup = '<drawer></drawer>';

            $element = $compile(angular.element(markup))($scope);

            spyOn(DrawerService, 'notify').and.callThrough();
            spyOn(DrawerService, 'reject').and.callThrough();
            spyOn(DrawerService, 'resolve').and.callThrough();

            $scope.$apply();
        }));

        it('should show drawer with default data and config on drawer.open event', function() {
            $scope.$emit('drawer.open');

            var directiveScope = $element.isolateScope();
            expect(directiveScope.active).toBe(true);
            expect(directiveScope.config).toBeDefined();
            expect(directiveScope.this_data).toBeDefined();
            expect(directiveScope.drawerForm.$pristine).toBe(true);
        });

        it('should show drawer with specified data on drawer.open event with data', function() {
            $scope.$emit('drawer.open', {}, testData);

            var directiveScope = $element.isolateScope();
            expect(directiveScope.this_data).toEqual({animal: 'cat'});
        });

        it('should show drawer with specified config on drawer.open event with config', function() {
            var config = {
                commitLabel: 'Update',
                continueLabel: 'Continue'
            };
            $scope.$emit('drawer.open', config);

            var directiveScope = $element.isolateScope();
            expect(directiveScope.config).toEqual({
                    cancelLabel: 'Cancel',
                    commitLabel: 'Update',
                    continueLabel: 'Continue'
                }
            );
        });

        it('should reject with reason "cancel" if cancel() called', function() {
            var directiveScope = $element.isolateScope();
            directiveScope.cancel();

            expect(DrawerService.reject).toHaveBeenCalledWith('cancel');
        });

        it('should resolve with correct data if commit() called', function() {
            var directiveScope = $element.isolateScope();
            directiveScope.this_data = testData;
            directiveScope.commit();

            expect(DrawerService.resolve).toHaveBeenCalledWith({animal: 'cat'});
        });

        it('should notify with correct data if continue() called', function() {
            var directiveScope = $element.isolateScope();
            directiveScope.this_data = testData;
            directiveScope.continue();

            expect(DrawerService.notify).toHaveBeenCalledWith({animal: 'cat'});
            expect(directiveScope.this_data).toEqual({});
            expect(directiveScope.drawerForm.$pristine).toBe(true);
        });

        it('should set active to false on drawer.close event', function() {
            $scope.$emit('drawer.close');

            expect($element.isolateScope().active).toBe(false);
        });
    });

})();
