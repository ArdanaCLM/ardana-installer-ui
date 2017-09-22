(function() {
    'use strict';

    describe('action-table Controller', function() {
        var ctrl;

        beforeEach(module('dayzero'));

        beforeEach(inject(function($injector) {
            var $controller = $injector.get('$controller');
            ctrl = $controller('ActionTableController');
        }));

        it('should be defined', function() {
            expect(ctrl).toBeDefined();
        });

        it('should set _expanded to false if toggleDetails() called', function() {
            var row = {animal: 'cat'};

            ctrl.toggleDetails(row);
            expect(row._expanded).toBe(true);

            ctrl.toggleDetails(row);
            expect(row._expanded).toBe(false);
        });
    });
})();
