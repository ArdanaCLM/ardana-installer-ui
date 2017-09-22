(function() {
    'use strict';

    describe('ConfirmModalController', function() {
        var $translate, $modalInstance, ctrl;

        beforeEach(module('dayzero'));

        beforeEach(inject(function($injector) {
            $translate = $injector.get('$translate');
            $modalInstance = {
                close: angular.noop,
                dismiss: angular.noop
            };

            var $controller = $injector.get('$controller');
            ctrl = $controller('ConfirmModalController', {
                $translate: $translate,
                $modalInstance: $modalInstance,
                modalData: {
                    name: 'foo'
                },
                modalConfig: {
                    message: 'This is my message'
                }
            });

            spyOn($modalInstance, 'close').and.callThrough();
            spyOn($modalInstance, 'dismiss').and.callThrough();
        }));

        it('should be defined', function() {
            expect(ctrl).toBeDefined();
        });

        it('should call close if ok() called', function() {
            ctrl.ok();
            expect($modalInstance.close).toHaveBeenCalled();
        });

        it('should call dismiss if cancel() called', function() {
            ctrl.cancel();
            expect($modalInstance.dismiss).toHaveBeenCalled();
        });
    });
})();
