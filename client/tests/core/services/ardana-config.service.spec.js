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

    describe('config Service', function() {
        var $httpBackend, service, $http;
        var apiPath = '/dayzeroapi/';

        var defaultDayZeroConfig = {
            '_defaults': {},
            'baremetal': {
                'cloud': {}
            },
            'disk-models': [],
            'interface-models': [],
            'network-groups': {},
            'nic-mappings': [],
            'server-groups': [],
            'server-roles': [],
            'servers': []
        };

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
            $httpBackend = $injector.get('$httpBackend');
            service = $injector.get('config');
            $http = $injector.get('$http');
        }));

        it('should be defined', function() {
            expect(service).toBeDefined();
        });

        it('should return config in format consumable by installer', function(done) {
            var standardConfig;
            var configData = {
                'cloud': {
                    'control-planes': []
                },
                'disk-models': [
                    {name: 'disk model compute'},
                    {name: 'disk model controller'}
                ],
                'interface-models': [
                    {name: 'interface model 1'},
                    {name: 'interface model 2'}
                ],
                networks: [
                    {name: 'network 1', 'network-group': 'network group 1'},
                    {name: 'network 2', 'network-group': 'network group 1'},
                    {name: 'network 3', 'network-group': 'network group 2'},
                    {name: 'network 4', 'network-group': 'network group 2'},
                    {name: 'network 5', 'network-group': 'unknown'}
                ],
                'network-groups': [
                    {name: 'network group 1'},
                    {name: 'network group 2'}
                ],
                'nic-mappings': [
                    {name: 'nic mapping 1'},
                    {name: 'nic mapping 2'}
                ],
                'server-groups': [
                    {name: 'server group 1'},
                    {name: 'server groups 2'}
                ],
                'server-roles': [
                    {
                        name: 'server role 1',
                        'interface-model': 'interface model 1',
                        'disk-model': 'disk model compute'
                    },
                    {
                        name: 'server role 2',
                        'interface-model': 'interface model 2',
                        'disk-model': 'disk model controller'
                    }
                ],
                servers: [
                    {'ip-addr': '0.0.0.0', role: 'server role 1', 'nic-mapping': 'nic mapping 1'},
                    {'ip-addr': '1.1.1.1', role: 'server role 2', 'nic-mapping': 'nic mapping 2'}
                ]
            };

            $httpBackend.expectGET(apiPath + 'templates/standard').respond({inputModel: configData});
            service.getConfig('standard').then(function(data) {
                standardConfig = data.inputModel;

                expect(standardConfig.baremetal).toBeDefined();
                expect(standardConfig._defaults['cloud']).toBeDefined();
                expect(standardConfig['disk-models'].length).toBe(2);
                expect(standardConfig['interface-models'].length).toBe(2);
                expect(Object.keys(standardConfig['network-groups']).length).toBe(3);
                expect(Object.keys(standardConfig['nic-mappings']).length).toBe(2);
                expect(standardConfig['server-groups'].length).toBe(2);
                expect(standardConfig['server-roles'].length).toBe(2);
                expect(standardConfig.servers.length).toBe(2);
                done();
            });
            $httpBackend.flush();

        });

        it('should return config with network-groups', function(done) {
            var standardConfig;
            var configData = {
                'network-groups': [
                    {name: 'network group 1'},
                    {name: 'network group 2'}
                ]
            };

            $httpBackend.expectGET(apiPath + 'templates/standard').respond({inputModel: configData});
            service.getConfig('standard').then(function(data) {
                standardConfig = data.inputModel;
                done();
            });
            $httpBackend.flush();

            expect(Object.keys(standardConfig['network-groups']).length).toBe(2);
        });

        it('should return config with empty list for servers if undefined', function(done) {
            var standardConfig;
            var configData = {
                servers: undefined
            };

            $httpBackend.expectGET(apiPath + 'templates/standard').respond({inputModel: configData});
            service.getConfig('standard').then(function(data) {
                standardConfig = data.inputModel;

                expect(standardConfig.servers).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });

        it('should return cloud types when calling getCloudTypes()', function() {
            var cloudTypes;

            $httpBackend.expectGET(apiPath + 'templates').respond([{name: 'zStandard'}, {name: 'aSingle'}]);
            service.getCloudTypes().then(function(clouds) {
                cloudTypes = clouds;
            });
            $httpBackend.flush();

            expect(cloudTypes).toEqual([{name: 'aSingle'}, {name: 'zStandard'}]);
        });

        it('getConfig should handle an empty response from server', function() {
            var cloudTypes;

            $httpBackend.expectGET(apiPath + 'templates' + '/example').respond({ });
            service.getConfig('example').then(function(response) {
                cloudTypes = response.inputModel;
                expect(cloudTypes).toEqual(defaultDayZeroConfig);
            });

            $httpBackend.flush();

        });

        it('getConfig should handle ntp server and dns-setting array-->obj conversion', function() {
            var inputCloud = {
                'ntp-servers': [
                    'ntpServer1',
                    'ntpServer2',
                    'ntpServer3'
                ],
                'dns-settings': {
                    nameservers: [
                        'dns1',
                        'dns2',
                        'dns3'
                    ]
                }
            };
            var outputCloud = {
                'ntp-servers': [
                    {name: 'ntpServer1'},
                    {name: 'ntpServer2'},
                    {name: 'ntpServer3'}
                ],
                'dns-settings': {
                    nameservers: [
                        {name: 'dns1'},
                        {name: 'dns2'},
                        {name: 'dns3'}
                    ]
                }
            };
            var input = {
                inputModel: {
                    'cloud': inputCloud
                }
            };
            var output = _.clone(defaultDayZeroConfig);
            output._defaults = {
               cloud: inputCloud
            };
            output.baremetal = {
                cloud: outputCloud
            };

            $httpBackend.expectGET(apiPath + 'templates' + '/example').respond(input);
            service.getConfig('example').then(function(response) {
                expect(response.inputModel).toEqual(output);
            });
            $httpBackend.flush();

        });

        it('getConfig should return rejected promise when model contains errors', function() {

            $httpBackend.expectGET(apiPath + 'templates' + '/example').respond({
                errors: [
                    'i am an error'
                ]
            });
            service.getConfig('example').then(function(response) {
                fail('Not expecting an successful promise');
            });

            $httpBackend.flush();

        });

        it('getConfig should return config with store of non-day zero required properties stored for later ' +
            're-integration', function() {
            var input = {
                inputModel: {
                    rand1: 'val1', rand2: 'val2'
                }
            };
            var output = _.clone(defaultDayZeroConfig);
            output._defaults = {
                rand1: 'val1',
                rand2: 'val2'
            };

            $httpBackend.expectGET(apiPath + 'templates' + '/example').respond(input);
            service.getConfig('example').then(function(response) {
                expect(response.inputModel).toEqual(output);
            });
            $httpBackend.flush();

        });

        it('getExpandedModel should return the model', function() {
            var input = {
                "name": "entry-scale-esx-kvm-vsa"
            };

            $httpBackend.expectGET(apiPath + 'model/expanded').respond(input);
            service.getExpandedModel().then(function(response) {
                expect(response).toEqual(input);
            });

            $httpBackend.flush();

        });

        it('getExpandedModel should return rejected promise when model contains errors', function() {
            var cloudTypes;

            $httpBackend.expectGET(apiPath + 'model/expanded').respond({
                errors: [
                    'i am an error'
                ]
            });
            service.getExpandedModel('example').then(function(response) {
                fail('Not expecting an successful promise');
            });

            $httpBackend.flush();

        });

        it('getPersistedConfig should return the model', function() {
            var input = {
                inputModel: {

                }
            };

            $httpBackend.expectGET(apiPath + 'model').respond(input);
            service.getPersistedConfig().then(function(response) {
                expect(response).toEqual({
                    inputModel: defaultDayZeroConfig
                });
            });

            $httpBackend.flush();

        });

        it('getPersistedConfig should return rejected promise when model contains errors', function() {
            $httpBackend.expectGET(apiPath + 'model').respond({
                errors: [
                    'i am an error'
                ]
            });
            service.getPersistedConfig('example').then(function() {
                fail('Not expecting an successful promise');
            });

            $httpBackend.flush();

        });

        it('getPersistedConfig is not called if the server contains the same config/model', function() {
            var model = {
                inputModel: {
                    "interface-models": [
                        {
                            "name": "CONTROLLER-INTERFACES"
                        }
                    ]
                }
            };
            // Some junk values that test the hashing function
            var junkValues = {
                isNull: null,
                isTime: new Date(),
                isFunction: function() { }
            };

            // The service will provide this to the client
            var input1 = _.clone(model);
            input1.inputModel['server-groups'] = junkValues;

            // We'll then try to persist this client side config
            var input2 = {
                inputModel: _.clone(defaultDayZeroConfig)
            };
            input2.inputModel['interface-models'] = model.inputModel['interface-models'];
            input2.inputModel['server-groups'] = junkValues;

            // Get a model, such that it's cached and hashed
            $httpBackend.expectGET(apiPath + 'model').respond(input1);
            service.getPersistedConfig('example').catch(function() {
                fail('Not expecting a failed promise');
            });
            $httpBackend.flush();

            // Now try to persist the same model, which should have the same hash.
            service.persistConfig({
                fileInfo: 'fileInfo',
                version: 2,
                name: 'test',
                data: input2.inputModel
            });

            // We need to flush to understand if a persist request has been made, if it has not then the test has passed
            expect($httpBackend.flush).toThrowError('No pending request to flush !');
        });

        it('persistConfig should accept objects', function() {
            var cloudDef = {
                'network-groups': {name: 'test'}
            };

            $httpBackend
                .when('POST', apiPath + 'model', function(body) {
                    var jsonBody = JSON.parse(body);
                    expect(jsonBody.inputModel['network-groups']).toBeDefined();
                    return true;
                })
                .respond('success');

            service.persistConfig({data: cloudDef, fileInfo: {}, name: 'name', version: 'version'});

            $httpBackend.flush();
        });

        it('persistConfig should not accept incorrect input (no supporting properties)', function() {

            service.persistConfig({data: {}});

            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('persistConfig should not accept incorrect input (no data)', function() {

            service.persistConfig({fileInfo: {}, name: 'name', version: 'version'});

            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('persistConfig should accept arrays', function() {
            var cloudDef = {
                'interface-models': ['test']
            };

            $httpBackend
                .when('POST', apiPath + 'model', function(body) {
                    var jsonBody = JSON.parse(body);
                    expect(jsonBody.inputModel['interface-models']).toBeDefined();
                    return true;
                })
                .respond('success');

            service.persistConfig({data: cloudDef, fileInfo: {}, name: 'name', version: 'version'});

            $httpBackend.flush();
        });

        it('persistConfig should remove all fields that start with _', function() {
            var cloudDef = {
                'interface-models': [
                    {name: 'model 1', _selected: true},
                    {name: 'model 2', _disabled: true}
                ]
            };

            $httpBackend
                .when('POST', apiPath + 'model', function(body) {
                    var jsonBody = JSON.parse(body);
                    var interfaceModels = jsonBody.inputModel['interface-models'];
                    expect(interfaceModels).toBeDefined();
                    expect(interfaceModels).toEqual([{name: 'model 1'}, {name: 'model 2'}]);
                    return true;
                })
                .respond('success');

            service.persistConfig({data: cloudDef, fileInfo: {}, name: 'name', version: 'version'});

            $httpBackend.flush();
        });

        it('persistConfig should process servers correctly', function() {
            var cloudDef = {
                'servers': [
                    {id: 'one'},
                    {id: 'two'}
                ]
            };

            $httpBackend
                .when('POST', apiPath + 'model', function(body) {
                    var jsonBody = JSON.parse(body);
                    expect(jsonBody.inputModel).toEqual({servers: [{id: 'one'}, {id: 'two'}]});
                    return true;
                })
                .respond('success');

            service.persistConfig({data: cloudDef, fileInfo: {}, name: 'name', version: 'version'});

            $httpBackend.flush();
        });

        it('persistConfig should process baremetal.cloud correctly', function() {
            var outputCloud = {
                baremetal: { },
                cloud: {
                    'ntp-servers': [
                        'ntpServer1',
                        'ntpServer2',
                        'ntpServer3'
                    ],
                    'dns-settings': {
                        nameservers: [
                            'dns1',
                            'dns2',
                            'dns3'
                        ]
                    }
                }
            };
            var cloudDef = {
                baremetal: {
                    user_password: '1234',
                    cloud: {
                        'ntp-servers': [
                            {name: 'ntpServer1'},
                            {name: 'ntpServer2'},
                            {name: 'ntpServer3'}
                        ],
                        'dns-settings': {
                            nameservers: [
                                {name: 'dns1'},
                                {name: 'dns2'},
                                {name: 'dns3'}
                            ]
                        }
                    }
                }
            };

            $httpBackend
                .when('POST', apiPath + 'model', function(body) {
                    var jsonBody = JSON.parse(body);
                    expect(jsonBody.inputModel).toEqual(outputCloud);
                    return true;
                })
                .respond('success');

            service.persistConfig({data: cloudDef, fileInfo: {}, name: 'name', version: 'version'});

            $httpBackend.flush();

        });

        it('persistConfig should process disk models correctly', function() {
            var cloudDef = {
                'disk-models': [
                    {name: 'model_1', 'device-groups': ['dg1']},
                    {name: 'model_2', 'volume-groups': ['device-group1']},
                    {name: 'model_3', 'device-groups': ['device-group2']}
                ]
            };

            $httpBackend
                .when('POST', apiPath + 'model', function(body) {
                    var jsonBody = JSON.parse(body);
                    expect(jsonBody.inputModel).toEqual(cloudDef);
                    return true;
                })
                .respond('success');

            service.persistConfig({data: cloudDef, fileInfo: {}, name: 'name', version: 'version'});

            $httpBackend.flush();
        });

        it('persistConfig should process network groups and networks correctly', function() {
            var cloudDef = {
                'network-groups': {
                    group1: {
                        name: 'group1',
                        networks: [
                            {name: 'network1'},
                            {name: 'network2'}
                        ]
                    },
                    group2: {
                        name: 'group2',
                        networks: [
                            {name: 'network3'},
                            {name: 'network4'}
                        ]
                    }
                }
            };

            $httpBackend
                .when('POST', apiPath + 'model', function(body) {
                    var jsonBody = JSON.parse(body);

                    var networking = {
                        'network-groups': [
                            {name: 'group1'},
                            {name: 'group2'}
                        ],
                        'networks': [
                            {name: 'network1', 'network-group': 'group1'},
                            {name: 'network2', 'network-group': 'group1'},
                            {name: 'network3', 'network-group': 'group2'},
                            {name: 'network4', 'network-group': 'group2'}
                        ]
                    };
                    expect(jsonBody.inputModel).toEqual(networking);

                    return true;
                })
                .respond('success');

            service.persistConfig({data: cloudDef, fileInfo: {}, name: 'name', version: 'version'});

            $httpBackend.flush();
        });


        it('persistConfig should process _defaults correctly', function() {
            var input = {
                _defaults: {
                    rand1: 'val1',
                    rand2: 'val2'
                }
            };
            var output = {
                rand1: 'val1',
                rand2: 'val2'
            };

            $httpBackend
                .when('POST', apiPath + 'model', function(body) {
                    var jsonBody = JSON.parse(body);
                    expect(jsonBody.inputModel).toEqual(output);
                    return true;
                })
                .respond('success');

            service.persistConfig({data: input, fileInfo: {}, name: 'name', version: 'version'});

            $httpBackend.flush();
        });


    });

})();
