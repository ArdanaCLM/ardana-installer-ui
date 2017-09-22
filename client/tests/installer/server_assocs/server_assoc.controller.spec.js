/**
 * (c) Copyright 2015-2017 Hewlett Packard Enterprise Development LP
 * (c) Copyright 2017 SUSE LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */
(function() {
    'use strict';

    describe('ServerAssociationController', function() {
        var $controller, $q, modalDeferred, drawerDeferred, $rootScope, $translatePartialLoader, $translate;
        var simpleInterfaceModels, simpleDiskModels, stubArdanaData, controller, drawerServiceStub;

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

        beforeEach(inject(function(_$controller_, _$q_, _$rootScope_, _$translatePartialLoader_, _$translate_) {
            $controller = _$controller_;
            $q = _$q_;
            $rootScope = _$rootScope_;
            $translatePartialLoader = _$translatePartialLoader_;
            $translate = _$translate_;
        }));

        beforeEach(function() {
            simpleInterfaceModels = [
                {
                    "name": "Model 1",
                    "network-interfaces": [
                        {
                            name: 'interface 1'
                        },
                        {
                            name: 'interface 2'
                        },
                        {
                            name: 'interface 3'
                        }
                    ]
                }
            ];

            simpleDiskModels = [
                {
                    "name": "Disk Model with Volume Group and Device Group",
                    "volume-groups": ["vg0", {}],
                    "device-groups": ["dg0", {}]
                },
                {
                    "name": "Disk Model with Volume Group",
                    "volume-groups": ["vg0", {}]
                }
            ];

            stubArdanaData = {
                data: {
                    "interface-models": simpleInterfaceModels,
                    "disk-models": simpleDiskModels
                },
                dataChanged: angular.noop
            };

            drawerDeferred = $q.defer();
            drawerServiceStub = {
                open: function() {
                    return drawerDeferred.promise;
                }
            };
            modalDeferred = $q.defer();
            var modalStub = {
                open: function() {
                    return {result: modalDeferred.promise};
                }
            };
            controller = $controller('ServerAssociationController',
                {
                    $scope: $rootScope.$new(),
                    $translatePartialLoader: $translatePartialLoader,
                    $translate: $translate,
                    ardanaInstallationData: stubArdanaData,
                    DrawerService: drawerServiceStub,
                    $modal: modalStub,
                    'app.basePath': ''
                });
        });

        describe('ardanaInstallationData.update event', function() {
            it('should set interface models data', function() {
                var fakeData = [
                    {
                        name: 'foo',
                        'network-interfaces': [{name: 'a'}, {name: 'b'}]
                    },
                    {
                        name: 'bar',
                        'network-interfaces': [{name: 'c'}, {name: 'd'}]
                    }
                ];
                stubArdanaData.data['interface-models'] = fakeData;
                $rootScope.$broadcast('ardanaInstallationData.update');

                expect(controller.data['interface-models'].length).toBe(2);

                var firstModel = controller.data['interface-models'][0];
                expect(firstModel.name).toBe('foo');
                expect(firstModel['network-interfaces']).toEqual([{name: 'a'}, {name: 'b'}]);

                var secondModel = controller.data['interface-models'][1];
                expect(secondModel.name).toBe('bar');
                expect(secondModel['network-interfaces']).toEqual([{name: 'c'}, {name: 'd'}]);
            });
        });

        describe('Disk model table', function() {
            describe('Editing a disk model', function() {
                it('should replace the existing interface with data returned from the drawer', function(done) {
                    var row = controller.data['disk-models'][1];
                    var resolvedData = {name: 'object'};
                    controller.editDiskModel({row: row});

                    drawerDeferred.promise.then(function() {
                        expect(controller.data['disk-models'][1].name).toEqual('object');
                        done();
                    });

                    drawerDeferred.resolve(resolvedData);
                    $rootScope.$digest();
                });
            });

            describe('Creating a disk model', function() {
                it('should create a new disk model and add the model to the table', function() {
                    var config = {
                        drawer: {
                            commitLabel: 'server_assocs.disk_models.btn.commit',
                            showContinue: false,
                            title: "server_assocs.disk_models.add",
                            template: "/installer/server_assocs/disk_models/edit_disk_model/edit_disk_model.drawer.html",
                            metadata: {
                                diskModels: []
                            }
                        }
                    };

                    var drawerServiceSpy = spyOn(drawerServiceStub, 'open').and.callThrough();
                    controller.createDiskModel();

                    expect(drawerServiceSpy).toHaveBeenCalledWith(config.drawer, {
                        'device-groups': [],
                        'volume-groups': []
                    });

                    var resolvedData = {name: 'new disk model'};

                    drawerDeferred.promise.then(function() {
                        expect(controller.data['disk-models'][2]).toEqual(resolvedData);
                    });

                    drawerDeferred.resolve(resolvedData);
                    $rootScope.$apply();
                });
            });
        });

        describe('Interface model table', function() {
            describe('#editInterface', function() {
                var newData;
                beforeEach(function() {
                    newData = {
                        model: {
                            name: 'interfaceName',
                            'network-interfaces': 'different data'
                        }
                    };
                });

                it('should update its model with the data from the drawer', function(done) {
                    var row = controller.data['interface-models'][0];
                    controller.editInterface({row: row});

                    drawerDeferred.promise.then(function() {
                        expect(controller.data['interface-models'][0]).toEqual(newData.model);
                        done();
                    });

                    drawerDeferred.resolve(newData);
                    $rootScope.$digest();
                });

                it('should update the data service', function() {
                    var row = controller.data['interface-models'][0];
                    controller.editInterface({row: row});

                    drawerDeferred.promise.then(function() {
                        expect(stubArdanaData.data['interface-models'][0]).toEqual(newData.model);
                    });

                    drawerDeferred.resolve(newData);
                    $rootScope.$digest();
                });
            });

            describe('#createInterface', function() {
                var newData;
                beforeEach(function() {
                    newData = {
                        model: {
                            name: 'interfaceName',
                            'network-interfaces': 'different data'
                        }
                    };
                });

                it('should open a drawer with the edit drawer config', function() {
                    spyOn(drawerServiceStub, 'open').and.callThrough();

                    controller.createInterface();

                    var configArg = drawerServiceStub.open.calls.argsFor(0)[0];
                    expect(configArg.title).toEqual('server_assocs.interface_models.create');
                    expect(configArg.template).toContain('edit_interfaces.drawer.html');
                });

                it('should add the drawer result data to the controller model', function() {
                    controller.createInterface();

                    drawerDeferred.promise.then(function() {
                        expect(controller.data['interface-models'].length).toEqual(2);
                        expect(controller.data['interface-models'][1]).toEqual(newData.model);
                    });

                    drawerDeferred.resolve(newData);
                    $rootScope.$digest();
                });

                it('should update the data service', function() {
                    controller.createInterface();

                    drawerDeferred.promise.then(function() {
                        expect(stubArdanaData.data['interface-models'][1]).toEqual(newData.model);
                    });

                    drawerDeferred.resolve(newData);
                    $rootScope.$digest();
                });
            });
        });

        describe('Server Association Table', function() {
            var simpleInterfaceModels, simpleDiskModels, stubArdanaData, controller, drawerServiceStub;

            beforeEach(function() {
                simpleInterfaceModels = [
                    {
                        "name": "Model 1",
                        "network-interfaces": [
                            {
                                name: 'interface 1'
                            },
                            {
                                name: 'interface 2'
                            },
                            {
                                name: 'interface 3'
                            }
                        ]
                    }
                ];

                simpleDiskModels = [
                    {
                        "name": "Disk Model with Volume Group and Device Group",
                        "volume-groups": ["vg0", {}],
                        "device-groups": ["dg0", {}]
                    },
                    {
                        "name": "Disk Model with Volume Group",
                        "volume-groups": ["vg0", {}]
                    }
                ];

                stubArdanaData = {
                    data: {
                        "interface-models": simpleInterfaceModels,
                        "disk-models": simpleDiskModels
                    },
                    dataChanged: angular.noop
                };

                drawerDeferred = $q.defer();

                drawerServiceStub = {
                    open: function() {
                        return drawerDeferred.promise;
                    }
                };
                modalDeferred = $q.defer();
                var modalStub = {
                    open: function() {
                        return {result: modalDeferred.promise};
                    }
                };
                controller = $controller('ServerAssociationController',
                    {
                        $scope: $rootScope.$new(),
                        ardanaInstallationData: stubArdanaData,
                        DrawerService: drawerServiceStub,
                        $modal: modalStub,
                        'app.basePath': ''
                    });
            });

            it('should have an action for editing the disk model', function() {
                var drawerServiceSpy = spyOn(drawerServiceStub, 'open').and.callThrough();
                expect(controller.serverAssociationTableActions.length).toBe(2);
                expect(controller.serverAssociationTableActions[0].label).toBe('server_assocs.disk_models.edit');

                var config = {
                    commitLabel: 'server_assocs.disk_models.btn.commit',
                    showContinue: false,
                    title: 'server_assocs.disk_models.edit',
                    template: '/installer/server_assocs/disk_models/edit_disk_model/edit_disk_model.drawer.html',
                    metadata: {
                        diskModels: []
                    }
                };

                var serverRole = {
                    'disk-model': "Disk Model with Volume Group and Device Group"
                };

                var diskModelDetail = {
                    "name": "Disk Model with Volume Group and Device Group",
                    "volume-groups": ["vg0", {}],
                    "device-groups": ["dg0", {}]
                };

                controller.serverAssociationTableActions[0].callback(serverRole);

                expect(drawerServiceSpy).toHaveBeenCalledWith(config, diskModelDetail);

                var resolvedData = {name: 'updated disk model'};

                drawerDeferred.promise.then(function() {
                    expect(controller.data['disk-models'][0].name).toBe('updated disk model');
                    expect(serverRole['disk-model']).toBe('updated disk model');
                });

                drawerDeferred.resolve(resolvedData);
                $rootScope.$apply();
            });

            it('should have an action for editing the interface model', function() {
                spyOn(stubArdanaData, 'dataChanged').and.callThrough();
                var drawerServiceSpy = spyOn(drawerServiceStub, 'open').and.callThrough();
                expect(controller.serverAssociationTableActions.length).toBe(2);
                expect(controller.serverAssociationTableActions[1].label).toBe('server_assocs.interface_models.edit');

                var config = {
                    commitLabel: "server_assocs.interface_models.btn.commit",
                    showContinue: false,
                    title: "server_assocs.interface_models.edit",
                    template: "/installer/server_assocs/edit_network_interfaces/edit_interfaces.drawer.html",
                    metadata: {
                        interfaceModels: simpleInterfaceModels
                    }
                };

                var interfaceModelName = {
                    'interface-model': "Model 1"
                };

                var interfaceModelDetail = {
                    "name": "Model 1",
                    "network-interfaces": [
                        {
                            name: 'interface 1'
                        },
                        {
                            name: 'interface 2'
                        },
                        {
                            name: 'interface 3'
                        }
                    ]
                };

                var formattedInterfaceModelDetail = {
                    "interfaceName": "Model 1",
                    "model": interfaceModelDetail
                };

                controller.serverAssociationTableActions[1].callback(interfaceModelName);

                expect(drawerServiceSpy).toHaveBeenCalled();

                var resolvedData = {model: {name: 'updated interface model'}};

                drawerDeferred.promise.then(function() {
                    expect(controller.data['interface-models'][0].name).toBe('updated interface model');
                    expect(interfaceModelName['interface-model']).toBe('updated interface model');
                });

                drawerDeferred.resolve(resolvedData);
                $rootScope.$apply();
            });
        });
    });
})();
