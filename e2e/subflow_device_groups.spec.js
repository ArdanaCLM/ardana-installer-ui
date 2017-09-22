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

var installer = require('./po');
var thisSection = installer.sections['Server role associations'];
var cloudNeeds = installer.sections['Cloud needs'];

describe('Section: Server role associations', function() {
    var table;

    describe('Cloud needs: select option 1', function() {
        beforeEach(function() {
            installer.load();             // go to Get started
            installer.next();             // go to Cloud needs
            cloudNeeds.getOption('entry-scale-esx').click();
            cloudNeeds.getOption('entry-scale-kvm-vsa').click();
            installer.next();                // go to Install OS
            installer.sections['Install OS'].getOptions().get(1).click();
            installer.next();             // go to Identify servers
            installer.next();             // go to configure networks
            installer.next();             // got to Server role associations

            table = thisSection.getServerRoleTable();
        });

        describe('Add device group', function() {
            var deviceEditable;

            beforeEach(function() {
                thisSection.getAddDiskModelButton().click();
                browser.driver.sleep(1000);
                thisSection.getAddButton(thisSection.getDeviceGroupEditable()).click();
                deviceEditable = thisSection.getDeviceEditable();
            });

            it('should display modal entitled "Add device group"', function() {
                expect(installer.getModalTitleText()).toBe('Add device group');
            });

            it('should list 4 input fields', function() {
                expect(installer.getModalLgFormFields().count()).toBe(4);
            });

            it('should have 2 required text fields: device group name and consumer', function() {
                var nameField = installer.getModalLgFormFields().get(0);
                expect(installer.getAttribute(nameField, 'required')).toBe('true');
                expect(installer.getFieldType(nameField)).toBe('text');

                var consumerField = installer.getModalLgFormFields().get(1);
                expect(installer.getAttribute(consumerField, 'required')).toBe('true');
                expect(installer.getFieldType(consumerField)).toBe('text');

                var consumerUsageField = installer.getModalLgFormFields().get(2);
                expect(installer.getFieldType(consumerUsageField)).toBe('text');

                var consumerAttrField = installer.getModalLgFormFields().get(3);
                expect(installer.getAttribute(consumerAttrField, 'yamlize')).toBeDefined();
                expect(installer.getFieldType(consumerAttrField)).toBe('text');
            });

            it('should display placeholder with "Add device" button', function() {
                expect(thisSection.getPlaceHolder(deviceEditable).getText()).toBe('Devices');
                expect(thisSection.getPlaceHolder(deviceEditable).isPresent()).toBe(true);

                expect(thisSection.getAddButton(deviceEditable).getText()).toBe('ADD DEVICE');
                expect(thisSection.getAddButton(deviceEditable).isPresent()).toBe(true);
            });

            it('should add device group to table if saved', function() {
                installer.getModalLgFormFields().get(0).sendKeys('NEW_DEVICE_GROUP');
                installer.getModalLgFormFields().get(1).sendKeys('NEW_CONSUMER');
                installer.getModalLgFormFields().get(2).sendKeys('NEW_CONSUMER_USAGE');

                thisSection.getAddButton(deviceEditable).click();
                installer.getFormFields('newDeviceForm').get(0).sendKeys('NEW_DEVICE');

                var newDeviceForm = installer.getForm('newDeviceForm');
                newDeviceForm.element(by.css('button[ng-click="deviceGroupsModalCtrl.saveNewDevice()"]')).click();

                installer.getModal().element(by.css('button[ng-click="deviceGroupsModalCtrl.save()"]')).click();

                expect(installer.getTableRowCount(thisSection.getModalDeviceGroupTable())).toBe(1);
            });

            it('should not add device group to table if cancelled', function() {
                installer.getModalLgFormFields().get(0).sendKeys('NEW_DEVICE_GROUP');
                installer.getModalLgFormFields().get(1).sendKeys('NEW_CONSUMER');
                installer.getModalLgFormFields().get(2).sendKeys('NEW_CONSUMER_USAGE');

                thisSection.getAddButton(deviceEditable).click();
                installer.getFormFields('newDeviceForm').get(0).sendKeys('NEW_DEVICE');

                var newDeviceForm = installer.getForm('newDeviceForm');
                newDeviceForm.element(by.css('button[ng-click="deviceGroupsModalCtrl.saveNewDevice()"]')).click();

                installer.getModal().element(by.css('button[ng-click="deviceGroupsModalCtrl.cancel()"]')).click();

                expect(thisSection.getModalDeviceGroupTable().isPresent()).toBe(false);
            });

            describe('Add device', function() {
                var newDeviceForm, deviceField;

                beforeEach(function() {
                    browser.driver.sleep(1000);
                    thisSection.getAddButton(deviceEditable).click();

                    newDeviceForm = installer.getForm('newDeviceForm');
                    deviceField = installer.getFormFields('newDeviceForm').get(0);
                });

                it('should display add device form', function() {
                    expect(newDeviceForm).toBeDefined();
                    expect(installer.getAttribute(deviceField, 'required')).toBe('true');
                    expect(installer.getFieldType(deviceField)).toBe('text');
                });

                it('should enable "Save" when new device field filled', function() {
                    var saveBtn = newDeviceForm.element(by.css('button[ng-click="deviceGroupsModalCtrl.saveNewDevice()"]'));
                    expect(saveBtn.isEnabled()).toBe(false);
                    deviceField.sendKeys('NEW_DEVICE');
                    expect(saveBtn.isEnabled()).toBe(true);
                });

                it('should add device to table on save', function() {
                    deviceField.sendKeys('NEW/DEVICE');
                    newDeviceForm.element(by.css('button[ng-click="deviceGroupsModalCtrl.saveNewDevice()"]')).click();
                    expect(installer.getTableRowCount(thisSection.getDeviceTable())).toBe(2);
                    expect(thisSection.getPlaceHolder(deviceEditable).isPresent()).toBe(false);
                });

                it('should not add device to table on cancel', function() {
                    deviceField.sendKeys('NEW/DEVICE');
                    newDeviceForm.element(by.css('button[ng-click="deviceGroupsModalCtrl.cancelAdd()"]')).click();
                    expect(thisSection.getDeviceTable().isPresent()).toBe(false);
                    expect(thisSection.getPlaceHolder(deviceEditable).isPresent()).toBe(true);
                });
            });
        });

        describe('Edit disk model', function() {
            var deviceGroupTable;

            beforeEach(function() {
                installer.getTableDropdownToggleButtonAt(table, 0, 3).click();
                installer.getTableDropdownMenuListAt(table, 0, 3).get(0).click();
                browser.driver.sleep(1000);

                deviceGroupTable = thisSection.getModalDeviceGroupTable();
                installer.getTableDropdownToggleButtonAtRow(deviceGroupTable, 0).click();
            });

            describe('Edit device group', function() {
                beforeEach(function() {
                    installer.getTableEditButtonAtRow(deviceGroupTable, 0).click();
                    browser.driver.sleep(1000);
                });

                it('should display modal entitled "Edit device group"', function() {
                    expect(installer.getModalTitleText()).toBe('Edit device group');
                });

                it('should list 4 input fields', function() {
                    expect(installer.getFormFields('newDeviceGroupForm').count()).toBe(4);
                    expect(installer.getTableRowCount(thisSection.getDeviceTable())).toBe(4);
                });

                it('should have 2 required text fields: device group name and consumer', function() {
                    var formFields = installer.getFormFields('newDeviceGroupForm');

                    var nameField = formFields.get(0);
                    expect(installer.getAttribute(nameField, 'required')).toBe('true');
                    expect(installer.getFieldType(nameField)).toBe('text');

                    var consumerField = formFields.get(1);
                    expect(installer.getAttribute(consumerField, 'required')).toBe('true');
                    expect(installer.getFieldType(consumerField)).toBe('text');

                    var consumerUsageField = formFields.get(2);
                    expect(installer.getFieldType(consumerUsageField)).toBe('text');

                    var consumerAttrField = formFields.get(3);
                    expect(installer.getAttribute(consumerAttrField, 'yamlize')).toBeDefined();
                    expect(installer.getFieldType(consumerAttrField)).toBe('textarea');
                });

                describe('Edit device', function() {
                    var deviceTable, editDeviceForm, deviceField;

                    beforeEach(function() {
                        deviceTable = thisSection.getDeviceTable();
                        installer.getTableDropdownToggleButtonAtRow(deviceTable, 0).click();
                        installer.getTableEditButtonAtRow(deviceTable, 0).click();
                        browser.driver.sleep(1000);

                        editDeviceForm = thisSection.getDeviceForm(0);
                        deviceField = editDeviceForm.element(by.css('input'));
                    });

                    it('should display edit device form', function() {
                        expect(editDeviceForm.isPresent()).toBe(true);
                        expect(installer.getAttribute(deviceField, 'required')).toBe('true');
                        expect(installer.getFieldType(deviceField)).toBe('text');
                    });

                    it('should enable "Save" when edit device field filled', function() {
                        var saveBtn = editDeviceForm.element(by.css('button[ng-click="ddCtrl.save(row)"]'));
                        expect(saveBtn.isEnabled()).toBe(true);
                        deviceField.sendKeys('NEW_DEVICE');
                        expect(saveBtn.isEnabled()).toBe(true);
                    });

                    it('should disable "Save" when edit device field empty', function() {
                        deviceField.clear();
                        var saveBtn = editDeviceForm.element(by.css('button[ng-click="ddCtrl.save(row)"]'));
                        expect(saveBtn.isEnabled()).toBe(false);
                    });

                    it('should update device in table on save', function() {
                        deviceField.clear();
                        deviceField.sendKeys('NEW/DEVICE');
                        editDeviceForm.element(by.css('button[ng-click="ddCtrl.save(row)"]')).click();
                        expect(installer.getTableCellAt(deviceTable, 0, 0).getText()).toBe('NEW/DEVICE');
                    });

                    it('should not update device in table on cancel', function() {
                        deviceField.clear();
                        deviceField.sendKeys('NEW/DEVICE');
                        editDeviceForm.element(by.css('button[ng-click="ddCtrl.cancel(row)"]')).click();
                        expect(installer.getTableCellAt(deviceTable, 0, 0).getText()).toBe('/dev/sdb');
                    });
                });

                describe('Delete device', function() {
                    var deviceTable, editDeviceForm, deviceField;

                    beforeEach(function() {
                        deviceTable = thisSection.getDeviceTable();
                        installer.getTableDropdownToggleButtonAtRow(deviceTable, 0).click();
                    });

                    it('should remove device from table on confirm', function() {
                        expect(installer.getTableRowCount(deviceTable)).toBe(4);

                        installer.getTableDeleteButtonAtRow(deviceTable, 0).click();
                        browser.driver.sleep(1000);
                        installer.getConfirmModalRemoveButton().click();
                        expect(installer.getTableRowCount(deviceTable)).toBe(2);
                    });

                    it('should remove device from table on confirm', function() {
                        expect(installer.getTableRowCount(deviceTable)).toBe(4);

                        installer.getTableDeleteButtonAtRow(deviceTable, 0).click();
                        browser.driver.sleep(1000);
                        installer.getConfirmModalCancelButton().click();
                        expect(installer.getTableRowCount(deviceTable)).toBe(4);
                    });
                });
            });

            describe('Delete device group', function() {
                var deviceGroupEditable;

                beforeEach(function() {
                    deviceGroupEditable = thisSection.getDeviceGroupEditable();
                    installer.getTableDeleteButtonAtRow(deviceGroupTable, 0).click();
                    browser.driver.sleep(1000);
                });

                it('should remove device group after confirm', function() {
                    installer.getConfirmModalRemoveButton().click();
                    expect(installer.getTableRowCount(deviceGroupTable)).toBe(0);

                    expect(thisSection.getPlaceHolder(deviceGroupEditable).getText()).toBe('Device groups');
                    expect(thisSection.getPlaceHolder(deviceGroupEditable).isPresent()).toBe(true);
                });

                it('should keep device group after cancel', function() {
                    installer.getConfirmModalCancelButton().click();
                    expect(installer.getTableRowCount(deviceGroupTable)).toBe(1);
                });
            });
        });
    });

});
