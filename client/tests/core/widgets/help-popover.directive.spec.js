(function() {
    'use strict';

    describe('help-popover Directive', function() {
        var $compile, $scope, $element, directiveScope;

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

            $scope.helpTemplate = 'tests/core/widgets/templates/test-help-popover.html';

            var markup = '<help-popover template-url="helpTemplate">' +
                '</help-popover>';

            $element = angular.element(markup);
            $compile($element)($scope);
            $scope.$apply();

            //Ensure that the object is added to the body so that it becomes visible, and thus focusable.
            $('body').append($element);

            directiveScope = $element.isolateScope();
        }));

        it('should render help icon', function() {
            expect($element.find('.ardana-help-icon').length).toBe(1);
        });

        it('should show help if help icon clicked', function() {
            expect($element.find('.popover').length).toBe(0);

            $element.find('span').focus();

            expect($element.find('.popover').length).toBe(1);
        });

    });

})();
