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
    var forEach = angular.forEach;

    angular
        .module('dayzero.installer')
        .controller('InstallerController', InstallerController);

    InstallerController.$inject = [
        '$scope',
        '$window',
        '$q',
        'app.basePath',
        'app.persistIntervalMs',
        'app.demoMode',
        'config',
        'ardanaDeployer',
        'ardanaInstallationData',
        'ConfirmModalService',
        'AnsibleService'
    ];

    function InstallerController($scope, $window, $q, path, persistIntervalMs, demoModeEnabled, config,
                                 ardanaDeployer, ardanaInstallationData, ConfirmModalService, AnsibleService) {
        var ctrl = this;
        ctrl.sections = [];
        ctrl.sectionIdList = [];
        ctrl.configSections = [];
        ctrl.configuringOs = false;
        ctrl.deploying = false;
        ctrl.installingOs = false;
        ctrl.installOsCompleted = false;
        ctrl.prevDisabled = true;

        ctrl.demoModeEnabled = demoModeEnabled;

        ctrl.logViewer = {
            autoScroll: true,
            fullLog: true,
            recapStarted: false
        };

        ctrl.helpText = {
            get_started_list: _.range(11)
        };

        ctrl.steps = [
            'cloud_needs',
            'install_os',
            'identify_servers',
            'network_grps',
            'server_assocs'
        ];
        var currentSection = 0;
        var ardana_sections = ['get_started'].concat(ctrl.steps).concat(['ready', 'errors']);
        var sectionIntros = {
            network_grps: 'network_grps.intro',
            ready: 'ready.intro'
        };

        ardana_sections.forEach(function(value) {
            var html_path = path + 'installer/' + value + '/section_' + value + '.html';
            var help_path = path + 'installer/' + value + '/section_' + value + '.help.html';
            var section = {
                title: value + '.title',
                id: 'section_' + value,
                intro: sectionIntros[value],
                html_path: html_path,
                valid: true
            };

            if (value !== 'ready' && value !== 'errors') {
                section.help_html_path = help_path;
            }

            ctrl.sections.push(section);

            // Keep a list of section ids for help prev/next functionality
            ctrl.sectionIdList.push(section.id);

            if (demoModeEnabled) {
              ardanaInstallationData.options.install_os = false;
            }
        });

        ctrl.maxSection = ctrl.sectionIdList.indexOf('section_errors') - 1;
        ctrl.cloudNeeds = {
            cloudNeedsOptions: [],
            beforeChange: function() {
                return ctrl.cloudNeeds.cloudNeedsConfirmChange ?
                    ConfirmModalService
                        .open({
                            confirmNo: 'installer.btn.cancel',
                            confirmYes: 'installer.btn.yes',
                            message: 'cloud_needs.warning.message',
                            title: 'cloud_needs.warning.title'
                        }, {
                            warnOS: function() {
                                return ctrl.installingOs || ctrl.installOsCompleted;
                            }
                        }) :
                    $q.when();
            },
            cloudNeedsConfirmChange: false,
            isPristineDefault: false
        };

        ctrl.data = {
            install_os: ardanaInstallationData.options.install_os
        };

        ctrl.currentSectionId = ctrl.sectionIdList[currentSection];

        /**
         * Begin deploy by first validating config files with
         * Config Processor, then running ansible playbook
         */
        ctrl.deploy = function() {
            ctrl.maxSection = ctrl.sectionIdList.indexOf('section_server_assocs');
            ctrl.deploying = true;

            var deploySteps = {

                push: function deployPush() {
                    resetLogViewer();
                    return executeDeployStep(config.persistConfig,
                        _.extend(ardanaInstallationData.dataMeta, {data: ardanaInstallationData.data}), 'saveModel',
                        'Failed to Save Model');
                },

                commit: function deployCommit() {
                    resetLogViewer();
                    return executeDeployStep(ardanaDeployer.commitConfig,
                        null, 'commit', 'Failed to Commit Model');
                },

                validate: function deployValidate() {
                    resetLogViewer();
                    return executeDeployStep(AnsibleService.runConfigProcessor, {
                            removeDeletedServers: true
                        },
                        'validate', 'Config Processor failed to start!').then(function(data) {
                        ctrl.logViewer.pRef = data.pRef;
                        return executeDeployStep(AnsibleService.notifyProcessEnd, ctrl.logViewer.pRef,
                            'validate', 'Input Model is Invalid');
                    });
                },

                ready: function deployReady() {
                    resetLogViewer();
                    return executeDeployStep(AnsibleService.readyDeploy, null,
                        'readyDeploy', 'Ready Deployment failed to start!').then(function(data) {
                        ctrl.logViewer.pRef = data.pRef;
                        return executeDeployStep(AnsibleService.notifyProcessEnd, ctrl.logViewer.pRef,
                            'readyDeploy', 'Readying Deployment Failed');
                    });
                },

                deploy: function deployDeploy() {
                    resetLogViewer();
                    return executeDeployStep(AnsibleService.site, {
                                keepDayZero: true,
                                destroyDayZeroOnSuccess: true
                            }, 'deploy', 'Deployment failed to start!')
                        .then(function(data) {
                            ctrl.logViewer.pRef = data.pRef;
                            return executeDeployStep(AnsibleService.notifyProcessEnd, ctrl.logViewer.pRef,
                                'deploy', 'Deployment Failed');
                        }
                    );
                },

                getModel: function deployGetModel(previous) {
                    return config.getExpandedModel().then(function(data) {
                      ctrl.expandedModel = data;    // Store for later
                    });
                }

            };

            // 1) Push modal changes
            deploySteps.push()
                // 2) Commit changes
                .then(deploySteps.commit)
                // 3) Run validation
                .then(deploySteps.validate)
                // 4) Run ready to deploy
                .then(deploySteps.ready)
                // 5) Get the expanded model, so we can find URL endpoint data to show
                .then(deploySteps.getModel)
                // 6) Run deploy
                .then(deploySteps.deploy)
                .then(deployResolved, deployRejected);

        };

        ctrl.goToOpsConsole = function() {
            $window.location.href = ctrl.opsConsoleUrl;
        };

        // Install OS on servers specified by user
        ctrl.installOs = function() {
            ctrl.installingOs = true;
            ctrl.maxSection = ctrl.sectionIdList.indexOf('section_install_os_progress');

            // Always show the install OS progress screen so that errors can be shown in the current way
            if (currentSection !== ctrl.sectionIdList.indexOf('section_install_os_progress')) {
                ctrl.step(1);
            }

            if (ctrl.demoModeEnabled) {
              ctrl.demoModeInstallOS();
              return;
            }

            config.persistConfig(_.extend(ardanaInstallationData.dataMeta, {data: ardanaInstallationData.data}))
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    console.error('Failed to persist model before install OS:', error);
                    return $q.reject(error);
                })
                .then(function() {
                    var bmServers = ardanaInstallationData.data.servers;
                    angular.forEach(bmServers, function(bmServer) {
                        bmServer._status = 'status.ready';
                    });

                    ardanaInstallationData.dataChanged('servers');

                    var bmConfig = {
                        baremetal: ardanaInstallationData.data.baremetal,
                        servers: bmServers
                    };

                    return ardanaDeployer.installOs(bmConfig);
                })
                .then(installOsResolved, installOsRejected, updateServersStatus);
        };

        // Simple OS Installation Simulation
        ctrl.demoModeInstallOS = function() {
          var deferred = $q.defer();
          var bmServers = ardanaInstallationData.data.servers;
          var demoSequence = [];
          angular.forEach(bmServers, function(bmServer) {
              bmServer._status = 'status.ready';
              var sequence = ['complete'];
              var server = demoSequence.length + 1;
              _.times(server, function() {
                sequence.push('installing');
              });
              demoSequence.push({
                id: bmServer.id,
                sequence: sequence
              });
          });
          ardanaInstallationData.dataChanged('servers');

          var demoTickAlong = function() {
            var serverStatuses = {};
            angular.forEach(demoSequence, function(demoServer) {
              if (demoServer.sequence.length) {
                serverStatuses[demoServer.id] = demoServer.sequence.pop();
              }
            });

            var data = {
                serverStatuses: serverStatuses
            };

            if (Object.keys(serverStatuses).length < 2) {
              deferred.resolve(data);
            } else {
              deferred.notify(data);
              $window.setTimeout(demoTickAlong, 5000);
            }
          };

          $window.setTimeout(demoTickAlong, 8000);
          deferred.promise.then(installOsResolved, installOsRejected, updateServersStatus);
        };

        ctrl.resumeDeploy = function() {
            var SITE_PLAYBOOK = 'site.yml';

            ctrl.deployMessage = 'deploy.steps.deploy';
            ctrl.maxSection = ctrl.sectionIdList.indexOf('section_server_assocs');
            ctrl.deploying = true;

            // Find the running deploy
            for (var i = 0; i < AnsibleService.allPlays.length; i++) {
                var aPlay = AnsibleService.allPlays[i];
                if (aPlay.alive && aPlay.commandString && aPlay.commandString.indexOf(SITE_PLAYBOOK) > -1) {
                    ctrl.logViewer.pRef = aPlay.pRef;
                    // Found running deploy
                    AnsibleService.notifyProcessEnd(ctrl.logViewer.pRef).then(function() {
                        deployResolved();
                    }, function(meta) {
                        deployRejected(meta);
                    });
                    break;
                }
            }
        };

        // Show or hide steps if user requires OS installed
        ctrl.showInstallOsSteps = function(installLinux) {
            var installOsConfigs = {};

            angular.forEach(['info', 'progress'], function(postfix) {
                installOsConfigs[postfix] = {
                    title: 'install_os_' + postfix + '.title',
                    id: 'section_install_os_' + postfix,
                    html_path: path + 'installer/install_os/section_install_os_' + postfix + '.html',
                    valid: true
                };
            });

            var progressHelp = path + 'installer/install_os/section_install_os_progress.help.html';
            installOsConfigs.progress.help_html_path = progressHelp;

            installOsConfigs.info.intro = 'install_os_info.intro';

            if (installLinux === true) {
                var serversIdx = ctrl.sectionIdList.indexOf('section_identify_servers');
                addSection(installOsConfigs.info, serversIdx + 1);

                var nicMapIdx = ctrl.sectionIdList.indexOf('section_server_assocs');
                addSection(installOsConfigs.progress, nicMapIdx + 1);
            } else {
                deleteSection(installOsConfigs.info.id);
                deleteSection(installOsConfigs.progress.id);
            }

            if (ctrl.installOsCompleted || installLinux === false) {
                var offset = ctrl.showError ? 0 : 1;
                ctrl.maxSection = ctrl.sectionIdList.indexOf('section_errors') - offset;
            } else if (ctrl.installingOs || ctrl.installOsError) {
                ctrl.maxSection = ctrl.sectionIdList.indexOf('section_install_os_progress');
            }
        };

        // Set UX step to either previous, current or next
        ctrl.step = function(value) {
            currentSection = currentSection + value;
            ctrl.currentSectionId = ctrl.sectionIdList[currentSection];
            // Reset requirement to show confirmation dialog on cloud_needs selection
            ctrl.cloudNeeds.cloudNeedsConfirmChange = !ctrl.cloudNeeds.isPristineDefault;
            // Start/Stop automaticaly persisting model
            if (currentSection <= ctrl.sectionIdList.indexOf('section_cloud_needs')) {
                // On or before the examples page
                ardanaInstallationData.setPersistTimer(0);
            } else {
                // After the examples page
                ardanaInstallationData.setPersistTimer(persistIntervalMs);
            }
            angular.element('.workflow-body-indent').scrollTop(0);
            updateButtons();
            validateStep();
        };

        // Load configuration for selected cloud need
        ctrl.updateCloudConfig = function(newCloudNeed) {
            ctrl.cloudNeeds.isPristineDefault = false;
            ctrl.cloudNeeds.cloudNeedsConfirmChange = false;
            config.getConfig(newCloudNeed)
                .then(function(data) {
                    ardanaInstallationData.setData(data);
                }).catch(function(err) {
                console.error('Failed to fetch cloud configuration: ' + newCloudNeed, err);
            });
        };

        // In demo mode, we always start with a fresh configuration
        var fetchExisting = ctrl.demoModeEnabled ? $q.when() :
        config.getPersistedConfig().catch(function(err) {
            // Do not fail the promise chain if there is an error finding the existing config
            // (it may just be missing)
            console.debug('Failed to determine if existing config exists, this may be a fresh install', err);
        });

        // Start of controller init code
        var initialisationPromises = {
            examples: config.getCloudTypes(),
            existing: fetchExisting,
            deploying: AnsibleService.listAnsibleRuns().then(function() {
                return AnsibleService.siteRunning;
            })
        };

        $q.all(initialisationPromises).then(function(values) {

            // Parse examples into options collection
            if (values.examples) {
                forEach(values.examples, function(cloud) {
                    ctrl.cloudNeeds.cloudNeedsOptions.push({
                        label: cloud.name,
                        value: cloud.name,
                        overview: cloud.overview
                    });
                });
            }

            // If an existing config has been found set it to the current config
            var existing = values.existing;
            if (existing && existing.name) {
                ctrl.data.cloud_needs = existing.name;
                ardanaInstallationData.setData(existing);

                if (values.deploying) {
                    // Return user to the deploying screen and monitor the deployment
                    ctrl.data.install_os = false;
                    ctrl.installOsCompleted = true;
                    currentSection = ctrl.sectionIdList.indexOf('section_server_assocs');
                    ctrl.showInstallOsSteps(false);
                    ctrl.step(0);
                    ctrl.resumeDeploy();
                }
            } else {
                // No existing config, set the current config to the first example
                ctrl.data.cloud_needs = values.examples[0].name;
                ctrl.updateCloudConfig(ctrl.data.cloud_needs);
                ctrl.cloudNeeds.isPristineDefault = true;
            }
        }).catch(function(error) {
            console.error('Failed to determine one of examples, existing configuration or deployer state.', error);
        });

        ctrl.showInstallOsSteps(true);
        validateStep();

        if (ctrl.demoModeEnabled) {
          ctrl.showInstallOsSteps(false);
        }

        $scope.$watch(function() { return ctrl.logViewer.fullLog; }, function(val) {
            ctrl.logViewer.filter = val ? undefined : logFilter;
            ctrl.logViewer.recapStarted = false;
        });

        $scope.$watch(function() {
            return ctrl.data.install_os;
        }, function(newValue, oldValue) {
            ardanaInstallationData.options.install_os = newValue;
            $scope.$broadcast('installOs.update', newValue);
        });

        $scope.$on('step:validation', function(event, stepData) {
            validateStep(stepData);
        });

        $scope.$on('installOs:serversValid', function(event) {
            ctrl.installingOs = false;
            ctrl.installOsError = false;
            var offset = ctrl.showError ? 0 : 1;
            ctrl.maxSection = ctrl.sectionIdList.indexOf('section_errors') - offset;

            updateButtons();
        });

        // Basic LogViewer filter to show a task summary view
        var TASK_MATCHER = new RegExp('(.*(?:TASK:|FATAL:).*\n)+', 'g');
        function logFilter(logData) {
            // Once recap is started don't filter
            if (ctrl.logViewer.recapStarted) {
                return logData;
            }
            // Check if recap has started
            var index = logData.indexOf('PLAY RECAP');
            if (index > -1) {
                ctrl.logViewer.recapStarted = true;
                var beforeRecap = logData.slice(0, index);
                var recap = logData.slice(index);
                var tasks = beforeRecap.match(TASK_MATCHER);
                if (tasks) {
                    tasks = tasks.join('') + '\n';
                } else {
                    tasks = '';
                }
                return tasks + recap;
            }

            // Return lines with TASK: or FATAL:
            var matches = logData.match(TASK_MATCHER);
            if (matches) {
                return matches.join('');
            }

            // Everything else is filtered out
            return '';
        }

        function resetLogViewer() {
            ctrl.logViewer.pRef = undefined;
            ctrl.logViewer.recapStarted = false;
        }

        // Add a step
        function addSection(section, idx) {
            var id = section.id;
            var doesNotExist = ctrl.sectionIdList.indexOf(id) < 0;
            if (doesNotExist) {
                if (angular.isDefined(idx)) {
                    ctrl.sections.splice(idx, 0, section);
                    ctrl.sectionIdList.splice(idx, 0, id);
                } else {
                    ctrl.sections.push(section);
                    ctrl.sectionIdList.push(id);
                    idx = ctrl.sectionIdList.length - 1;
                }

                if (currentSection >= idx) {
                    currentSection++;
                }

                return idx;
            }
        }

        // Remove a step
        function deleteSection(id) {
            var idx = ctrl.sectionIdList.indexOf(id);
            if (idx >= 0) {
                ctrl.sections.splice(idx, 1);
                ctrl.sectionIdList.splice(idx, 1);

                if (currentSection > idx) {
                    currentSection--;
                }
            }
        }

        function executeDeployStep(func, param, step, errorMessage) {
            function handleError(error) {
                ctrl.deploying = false;
                showError(step, errorMessage);
                return $q.reject(error);
            }
            ctrl.deployMessage = 'deploy.steps.' + step;
            return func(param).then(function(response) {
                return response.data || {};
            }).catch(function(error) {
                return handleError(error ? error : {message: 'Unknown'});
            });
        }

        function deployRejected(data) {
            if (ctrl.deploying) {
                ctrl.deploying = false;
                showError('deploy', data.message);
            } else {
                ctrl.errors = data.message;
            }
        }

        function buildURLFromAdvert(data, advertName) {
            if (data && data.advertises && data.advertises[advertName]) {
                var advert = data.advertises[advertName];
                if (advert && advert.public && advert.public.ip_address && advert.public.port &&
                    advert.public.protocol) {
                    var url = advert.public.protocol + '://' + advert.public.ip_address;
                    if ((advert.public.port !== '443' && advert.public.protocol === 'https') ||
                    (advert.public.port !== '80' && advert.public.protocol === 'http')) {
                        url += ':' + advert.public.port;
                    }
                    return url;
                }
            }
        }

        function deployResolved(data) {
            if (!data) {
              data = {};
            }

            ctrl.deploying = false;
            ctrl.horizonUrl = 'http://' + data.opsConsoleVip;
            ctrl.opsConsoleUrl = 'http://' + data.opsConsoleVip + ':9095';
            ctrl.deploySuccessful = true;

            // BRUI-115: See if we can do better for Horizon and Ops Console URLs
            if (ctrl.expandedModel && ctrl.expandedModel.expandedInputModel &&
              ctrl.expandedModel.expandedInputModel.internal &&
              ctrl.expandedModel.expandedInputModel.internal['control-planes']) {
              var planes = ctrl.expandedModel.expandedInputModel.internal['control-planes'];
              if (Object.keys(planes).length === 1) {
                var plane = planes[Object.keys(planes)[0]];
                ctrl.horizonUrl = buildURLFromAdvert(plane, 'horizon') || ctrl.horizonUrl;
                ctrl.opsConsoleUrl = buildURLFromAdvert(plane, 'ops-console-web') || ctrl.opsConsoleUrl;
              }
            }
        }

        function installOsRejected(data) {
            updateServersStatus(data);

            ctrl.installingOs = false;
            ctrl.installOsError = true;
        }

        function installOsResolved(data) {
            updateServersStatus(data);

            ctrl.installingOs = false;
            ctrl.installOsCompleted = true;
            ctrl.installOsError = false;
            var offset = ctrl.showError ? 0 : 1;
            ctrl.maxSection = ctrl.sectionIdList.indexOf('section_errors') - offset;

            updateButtons();
            $scope.$broadcast('installOs:completed');
        }

        function showError(title) {

            var errorSectionIdx = ctrl.sectionIdList.indexOf('section_errors');
            var sectionTitle = 'errors.title.' + title;
            var sectionSubTitle = 'errors.subtitle.' + title;

            ctrl.maxSection = errorSectionIdx;
            ctrl.showError = true;
            ctrl.sections[errorSectionIdx].title = sectionTitle;
            ctrl.sections[errorSectionIdx].subtitle = sectionSubTitle;

            // TODO: better way of managing resetting this flag!
            ctrl.logViewer.recapStarted = false;

            if (ctrl.currentSectionId !== 'section_errors') {
                currentSection = errorSectionIdx;
                ctrl.step(0);
            }
        }

        function updateButtons() {
            var offset = ctrl.showError ? 1 : 2;
            var deployDisabled = currentSection < (ctrl.sections.length - offset);
            if (ctrl.demoModeEnabled) {
              deployDisabled = true;
            }

            ctrl.nextDisabled = currentSection >= ctrl.maxSection;
            ctrl.prevDisabled = currentSection === 0;
            ctrl.configuringOs = !(ctrl.installingOs || ctrl.installOsCompleted) &&
                ctrl.currentSectionId === 'section_identify_servers' &&
                ctrl.data.install_os;
            ctrl.deployable = !deployDisabled && !ctrl.configuringOs;
        }

        function updateServersStatus(data) {
            var bmServers = ardanaInstallationData.data.servers;
            var serverStatuses = data.serverStatuses || {};
            angular.forEach(bmServers, function(bmServer) {
                var bmServerStatus = serverStatuses[bmServer.id];
                if (angular.isDefined(bmServerStatus)) {
                    bmServer._status = 'status.' + bmServerStatus;
                }
            });
        }

        function validateStep(stepData) {
            if (angular.isDefined(stepData)) {
                var idx = ctrl.sectionIdList.indexOf('section_' + stepData.id);
                ctrl.sections[idx].valid = stepData.valid;
            }

            $scope.$broadcast('revalidate:' + ctrl.currentSectionId);
            ctrl.validStep = ctrl.sections[currentSection].valid;
        }
    }

})();
