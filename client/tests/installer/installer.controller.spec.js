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

    describe('InstallerController', function() {
        var $scope, $interval, $timeout, $window,
            config, $q, $controller;

        var AnsibleServiceMock = {
            listAnsibleRuns: function() {
                return $q.when({});
            },
            runConfigProcessor: function() {
                return $q.when({});
            },
            notifyProcessEnd: function() {
                return $q.when({});
            },
            readyDeploy: function() {
                return $q.when({});
            },
            site: function() {
                return $q.when({});
            }
        };

        beforeEach(module('dayzero.installer'));

        beforeEach(inject(function($injector, _$q_) {
            $scope = $injector.get('$rootScope').$new();
            $interval = $injector.get('$interval');
            $timeout = $injector.get('$timeout');
            $window = $injector.get('$window');
            $q = _$q_;

            $controller = $injector.get('$controller');
        }));

        it('should be defined', function() {
            var ctrl = createController();
            expect(ctrl).toBeDefined();
        });

        describe('deploy', function() {
            it('should show validation error', function() {

                var ctrl = createController({
                    AnsibleService: _.assign({}, AnsibleServiceMock, {
                        runConfigProcessor: function() {
                            return $q.reject({});
                        }
                    })
                });
                $scope.$apply();

                ctrl.deploy();

                $scope.$apply();
                $scope.$apply();

                expect(ctrl.deploying).toBeFalsy();
                expect(ctrl.showError).toBeTruthy();
            });

            it('should show deployment error', function() {

                var deployDeferred = $q.defer();
                var ctrl = createController({
                    AnsibleService: _.assign({}, AnsibleServiceMock, {
                        site: function() {
                            return $q.when({data: {pRef: 101}});
                        },
                        notifyProcessEnd: function(pRef) {
                            return pRef === 101 ? deployDeferred.promise : $q.when({});
                        }
                    })
                });

                $scope.$apply();

                ctrl.deploy();

                $scope.$apply();

                expect(ctrl.logViewer.pRef).toBeTruthy();
                expect(ctrl.deploying).toBeTruthy();

                deployDeferred.reject({});
                $scope.$apply();

                expect(ctrl.deploying).toBeFalsy();
                expect(ctrl.showError).toBeTruthy();
            });

            it('should deploy', function() {

                var deployDeferred = $q.defer();
                var ctrl = createController({
                    AnsibleService: _.assign({}, AnsibleServiceMock, {
                        site: function() {
                            return $q.when({data: {pRef: 101}});
                        },
                        notifyProcessEnd: function() {
                            return deployDeferred.promise;
                        }
                    })
                });
                $scope.$apply();

                ctrl.deploy();

                $scope.$apply();
                expect(ctrl.deploying).toBeTruthy();

                deployDeferred.resolve({});
                $scope.$apply();

                expect(ctrl.deploying).toBeFalsy();
                expect(ctrl.deploySuccessful).toBeTruthy();
            });

        });

        describe('install OS', function() {

            it('should show error', function() {

                var deferred = $q.defer();
                var ctrl = createController({
                    ardanaInstallationData: {
                        data: {
                            servers: [],
                            baremetalConfig: {}
                        },
                        options: {
                            install_os: true
                        },
                        dataChanged: angular.noop,
                        setPersistTimer: function() {
                        }
                    },
                    ardanaDeployer: {
                        installOs: function() {
                            return deferred.promise;
                        }
                    }
                });
                ctrl.installOs();
                expect(ctrl.installingOs).toBeTruthy();

                deferred.reject({serverStatuses: []});
                $scope.$apply();
                expect(ctrl.installingOs).toBeFalsy();
                expect(ctrl.installOsError).toBeTruthy();
            });

            it('should install OS', function() {
                var deferred = $q.defer();
                var ardanaInstallationData = {
                    data: {
                        servers: [{id: 'server'}]
                    },
                    options: {
                        install_os: true
                    },
                    dataChanged: angular.noop,
                    setPersistTimer: function() {
                    }
                };

                var ctrl = createController({
                    ardanaInstallationData: ardanaInstallationData,
                    ardanaDeployer: {
                        installOs: function() {
                            return deferred.promise;
                        }
                    }
                });
                ctrl.installOs();
                expect(ctrl.installingOs).toBeTruthy();

                deferred.resolve({serverStatuses: {server: 'installed'}});
                $scope.$apply();

                expect(ctrl.installingOs).toBeFalsy();

                expect(ardanaInstallationData.data.servers[0]._status).toBe('status.installed');

            });

            it('should delete installation sections when not installing OS', function() {
                var ctrl = createController();
                ctrl.showInstallOsSteps(false);
                expect(ctrl.sections).not.toContain(jasmine.objectContaining({id: 'section_install_os_info'}));
                expect(ctrl.sections).not.toContain(jasmine.objectContaining({id: 'section_install_os_progress'}));
            });

            it('should keep installation sections when installing OS', function() {
                var ctrl = createController();
                ctrl.showInstallOsSteps(true);
                expect(ctrl.sections).toContain(jasmine.objectContaining({id: 'section_install_os_info'}));
                expect(ctrl.sections).toContain(jasmine.objectContaining({id: 'section_install_os_progress'}));
            });

        });

        function createController(optionalArgs) {

            var deferred = $q.defer();
            deferred.resolve({
                data: [{
                    'name': 'ardana-entry-scale',
                    'overview': 'ardana-entry-scale'
                }]
            });

            var ardanaDeployer = {
                commitConfig: function() {
                    return $q.when({data: {}});
                }
            };

            config = {
                getCloudTypes: function() {
                    return deferred.promise;
                },
                getConfig: function() {
                    return $q.defer().promise;
                },
                getPersistedConfig: function() {
                    return $q.defer().promise;
                },
                persistConfig: function() {
                    return $q.when({data: {}});
                },
                getExpandedModel: function() {
                    return $q.when({data: {}});
                }
            };

            var merged = _.assign({
                'app.basePath': '',
                'app.demoMode': false,
                'app.persistIntervalMs': 20000,
                '$scope': $scope,
                '$element': angular.element('<div></div>'),
                '$interval': $interval,
                '$timeout': $timeout,
                '$window': $window,
                config: config,
                ardanaDeployer: ardanaDeployer,
                ardanaInstallationData: {
                    data: {},
                    options: {
                        install_os: true
                    },
                    setPersistTimer: function() {
                    }
                },
                ConfirmModalService: {},
                AnsibleService: AnsibleServiceMock
            }, optionalArgs);

            return $controller('InstallerController', merged);
        }
    });

})();
