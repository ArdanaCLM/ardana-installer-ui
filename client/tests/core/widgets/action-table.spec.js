(function() {
    'use strict';

    describe('action-table Filters', function() {
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

        describe('multiKey Filter', function() {
            var filter;

            beforeEach(inject(function($injector) {
                filter = $injector.get('multiKeyFilter');
            }));

            it('should return item value if item is not an array', function() {
                var item = {animal: 'cat'};
                var value = filter(item, 'animal');

                expect(value).toBe('cat');
            });

            it('should return values delimited by space if item is an array and separator unspecified', function() {
                var item = {animal: 'cat', name: 'Boomer'};
                var value = filter(item, ['name', 'animal']);

                expect(value).toBe('Boomer cat');
            });

            it('should return values delimited by "is a" if item is an array and separator specified', function() {
                var item = {animal: 'cat', name: 'Boomer'};
                var value = filter(item, ['name', 'animal'], ' is a ');

                expect(value).toBe('Boomer is a cat');
            });

            it('should return empty string if item is an array and empty', function() {
                var item = {animal: '', name: ''};
                var value = filter(item, ['name', 'animal']);

                expect(value).toBe('');
            });
        });

        describe('multiValue Filter', function() {
            var filter;

            beforeEach(inject(function($injector) {
                filter = $injector.get('multiValueFilter');
            }));

            it('should return a delimited value if arrayKey is set and key is not set', function() {
                var item = {animals: ['cat', 'dog', 'fish']};
                var value = filter(item, 'animals');

                expect(value).toBe('cat, dog, fish');
            });

            it('should return a delimited value if arrayKey and key is set', function() {
                var item = {
                    animals: [
                        {name: 'Boomer'},
                        {name: 'Fido'},
                        {name: 'Nemo'}
                    ]
                };
                var value = filter(item, 'animals', 'name');

                expect(value).toBe('Boomer, Fido, Nemo');
            });

            it('should return a undelimited value if arrayKey is not set', function() {
                var item = {animal: 'cat'};
                var value = filter(item, null, 'animal');

                expect(value).toBe('cat');
            });

            it('should return blank value if item does not have value for arrayKey', function() {
                var item = {animal: 'cat'};
                var value = filter(item, 'feline');

                expect(value).toBe('');
            });

            it('should return values delimited by semicolon if that separator specified', function() {
                var item = {animals: ['cat', 'dog', 'fish']};
                var value = filter(item, 'animals', null, ';');

                expect(value).toBe('cat;dog;fish');
            });
        });
    });

})();
