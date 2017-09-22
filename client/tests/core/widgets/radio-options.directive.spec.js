(function() {
    'use strict';

    describe('radio-options Directive', function() {
        var $timeout, $scope, $element;

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

        describe('with no on-click callback', function() {
            beforeEach(inject(function($injector) {
                var $compile = $injector.get('$compile');
                $timeout = $injector.get('$timeout');
                $scope = $injector.get('$rootScope').$new();

                $scope.modelValue = 'first';
                $scope.options = [
                    {
                        label: 'First',
                        value: 'first',
                        description: 'The first option',
                        overview: 'This is the first option'
                    },
                    {
                        label: 'Second',
                        value: 'second',
                        description: 'The second option',
                        overview: 'This is the second option'
                    }
                ];
                $scope.overviewTemplate = 'tests/core/widgets/templates/radio-options-overview.html';

                var markup = '<radio-options options="options" ' +
                    'model-value="modelValue" ' +
                    'overview-template="overviewTemplate" ' +
                    '</radio-options>';

                $element = angular.element(markup);
                $compile($element)($scope);

                spyOn($timeout, 'cancel').and.callThrough();

                $scope.$apply();
            }));

            it('should show two options', function() {
                expect($element.find('.option-button').length).toBe(2);
            });

            it('should update the model value to "second" when second option clicked', function() {
                $element.find('.option-button').next().click();

                expect($scope.modelValue).toBe('second');
            });

            // Show overview for hovered option
            it('should update overview to text from second option on mouseenter', function() {
                $element.find('.option-button').next().trigger('mouseenter');

                var overviewText = $element.find('.option-text').text().trim();
                expect(overviewText).toBe('Second: This is the second option');
            });

            // Show overview for first option by default if no options hovered
            it('should update overview to text from first option on mouseleave', function() {
                $element.find('.option-button').next().trigger('mouseenter');

                var overviewText = $element.find('.option-text').text().trim();
                expect(overviewText).toBe('Second: This is the second option');

                $element.find('.option-button').first().trigger('mouseleave');
                $timeout.flush();

                overviewText = $element.find('.option-text').text().trim();
                expect(overviewText).toBe('First: This is the first option');
            });

            // Keep current overview if mouse enters overview
            it('should keep latest overview if mouse enters overview panel', function() {
                $element.find('.option-button').next().trigger('mouseenter');

                var overviewText = $element.find('.option-text').text().trim();
                expect(overviewText).toBe('Second: This is the second option');

                $element.find('.option-overview').trigger('mouseenter');
                $timeout.flush();

                overviewText = $element.find('.option-text').text().trim();
                expect(overviewText).toBe('Second: This is the second option');
            });

            // Hover over option, then enter overview, and finally exit overview
            it('should show default overview if not hovering option or overview', function() {
                $element.find('.option-button').next().trigger('mouseenter');

                var overviewText = $element.find('.option-text').text().trim();
                expect(overviewText).toBe('Second: This is the second option');

                $element.find('.option-overview').trigger('mouseenter');
                $timeout.flush();

                overviewText = $element.find('.option-text').text().trim();
                expect(overviewText).toBe('Second: This is the second option');

                $element.find('.option-overview').trigger('mouseleave');
                $timeout.flush();

                overviewText = $element.find('.option-text').text().trim();
                expect(overviewText).toBe('First: This is the first option');
            });

            // Hover over option, then enter overview, and finally exit overview
            it('should cancel timeout if one already exists', function() {
                $element.find('.option-button').next().trigger('mouseenter');
                $element.find('.option-overview').trigger('mouseleave');
                $element.find('.option-button').next().trigger('mouseenter');
                $timeout.flush();

                expect($timeout.cancel).toHaveBeenCalled();
            });
        });

        describe('with on-click callback', function() {
            beforeEach(inject(function($injector) {
                var $compile = $injector.get('$compile');
                $timeout = $injector.get('$timeout');
                $scope = $injector.get('$rootScope').$new();

                $scope.callback = angular.noop;
                $scope.modelValue = 'first';
                $scope.options = [
                    {
                        label: 'First',
                        value: 'first',
                        description: 'The first option',
                        overview: 'This is the first option'
                    },
                    {
                        label: 'Second',
                        value: 'second',
                        description: 'The second option',
                        overview: 'This is the second option'
                    }
                ];
                $scope.overviewTemplate = 'tests/core/widgets/templates/radio-options-overview.html';

                var markup = '<radio-options options="options" ' +
                    'model-value="modelValue" on-click="callback" ' +
                    'overview-template="overviewTemplate" ' +
                    '</radio-options>';

                $element = angular.element(markup);
                $compile($element)($scope);

                spyOn($scope, 'callback').and.callThrough();
                spyOn($timeout, 'cancel').and.callThrough();

                $scope.$apply();
            }));

            it('should not call on-click callback if current option selected', function() {
                $element.find('.option-button').first().click();
                expect($scope.callback.calls.count()).toBe(0);
            });

            it('should call on-click callback if new option selected', function() {
                $element.find('.option-button').next().click();
                expect($scope.callback).toHaveBeenCalled();
            });
        });
    });

})();
