(function() {
    'use strict';

    describe('NewInterfaceController', function() {
        var $rootScope, $controller, emptyInterface, loadedInterface, installDataService;
        beforeEach(module('dayzero.installer'));

        beforeEach(inject(function($injector) {
            $rootScope = $injector.get('$rootScope');
            $controller = $injector.get('$controller');
        }));

        beforeEach(function() {
            emptyInterface = {
                interfaces: {},
                networkGroups: {
                    'External': false,
                    'Management': false,
                    'OBJ': false,
                    'VXLAN': false
                },
                forcedNetworkGroups: {
                    'External': false,
                    'Management': false,
                    'OBJ': false,
                    'VXLAN': false
                },
                interfaceName: '',
                bondAlias: ''
            };
            loadedInterface = {
                interfaces: {
                    eth0: true,
                    eth2: true,
                    eth4: true
                },
                networkGroups: {
                    'External': true,
                    'Management': true,
                    'OBJ': false,
                    'VXLAN': true
                },
                forcedNetworkGroups: {
                    'External': false,
                    'Management': false,
                    'OBJ': false,
                    'VXLAN': false
                },
                interfaceName: '007',
                bondAlias: '007',
                bondOptions: {opts: "bond options"}
            };

            installDataService = {
                data: {
                    'network-groups': {
                        External: {},
                        Management: {},
                        OBJ: {},
                        VXLAN: {}
                    }
                }
            }
        });

        it('should create an empty model when no data is passed to the scope', function() {
            var controller = $controller('NewInterfaceController', {
                $scope: $rootScope.$new(),
                $modalInstance: {},
                ardanaInstallationData: installDataService,
                assignedInterfaces: [],
                assignedNetworkGroups: []
            });

            expect(controller.interface).toEqual(emptyInterface);
        });

        it('should create a filled model when data is passed to the scope', function() {
            var scope = $rootScope.$new();
            scope.data = {
                'bond-data': {
                    devices: [
                        {
                            name: 'eth0'
                        },
                        {
                            name: 'eth2'
                        },
                        {
                            name: 'eth4'
                        }
                    ],
                    options: {opts: "bond options"}
                },
                device: {
                    name: '007'
                },
                name: '007',
                'network-groups': ['External', 'Management', 'VXLAN']
            };
            var controller = $controller('NewInterfaceController', {
                $scope: scope,
                $modalInstance: {},
                ardanaInstallationData: installDataService,
                assignedInterfaces: [],
                assignedNetworkGroups: []
            });

            expect(controller.interface).toEqual(loadedInterface);
        });

        it('should create a filled model when data without bond data is passed to the scope', function() {
            var scope = $rootScope.$new();
            loadedInterface = {
                interfaces: {
                    eth0: true
                },
                networkGroups: {
                    'External': true,
                    'Management': true,
                    'OBJ': false,
                    'VXLAN': true
                },
                forcedNetworkGroups: {
                    'External': false,
                    'Management': false,
                    'OBJ': false,
                    'VXLAN': false
                },
                interfaceName: '007',
                'bondAlias': ''
            };
            scope.data = {
                device: {name: 'eth0'},
                name: '007',
                'network-groups': ['External', 'Management', 'VXLAN']
            };
            var controller = $controller('NewInterfaceController', {
                $scope: scope,
                $modalInstance: {},
                ardanaInstallationData: installDataService,
                assignedInterfaces: [],
                assignedNetworkGroups: []
            });

            expect(controller.interface).toEqual(loadedInterface);
        });

        describe('data invalid flag', function() {
            var $scope, controller;
            beforeEach(function() {
                $scope = $rootScope.$new();
                controller = $controller('NewInterfaceController', {
                    $scope: $scope,
                    $modalInstance: {},
                    ardanaInstallationData: installDataService,
                    assignedInterfaces: [],
                    assignedNetworkGroups: []
                });
            });

            it('should indicate that data is invalid on yaml failed event', function(done) {
                $scope.$on('json.conversion.failed', function() {
                    expect(controller.isInvalid).toBe(true);
                    done();
                });
                $scope.$apply();

                $scope.$emit('json.conversion.failed');
                $scope.$apply();
            });

            it('should indicate that data is valid on yaml succeded event', function(done) {
                $scope.$on('json.conversion.succeeded', function() {
                    expect(controller.isInvalid).toBe(false);
                    done();
                });
                $scope.$apply();

                $scope.$emit('json.conversion.failed');
                $scope.$apply();
                $scope.$emit('json.conversion.succeeded');
                $scope.$apply();
            });
        });

        describe('isInterfaceUnavailable', function() {
            var $scope, controller;
            beforeEach(function() {
                $scope = $rootScope.$new();
                $scope.data = {
                    'bond-data': {
                        devices: [
                            {
                                name: 'eth0'
                            },
                            {
                                name: 'eth2'
                            },
                            {
                                name: 'eth4'
                            }
                        ],
                        options: {opts: "bond options"}
                    },
                    device: {
                        name: '007'
                    },
                    name: '007',
                    'network-groups': ['External', 'Management', 'VXLAN']
                };
                controller = $controller('NewInterfaceController', {
                    $scope: $scope,
                    $modalInstance: {},
                    ardanaInstallationData: installDataService,
                    assignedInterfaces: ['eth0', 'eth1', 'eth2', 'eth4'],
                    assignedNetworkGroups: []
                });
            });

            it('should return true if interface name is present in assignedInterfaces and not in the current bond', function() {
                expect(controller.isInterfaceUnavailable('eth1')).toBe(true);
            });

            it('should return false if interface name is not present in assignedInterfaces', function() {
                expect(controller.isInterfaceUnavailable('eth3')).toBe(false);
            });

            it('should return false if interface name is present in current bond', function() {
                expect(controller.isInterfaceUnavailable('eth0')).toBe(false);
            });
        });

        describe('isNetworkGroupUnavailable', function() {
            var $scope, controller;
            beforeEach(function() {
                $scope = $rootScope.$new();
                $scope.data = {
                    'bond-data': {
                        devices: [
                            {
                                name: 'eth0'
                            },
                            {
                                name: 'eth2'
                            },
                            {
                                name: 'eth4'
                            }
                        ],
                        options: {opts: "bond options"}
                    },
                    device: {
                        name: '007'
                    },
                    name: '007',
                    'network-groups': ['External', 'Management', 'VXLAN']
                };
                controller = $controller('NewInterfaceController', {
                    $scope: $scope,
                    $modalInstance: {},
                    ardanaInstallationData: installDataService,
                    assignedInterfaces: ['eth0', 'eth1', 'eth2', 'eth4'],
                    assignedNetworkGroups: ['Group3', 'Group4', 'External', 'Management', 'VXLAN']
                });
            });

            it('should return true if network group is present in assignedInterfaces and not in the current bond', function() {
                expect(controller.isNetworkGroupUnavailable('Group3')).toBe(true);
            });

            it('should return false if network group is not present in assignedInterfaces', function() {
                expect(controller.isNetworkGroupUnavailable('SomeGroup')).toBe(false);
            });

            it('should return false if network group is present in current bond', function() {
                expect(controller.isNetworkGroupUnavailable('VXLAN')).toBe(false);
            });
        });

        describe('modalInstance', function() {
            var $scope, modalInstance, controller;

            beforeEach(function() {
                $scope = $rootScope.$new();
                modalInstance = {
                    close: jasmine.createSpy(),
                    dismiss: jasmine.createSpy()
                };
                controller = $controller('NewInterfaceController', {
                    $scope: $scope,
                    $modalInstance: modalInstance,
                    ardanaInstallationData: installDataService,
                    assignedInterfaces: [],
                    assignedNetworkGroups: []
                });
            });

            it('should close modal on save', function() {
                controller.save();
                expect(modalInstance.close).toHaveBeenCalled();
            });

            it('should dismiss modal on cancel', function() {
                controller.cancel();
                expect(modalInstance.dismiss).toHaveBeenCalled();
            });
        });
    });
})();
