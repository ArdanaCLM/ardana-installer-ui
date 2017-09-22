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

    describe('DeviceGroupsModalController', function() {
        var $controller;

        beforeEach(module('dayzero.installer'));
        beforeEach(inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        describe('with empty deviceGroup', function() {
            var $scope, deviceGroup, modalInstance, controller;

            beforeEach(inject(function() {
                modalInstance = {
                    close: jasmine.createSpy(),
                    dismiss: jasmine.createSpy()
                };

                $scope = {
                    newDeviceForm: {$setPristine: jasmine.createSpy()},
                    $watch: angular.noop
                };
                deviceGroup = {};

                controller = $controller('DeviceGroupsModalController', {
                    'app.basePath': '',
                    $scope: $scope,
                    $modalInstance: modalInstance,
                    title: '',
                    deviceGroup: deviceGroup
                });
            }));

            it('should initialize deviceGroup.consumer if undefined', function() {
                expect(deviceGroup.consumer).toEqual({});
            });

            it('should save device groups', function() {
                var newGroupName = 'new group name';
                var newConsumerName = 'new consumer name';
                var newDevices = ['/dev/1', 'dev/2'];

                controller.groupName = newGroupName;
                controller.consumerName = newConsumerName;
                controller.devices = newDevices;
                controller.save();

                expect(modalInstance.close).toHaveBeenCalledWith({
                    name: newGroupName,
                    consumer: {
                        name: newConsumerName
                    },
                    devices: newDevices
                });
            });

            it('should dismiss modal on cancel', function() {
                controller.cancel();

                expect(modalInstance.dismiss).toHaveBeenCalled();
            });

            it('should save new device and set form to pristine', function() {
                controller.devices = [];
                controller.newDeviceName = '/dev/1';
                controller.saveNewDevice();

                expect(controller.devices).toEqual([{name: '/dev/1'}]);
                expect($scope.newDeviceForm.$setPristine).toHaveBeenCalled();
            });

            it('should save device group and close modal', function() {
                controller.groupName = 'new group';
                controller.consumerName = 'new consumer';
                controller.devices = ['dev1', 'dev2'];
                controller.save();

                expect(deviceGroup.name).toBe('new group');
                expect(deviceGroup.consumer.name).toBe('new consumer');
                expect(deviceGroup.devices).toEqual(['dev1', 'dev2']);
                expect(deviceGroup.consumer.attrs).toBeUndefined();
                expect(modalInstance.close).toHaveBeenCalled();
            });

            it('should save device group with consumer attributes and close modal', function() {
                controller.consumerAttributes = 'new attributes';
                controller.save();

                expect(deviceGroup.consumer.attrs).toBe('new attributes');
            });

            it('should set _name and _expanded to true when editDevice called', function() {
                var data = {name: 'test'};
                controller.editDevice(data);

                expect(data._name).toBe('test');
                expect(data._expanded).toBe(true);
            });

            it('should set isAddingDevice to true when addDevice called', function() {
                controller.addDevice();

                expect(controller.isAddingDevice).toBe(true);
            });

            it('should reset the form on cancel add', function() {
                controller.devices = [];
                controller.newDeviceName = '/dev/1';
                controller.cancelAdd();

                expect(controller.devices).toEqual([]);
                expect(controller.newDeviceName).toEqual('');
                expect($scope.newDeviceForm.$setPristine).toHaveBeenCalled();
            });
        });

        describe('with non-empty deviceGroup', function() {
            it('should not initalize deviceGroup.consumer if defined', function() {
                var modalInstance = {
                    close: jasmine.createSpy(),
                    dismiss: jasmine.createSpy()
                };

                var $scope = {
                    newDeviceForm: {$setPristine: jasmine.createSpy()},
                    $watch: angular.noop
                };
                var deviceGroup = {consumer: 'consumer'};

                var controller = $controller('DeviceGroupsModalController', {
                    'app.basePath': '',
                    $scope: $scope,
                    $modalInstance: modalInstance,
                    title: '',
                    deviceGroup: deviceGroup
                });

                expect(deviceGroup.consumer).not.toEqual({});
            });
        });
    })
})();
