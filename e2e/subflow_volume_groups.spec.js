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

describe('Section: Server role associations - subflow', function() {
    var table, volumeGroupEditable;

    describe('Cloud needs: select option 1', function() {
        beforeEach(function() {
            installer.load();             // go to Get started
            installer.next();             // go to Cloud needs
            installer.next();             // go to Install OS
            installer.sections['Install OS'].getOptions().get(1).click(); // Select option 2
            installer.next();             // go to Identify servers
            installer.next();             // go to Assign network groups
            installer.next();             // go to Configure disks and NICS

            table = thisSection.getServerRoleTable();
        });

        describe('Add volume group', function() {
            var fields;
            var physicalVolumeEditable;
            var logicalVolumeEditable;

            beforeEach(function() {
                thisSection.getAddDiskModelButton().click();
                browser.driver.sleep(1000);
                thisSection.getAddButton(thisSection.getVolumeGroupEditable()).click();
                volumeGroupEditable = thisSection.getVolumeGroupEditable();
                fields = installer.getModalLgFormFields();
                physicalVolumeEditable = thisSection.getPhysicalVolumeEditable();
                logicalVolumeEditable = thisSection.getLogicalVolumeEditable();
            });

            it('should display modal entitled "Add volume group"', function() {
                expect(installer.getModalTitleText()).toBe('Add volume group');
            });

            it('should list 7 input fields', function() {
                expect(fields.count()).toBe(7);
            });

            it('should have 7 input fields, but only show 1 field', function() {
                expect(fields.get(0).isDisplayed()).toBeTruthy();
                expect(fields.get(1).isDisplayed()).not.toBeTruthy();
                expect(fields.get(2).isDisplayed()).not.toBeTruthy();
                expect(fields.get(3).isDisplayed()).not.toBeTruthy();
                expect(fields.get(4).isDisplayed()).not.toBeTruthy();
                expect(fields.get(5).isDisplayed()).not.toBeTruthy();
                expect(fields.get(6).isDisplayed()).not.toBeTruthy();
            });

            it('volume group name: text, required', function() {
                var nameField = fields.get(0);
                expect(installer.getAttribute(nameField, 'required')).toBe('true');
                expect(installer.getFieldType(nameField)).toBe('text');
            });

            it('should display placeholder "Physical volumes" with "Add physical volume', function() {
                expect(thisSection.getPlaceHolder(physicalVolumeEditable).getInnerHtml()).toBe('Physical Volumes');
                expect(thisSection.getPlaceHolder(physicalVolumeEditable).isPresent()).toBe(true);
                expect(thisSection.getAddButton(physicalVolumeEditable).getInnerHtml()).toContain('Add physical volume');
                expect(thisSection.getAddButton(physicalVolumeEditable).isPresent()).toBe(true);
            });

            it('should display placeholder "Logical volumes" with "Add logical volume', function() {
                expect(thisSection.getPlaceHolder(logicalVolumeEditable).getInnerHtml()).toBe('Logical Volumes');
                expect(thisSection.getPlaceHolder(logicalVolumeEditable).isPresent()).toBe(true);
                expect(thisSection.getAddButton(logicalVolumeEditable).getInnerHtml()).toContain('Add logical volume');
                expect(thisSection.getAddButton(logicalVolumeEditable).isPresent()).toBe(true);
            });

            describe('Add physical volume', function() {
                var newPhysicalVolumeForm, volumeField, saveBtn;

                beforeEach(function() {
                    browser.driver.sleep(1000);
                    thisSection.getAddButton(physicalVolumeEditable).click();

                    newPhysicalVolumeForm = installer.getForm('addPhysicalVolumeForm');
                    volumeField = installer.getFormFields('addPhysicalVolumeForm').get(0);
                    saveBtn = newPhysicalVolumeForm.element(by.css('button[ng-click="volumeGroupsModalCtrl.saveNewPhysicalVolume()"]'));
                });

                it('should display add physical volume form', function() {
                    expect(newPhysicalVolumeForm).toBeDefined();
                    expect(installer.getAttribute(volumeField, 'required')).toBe('true');
                    expect(installer.getFieldType(volumeField)).toBe('text');
                });

                it('should not add physical volume to table on cancel', function() {
                    volumeField.sendKeys('NEW_PHYSICAL_VOLUME');
                    newPhysicalVolumeForm.element(by.css('button[ng-click="volumeGroupsModalCtrl.cancelAddPhysicalVolume()"]')).click();
                    expect(thisSection.getPhysicalVolumeTable().isPresent()).toBe(false);
                    expect(thisSection.getPlaceHolder(physicalVolumeEditable).isPresent()).toBe(true);
                    expect(physicalVolumeEditable.element(by.css('.editable-placeholder [ng-if="!isSet"]')).isPresent()).toBeTruthy();
                });

                it('should enable "Save" when new physical volume field filled', function() {
                    thisSection.getAddButton(physicalVolumeEditable).click();
                    expect(saveBtn.isEnabled()).toBe(false);
                    volumeField.sendKeys('NEW_PHYSICAL_VOLUME');
                    expect(saveBtn.isEnabled()).toBe(true);
                    expect(physicalVolumeEditable.element(by.css('.editable-placeholder [ng-if="!isSet"]')).isPresent()).toBeTruthy();
                });

                it('should add physical volume to table on save', function() {
                    thisSection.getAddButton(physicalVolumeEditable).click();
                    volumeField.sendKeys('NEW_PHYSICAL_VOLUME');
                    saveBtn.click();
                    expect(installer.getTableRowCount(thisSection.getPhysicalVolumeTable())).toBe(2);
                    expect(thisSection.getPlaceHolder(physicalVolumeEditable).isPresent()).toBe(false);
                    expect(physicalVolumeEditable.element(by.css('.editable-placeholder [ng-if="!isSet"]')).isPresent()).not.toBeTruthy();
                });
            });

            describe('Add logical volume', function() {
                var newLogicalVolumeForm, volumeFields, saveBtn;

                beforeEach(function() {
                    thisSection.getAddButton(logicalVolumeEditable).click();
                    newLogicalVolumeForm = installer.getForm('newLogicalVolumeForm');
                    volumeFields = installer.getFormFields('newLogicalVolumeForm');
                    saveBtn = newLogicalVolumeForm.element(by.css('button[ng-click="volumeGroupsModalCtrl.saveNewLogicalVolume()"]'));
                });

                it('should display add logical volume form', function() {
                    expect(newLogicalVolumeForm).toBeDefined();

                    // name
                    expect(installer.getAttribute(volumeFields.get(0), 'required')).toBe('true');
                    expect(installer.getFieldType(volumeFields.get(0))).toBe('text');

                    // size
                    expect(installer.getAttribute(volumeFields.get(1), 'required')).toBe('true');
                    expect(installer.getFieldType(volumeFields.get(1))).toBe('text');

                    // mount - this is optional
                    expect(installer.getFieldType(volumeFields.get(2))).toBe('text');

                    // File System type
                    expect(installer.getFieldType(volumeFields.get(3))).toBe('text');

                    // MKFS
                    expect(installer.getFieldType(volumeFields.get(4))).toBe('text');
                });

                it('should not add logical volume to table on cancel', function() {
                    volumeFields.get(0).sendKeys('NEW_LOGICAL_VOLUME');
                    volumeFields.get(1).sendKeys('20%');
                    volumeFields.get(2).sendKeys('/var/lib/rabbitmq');
                    volumeFields.get(3).sendKeys('ext4');
                    newLogicalVolumeForm.element(by.css('button[ng-click="volumeGroupsModalCtrl.cancelAddLogicalVolume()"]')).click();
                    expect(thisSection.getLogicalVolumeTable().isPresent()).toBe(false);
                    expect(thisSection.getPlaceHolder(logicalVolumeEditable).isPresent()).toBe(true);
                    expect(logicalVolumeEditable.element(by.css('.editable-placeholder [ng-if="!isSet"]')).isPresent()).toBeTruthy();
                });

                it('should enable "Save" when new logical volume field filled', function() {
                    thisSection.getAddButton(logicalVolumeEditable).click();
                    expect(saveBtn.isPresent()).toBeTruthy();
                    expect(saveBtn.isEnabled()).toBe(false);
                    volumeFields.get(0).sendKeys('NEW_LOGICAL_VOLUME');
                    volumeFields.get(1).sendKeys('20%');
                    volumeFields.get(2).sendKeys('/var/lib/rabbitmq');
                    volumeFields.get(3).sendKeys('ext4');
                    expect(saveBtn.isEnabled()).toBe(true);
                    expect(logicalVolumeEditable.element(by.css('.editable-placeholder [ng-if="!isSet"]')).isPresent()).toBeTruthy();
                });

                it('should add logical volume to table on save', function() {
                    thisSection.getAddButton(logicalVolumeEditable).click();
                    volumeFields.get(0).sendKeys('NEW_LOGICAL_VOLUME');
                    volumeFields.get(1).sendKeys('20%');
                    volumeFields.get(2).sendKeys('/var/lib/rabbitmq');
                    volumeFields.get(3).sendKeys('ext4');
                    saveBtn.click();
                    expect(installer.getTableRowCount(thisSection.getLogicalVolumeTable())).toBe(2);
                    expect(thisSection.getPlaceHolder(logicalVolumeEditable).isPresent()).toBe(false);
                    expect(logicalVolumeEditable.element(by.css('.editable-placeholder [ng-if="!isSet"]')).isPresent()).not.toBeTruthy();
                });
            });
        });

        describe('Edit volume model', function() {
            var volumeGroupTable;

            beforeEach(function() {
                installer.getTableDropdownToggleButtonAt(table, 0, 3).click();
                installer.getTableDropdownMenuListAt(table, 0, 3).get(0).click();
                browser.driver.sleep(1000);

                volumeGroupTable = thisSection.getModalVolumeGroupTable();
                installer.getTableDropdownToggleButtonAtRow(volumeGroupTable, 0).click();
            });

            describe('Edit volume group', function() {
                beforeEach(function() {
                    installer.getTableEditButtonAtRow(volumeGroupTable, 0).click();
                    browser.driver.sleep(1000);
                });

                it('should display modal entitled "Edit volume group"', function() {
                    expect(installer.getModalTitleText()).toBe('Edit volume group');
                });

                it('should list 1 input fields in newVolumeGroupForm', function() {
                    expect(installer.getFormFields('newVolumeGroupForm').count()).toBe(1);
                    expect(installer.getTableRowCount(thisSection.getPhysicalVolumeTable())).toBe(1 * 2);
                    expect(installer.getTableRowCount(thisSection.getLogicalVolumeTable())).toBe(9 * 2);
                });

                it('should have 1 required text fields: volume group name', function() {
                    var formFields = installer.getFormFields('newVolumeGroupForm');
                    var nameField = formFields.get(0);
                    expect(installer.getAttribute(nameField, 'required')).toBe('true');
                    expect(installer.getFieldType(nameField)).toBe('text');
                });

                describe('Edit physical volume', function() {
                    var physicalVolumeTable, editForm, editField;

                    beforeEach(function() {
                        physicalVolumeTable = thisSection.getPhysicalVolumeTable();
                        installer.getTableDropdownToggleButtonAtRow(physicalVolumeTable, 0).click();
                        installer.getTableEditButtonAtRow(physicalVolumeTable, 0).click();
                        browser.driver.sleep(1000);

                        editForm = thisSection.getPhysicalVolumeForm(0);
                        editField = editForm.element(by.css('input'));
                    });

                    it('should display edit physical volume form', function() {
                        expect(editForm.isPresent()).toBe(true);
                        expect(installer.getAttribute(editField, 'required')).toBe('true');
                        expect(installer.getFieldType(editField)).toBe('text');
                    });

                    it('should enable "Save" when edit physical volume field filled', function() {
                        var saveBtn = editForm.element(by.css('button[ng-click="pvdCtrl.save(row)"]'));
                        expect(saveBtn.isEnabled()).toBe(true);
                        editField.sendKeys('NEW_PHYSICAL_VOLUME');
                        expect(saveBtn.isEnabled()).toBe(true);
                    });

                    it('should disable "Save" when edit physical volume field empty', function() {
                        editField.clear();
                        var saveBtn = editForm.element(by.css('button[ng-click="pvdCtrl.save(row)"]'));
                        expect(saveBtn.isEnabled()).toBe(false);
                    });

                    it('should update physical volume in table on save', function() {
                        editField.clear();
                        editField.sendKeys('NEW/PHYSICAL_VOLUME');
                        editForm.element(by.css('button[ng-click="pvdCtrl.save(row)"]')).click();
                        expect(installer.getTableCellAt(physicalVolumeTable, 0, 0).getText()).toBe('NEW/PHYSICAL_VOLUME');
                    });

                    it('should not update physical volume in table on cancel', function() {
                        editField.clear();
                        editField.sendKeys('NEW/PHYSICAL_VOLUME');
                        editForm.element(by.css('button[ng-click="pvdCtrl.cancel(row)"]')).click();
                        expect(installer.getTableCellAt(physicalVolumeTable, 0, 0).getText()).toBe('/dev/sda_root');
                    });
                });

                describe('Edit logical volume', function() {
                    var logicalVolumeTable, editForm, editFields;

                    beforeEach(function() {
                        logicalVolumeTable = thisSection.getLogicalVolumeTable();
                        installer.getTableDropdownToggleButtonAtRow(logicalVolumeTable, 0).click();
                        installer.getTableEditButtonAtRow(logicalVolumeTable, 0).click();
                        browser.driver.sleep(1000);

                        editForm = thisSection.getLogicalVolumeForm(0);
                        editFields = editForm.all(by.css('input'));
                    });

                    it('should display edit logical volume form', function() {
                        expect(editForm.isPresent()).toBe(true);

                        // name
                        expect(installer.getAttribute(editFields.get(0), 'required')).toBe('true');
                        expect(installer.getFieldType(editFields.get(0))).toBe('text');

                        // size
                        expect(installer.getAttribute(editFields.get(1), 'required')).toBe('true');
                        expect(installer.getFieldType(editFields.get(1))).toBe('text');

                        // mount
                        expect(installer.getFieldType(editFields.get(2))).toBe('text');

                        // file system type
                        expect(installer.getFieldType(editFields.get(3))).toBe('text');

                        // MKFS
                        expect(installer.getFieldType(editFields.get(4))).toBe('text');
                    });

                    it('should enable "Save" when edit logical volume field filled', function() {
                        var saveBtn = editForm.element(by.css('button[ng-click="lvdCtrl.save(row)"]'));
                        expect(saveBtn.isEnabled()).toBe(true);
                        editFields.get(0).sendKeys('NEW_LOGICAL_VOLUME');
                        expect(saveBtn.isEnabled()).toBe(true);
                    });

                    it('should disable "Save" when edit logical volume field empty', function() {
                        editFields.get(0).clear();
                        var saveBtn = editForm.element(by.css('button[ng-click="lvdCtrl.save(row)"]'));
                        expect(saveBtn.isEnabled()).toBe(false);
                    });

                    it('should update logical volume in table on save', function() {
                        editFields.get(0).clear();
                        editFields.get(0).sendKeys('NEW/LOGICAL_VOLUME');
                        editForm.element(by.css('button[ng-click="lvdCtrl.save(row)"]')).click();
                        expect(installer.getTableCellAt(logicalVolumeTable, 0, 0).getText()).toBe('NEW/LOGICAL_VOLUME');
                    });

                    it('should not update physical volume in table on cancel', function() {
                        editFields.get(0).clear();
                        editFields.get(0).sendKeys('NEW/LOGICAL_VOLUME');
                        editForm.element(by.css('button[ng-click="lvdCtrl.cancel(row)"]')).click();
                        expect(installer.getTableCellAt(logicalVolumeTable, 0, 0).getText()).toBe('root');
                    });
                });

                describe('Delete physical volume', function() {
                    var physicalVolumeTable;

                    beforeEach(function() {
                        browser.driver.sleep(500);
                        physicalVolumeTable = thisSection.getPhysicalVolumeTable();
                        installer.getTableDropdownToggleButtonAtRow(physicalVolumeTable, 0).click();
                        browser.driver.sleep(1000);
                    });

                    it('should remove physical volume from table on confirm', function() {
                        expect(installer.getTableRowCount(physicalVolumeTable)).toBe(2);

                        installer.getTableDeleteButtonAtRow(physicalVolumeTable, 0).click();
                        browser.driver.sleep(1000);
                        installer.getConfirmModalRemoveButton().click();
                        expect(installer.getTableRowCount(physicalVolumeTable)).toBe(0);
                    });

                    it('should not remove physical volume from table on cancel', function() {
                        expect(installer.getTableRowCount(physicalVolumeTable)).toBe(2);

                        installer.getTableDeleteButtonAtRow(physicalVolumeTable, 0).click();
                        browser.driver.sleep(1000);
                        installer.getConfirmModalCancelButton().click();
                        expect(installer.getTableRowCount(physicalVolumeTable)).toBe(2);
                    });
                });

                describe('Delete logical volume', function() {
                    var logicalVolumeTable;

                    beforeEach(function() {
                        browser.driver.sleep(500);
                        logicalVolumeTable = thisSection.getLogicalVolumeTable();
                        installer.getTableDropdownToggleButtonAtRow(logicalVolumeTable, 0).click();
                        browser.driver.sleep(1000);
                    });

                    it('should remove logical volume from table on confirm', function() {
                        expect(installer.getTableRowCount(logicalVolumeTable)).toBe(18);

                        installer.getTableDeleteButtonAtRow(logicalVolumeTable, 0).click();
                        browser.driver.sleep(1000);
                        installer.getConfirmModalRemoveButton().click();
                        expect(installer.getTableRowCount(logicalVolumeTable)).toBe(16);
                    });

                    it('should not remove logical volume from table on cancel', function() {
                        expect(installer.getTableRowCount(logicalVolumeTable)).toBe(18);

                        installer.getTableDeleteButtonAtRow(logicalVolumeTable, 0).click();
                        browser.driver.sleep(1000);
                        installer.getConfirmModalCancelButton().click();
                        expect(installer.getTableRowCount(logicalVolumeTable)).toBe(18);
                    });
                });
            });
        });
    });
});
