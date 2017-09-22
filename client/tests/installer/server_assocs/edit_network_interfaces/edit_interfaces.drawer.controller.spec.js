(function() {
    'use strict';

    describe('EditInterfacesDrawerController', function() {
        var $rootScope, $scope, $q, ConfirmModalService, $controller, sampleInterface, modalStub, modalDeferred, configController;

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

        beforeEach(module('dayzero.installer'));

        beforeEach(inject(function($injector) {
            $rootScope = $injector.get('$rootScope');
            $q = $injector.get('$q');
            $controller = $injector.get('$controller');

            ConfirmModalService = {
                open: function() {
                    var deferred = $q.defer();
                    deferred.resolve();
                    return deferred.promise;
                }
            };

            sampleInterface = {
                "interfaceName": "INTERFACE_SET_CONTROLLER",
                "model": {
                    "name": "INTERFACE_SET_CONTROLLER",
                    "network-interfaces": [
                        {
                            "name": "BOND0",
                            "device": {
                                "name": "bond0"
                            },
                            "bond-data": {
                                "options": {
                                    "bond-mode": 1,
                                    "bond-miimon": 200
                                },
                                "provider": "linux",
                                "devices": [
                                    {
                                        "name": "eth1"
                                    },
                                    {
                                        "name": "eth2"
                                    }
                                ]
                            },
                            "network-groups": [
                                "NG_1",
                                "NG_2"
                            ]
                        },
                        {
                            "name": "BOND1",
                            "device": {
                                "name": "bond1"
                            },
                            "bond-data": {
                                "options": {
                                    "bond-mode": 1,
                                    "bond-miimon": 200
                                },
                                "provider": "linux",
                                "devices": [
                                    {
                                        "name": "eth3"
                                    },
                                    {
                                        "name": "eth4"
                                    }
                                ]
                            },
                            "network-groups": [
                                "NG_3",
                                "NG_4"
                            ]
                        }
                    ]
                },
                "nicCount": 1
            }
        }));

        beforeEach(function() {
            $scope = $rootScope.$new();
            $scope['this_data'] = sampleInterface;
            modalDeferred = $q.defer();
            modalStub = {
                open: function() {
                    return {result: modalDeferred.promise};
                }
            };
            configController = $controller('EditInterfaceModelsController', {
                $scope: $scope,
                $modal: modalStub,
                'app.basePath': '',
                ConfirmModalService: ConfirmModalService
            });
        });

        describe('initializing the controller', function() {
            it('should build a list of used interfaces with bonds', function() {
                expect(configController.usedInterfaces).toEqual(['eth1', 'eth2', 'eth3', 'eth4']);
            });

            it('should build a list of used interfaces without bonds', function() {
                var noBondData = {
                    "interfaceName": "INTERFACE_SET_CONTROLLER",
                    "model": {
                        "name": "INTERFACE_SET_CONTROLLER",
                        "network-interfaces": [
                            {
                                "name": "BOND0",
                                "device": {
                                    "name": "eth1"
                                },
                                "network-groups": [
                                    "NG_1"
                                ]
                            }
                        ]
                    }
                };

                $scope.this_data = noBondData;
                configController = $controller('EditInterfaceModelsController', {
                    $scope: $scope,
                    $modal: modalStub,
                    'app.basePath': ''
                });

                expect(configController.usedInterfaces).toEqual(['eth1']);
            });

            it('should build a list of assigned network groups', function() {
                expect(configController.assignedNetworkGroups).toEqual(['NG_1', 'NG_2', 'NG_3', 'NG_4',]);
            });
        });

        describe('mapping table data from this_data', function() {
            it('should contain an object for each interface', function() {
                expect(configController.tableData.length).toBe(2);
            });

            it('should map the data from the model into display data', function() {
                var tableDataRow = configController.tableData[0];

                expect(tableDataRow['bondDevices']).toEqual('eth1, eth2');
                expect(tableDataRow['network-group']).toEqual('NG_1, NG_2');
                expect(tableDataRow['interfaceName']).toEqual('BOND0');
                expect(tableDataRow['deviceName']).toEqual('bond0');
            });

            it('should map the data when no bond is given', function() {
                var model = {
                    'network-interfaces': [
                        {
                            name: 'no bond',
                            device: {
                                name: 'no_bond'
                            },
                            'network-groups': ['NG1', 'NG2']
                        }
                    ]
                };
                $scope['this_data'] = {
                    model: model
                };
                configController = $controller('EditInterfaceModelsController', {
                    $scope: $scope,
                    $modal: {},
                    'app.basePath': ''
                });

                var tableDataRow = configController.tableData[0];

                expect(tableDataRow['bondDevices']).toBeUndefined();
                expect(tableDataRow['network-group']).toEqual('NG1, NG2');
                expect(tableDataRow['deviceName']).toBe('no_bond');
            });

            describe('should return empty table data when', function() {
                it('it gets an empty object', function() {
                    $scope['this_data'] = {};
                    configController = $controller('EditInterfaceModelsController', {
                        $scope: $scope,
                        $modal: {},
                        'app.basePath': ''
                    });

                    expect(configController.tableData).toEqual([]);
                });

                it('it has no interfaces given', function() {
                    $scope['this_data'] = {
                        model: {
                            'network-interfaces': []
                        }
                    };
                    configController = $controller('EditInterfaceModelsController', {
                        $scope: $scope,
                        $modal: {},
                        'app.basePath': ''
                    });

                    expect(configController.tableData).toEqual([]);
                });
            });
        });

        describe('#deleteInterface', function() {
            it('should remove the model at the given index from the controllers interface models', function(done) {
                configController.deleteInterface(configController.tableData[0]);

                modalDeferred.promise.then(function() {
                    expect(configController.interfaceRow.model['network-interfaces'].length).toBe(1);
                    expect(configController.tableData.length).toBe(1);
                    done();
                });
                modalDeferred.resolve();
                $rootScope.$digest();
            });

            it('should update the used interfaces', function() {
                configController.deleteInterface(configController.tableData[0]);

                modalDeferred.resolve();
                $rootScope.$digest();
                expect(configController.usedInterfaces).not.toEqual(jasmine.arrayContaining(['eth1', 'eth2']));
            });

            it('should build a list of assigned network groups', function() {
                configController.deleteInterface(configController.tableData[0]);

                modalDeferred.resolve();
                $rootScope.$digest();

                expect(configController.assignedNetworkGroups).toEqual(['NG_3', 'NG_4',]);
            });
        });

        describe('editInterface', function() {
            var dataRow;
            beforeEach(function() {
                dataRow = configController.tableData[0];
            });

            it('should parse the data returned by the modal', function(done) {
                configController.editInterface(dataRow);

                var returnedData = {
                    interfaces: {
                        eth0: true,
                        eth1: false,
                        eth2: false,
                        eth3: false,
                        eth4: false,
                        eth5: true
                    },
                    networkGroups: {
                        NG_1: false,
                        NG_2: false,
                        NG_3: true,
                        NG_4: false
                    },
                    interfaceName: 'INTERFACE_NAME',
                    bondAlias: "new Alias!",
                    bondOptions: {opts: "new Options!"}
                };
                modalDeferred.promise.then(function() {
                    var firstInterface = configController.interfaceRow['model']['network-interfaces'][0];

                    expect(firstInterface['bond-data'].devices).toEqual([
                        {
                            name: 'eth0'
                        },
                        {
                            name: 'eth5'
                        }
                    ]);
                    expect(firstInterface['network-groups']).toEqual(["NG_3"]);
                    expect(firstInterface['name']).toBe('INTERFACE_NAME');
                    expect(firstInterface['device']['name']).toEqual('new Alias!');
                    expect(firstInterface['bond-data'].options).toEqual({opts: "new Options!"});
                    done();
                });

                modalDeferred.resolve(returnedData);
                $rootScope.$digest();
            });

            it('should parse data with no bond-data', function(done) {
                configController.editInterface(dataRow);

                var returnedData = {
                    interfaceName: 'eth0',
                    interfaces: {
                        eth0: true,
                        eth1: false,
                        eth2: false,
                        eth3: false,
                        eth4: false,
                        eth5: false
                    },
                    networkGroups: {
                        NG_1: false,
                        NG_2: false,
                        NG_3: true,
                        NG_4: false
                    }
                };

                modalDeferred.promise.then(function() {
                    var firstInterface = configController.interfaceRow['model']['network-interfaces'][0];

                    expect(firstInterface['bond-data']).toBeUndefined();
                    expect(firstInterface['network-groups']).toEqual(["NG_3"]);
                    expect(firstInterface.device.name).toEqual('eth0');
                    expect(firstInterface['name']).toEqual('eth0');
                    done();
                });

                modalDeferred.resolve(returnedData);
                $rootScope.$digest();
            });

            it('should create a bond when multiple interfaces are selected', function(done) {
                var returnedData = {
                    interfaces: {
                        eth0: true,
                        eth1: false,
                        eth2: false,
                        eth3: false,
                        eth4: true,
                        eth5: false
                    },
                    networkGroups: {
                        NG_1: false,
                        NG_2: false,
                        NG_3: true,
                        NG_4: false
                    }
                };

                configController.editInterface(dataRow);
                modalDeferred.promise.then(function() {
                    var firstInterface = configController.interfaceRow['model']['network-interfaces'][0];

                    expect(firstInterface['bond-data']).toBeDefined();
                    expect(firstInterface['bond-data'].options).toBeUndefined();
                    expect(firstInterface['network-groups']).toEqual(["NG_3"]);
                    expect(firstInterface.device.name).toEqual('');
                    expect(firstInterface['name']).toEqual('');
                    done();
                });

                modalDeferred.resolve(returnedData);
                $rootScope.$digest();
            });

            it('should update the used interfaces', function() {
                var returnedData = {
                    interfaces: {
                        eth0: true,
                        eth1: false,
                        eth2: false,
                        eth3: false,
                        eth4: false,
                        eth5: true
                    },
                    networkGroups: {
                        NG_1: false,
                        NG_2: false,
                        NG_3: true,
                        NG_4: false
                    },
                    interfaceName: 'INTERFACE_NAME',
                    bondAlias: "new Alias!",
                    bondOptions: {opts: "new Options!"}
                };

                configController.editInterface(dataRow);
                modalDeferred.resolve(returnedData);
                $rootScope.$digest();

                expect(configController.usedInterfaces).toEqual(jasmine.arrayContaining(['eth0', 'eth5']));
            });

            it('should update the assigned network groups', function() {
                var returnedData = {
                    interfaces: {
                        eth0: true,
                        eth1: false,
                        eth2: false,
                        eth3: false,
                        eth4: false,
                        eth5: true
                    },
                    networkGroups: {
                        NG_1: true,
                        NG_2: false,
                        NG_3: false,
                        NG_4: false
                    },
                    interfaceName: 'INTERFACE_NAME',
                    bondAlias: "new Alias!",
                    bondOptions: {opts: "new Options!"}
                };

                configController.editInterface(dataRow);
                modalDeferred.resolve(returnedData);
                $rootScope.$digest();

                expect(configController.assignedNetworkGroups).toEqual(['NG_1', 'NG_3', 'NG_4',]);
            });
        });

        describe('addInterface', function() {
            var returnedData;
            beforeEach(function() {
                returnedData = {
                    interfaces: {
                        eth0: true,
                        eth1: false,
                        eth2: false,
                        eth3: false,
                        eth4: false,
                        eth5: true
                    },
                    networkGroups: {
                        NG_1: false,
                        NG_2: false,
                        NG_3: true,
                        NG_4: false
                    },
                    interfaceName: 'INTERFACE_NAME',
                    bondAlias: "new Alias!",
                    bondOptions: {opts: "new Options!"}
                };
            });

            it('should parse the data returned by the modal', function(done) {
                configController.addInterface();

                modalDeferred.promise.then(function() {
                    expect(configController.interfaceRow['model']['network-interfaces'].length).toBe(3);
                    var newInterface = configController.interfaceRow['model']['network-interfaces'][2];

                    expect(newInterface['bond-data'].devices).toEqual([
                        {
                            name: 'eth0'
                        },
                        {
                            name: 'eth5'
                        }
                    ]);
                    expect(newInterface['network-groups']).toEqual(["NG_3"]);
                    expect(newInterface['name']).toEqual('INTERFACE_NAME');
                    expect(newInterface['device']['name']).toEqual('new Alias!');
                    expect(newInterface['bond-data'].options).toEqual({opts: "new Options!"});
                    done();
                });

                modalDeferred.resolve(returnedData);
                $rootScope.$digest();
            });

            it('should update the used interfaces', function() {
                configController.addInterface();

                modalDeferred.resolve(returnedData);
                $rootScope.$digest();

                expect(configController.usedInterfaces).toEqual(jasmine.arrayContaining(['eth0', 'eth5']));
            });

            describe('when model is empty', function() {
                beforeEach(function() {
                    $scope.this_data = {};
                    configController = $controller('EditInterfaceModelsController', {
                        $scope: $scope,
                        $modal: modalStub,
                        'app.basePath': ''
                    });
                });

                it('should initialize the model before adding', function(done) {
                    configController.addInterface();

                    modalDeferred.promise.then(function() {
                        expect(configController.interfaceRow['model']['network-interfaces'].length).toBe(1);
                        var newInterface = configController.interfaceRow['model']['network-interfaces'][0];

                        expect(newInterface['bond-data'].devices).toEqual([
                            {
                                name: 'eth0'
                            },
                            {
                                name: 'eth5'
                            }
                        ]);
                        expect(newInterface['network-groups']).toEqual(["NG_3"]);
                        expect(newInterface['name']).toEqual('INTERFACE_NAME');
                        expect(newInterface['device']['name']).toEqual('new Alias!');
                        expect(newInterface['bond-data'].options).toEqual({opts: "new Options!"});
                        done();
                    });

                    modalDeferred.resolve(returnedData);
                    $rootScope.$digest();
                });
            });
        });
    });
})();
