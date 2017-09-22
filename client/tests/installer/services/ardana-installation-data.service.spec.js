(function() {
    'use strict';

    describe('ardanaInstallationData Service', function() {
        var $rootScope, service, config;

        beforeEach(module('dayzero.installer'));

        beforeEach(function() {
            config = {};

            module(function($provide) {
                $provide.value('config', config);
            });
        });

        beforeEach(inject(function($injector) {
            $rootScope = $injector.get('$rootScope');
            service = $injector.get('ardanaInstallationData');

            spyOn($rootScope, '$broadcast').and.callThrough();
        }));

        it('should be defined', function() {
            expect(service).toBeDefined();
            expect(service.data).toBeDefined();
        });

        it('should broadcast ardanaInstallationData.update event on dataChanged', function() {
            service.dataChanged('test', {name: 'test'});
            expect($rootScope.$broadcast)
                .toHaveBeenCalledWith('ardanaInstallationData.update:test', {name: 'test'});
        });

        it('should broadcast ardanaInstallationData.update event on setData', function() {
            service.setData({});
            expect($rootScope.$broadcast).toHaveBeenCalled();
        });

        it('should be able to set data', function() {
            var testData = {
                control_plane: {name: 'cp'},
                servers: [{name: 'server'}]
            };
            service.setData({inputModel: testData});

            expect(service.data.control_plane).toEqual({name: 'cp'});
            expect(service.data.servers).toEqual([{name: 'server'}]);
        });
    });

})();
