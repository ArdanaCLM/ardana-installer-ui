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
    var table, addDiskModelButton, addInterfaceModelButton;

    describe('Cloud needs: select option 1', function() {
        beforeEach(function() {
            installer.load();                // go to Get started
            installer.next();                // go to Cloud needs
            cloudNeeds.getOption('entry-scale-esx').click();
            cloudNeeds.getOption('entry-scale-kvm-vsa').click();
            installer.next();                // go to Install OS
            installer.sections['Install OS'].getOptions().get(1).click();
            installer.next();                // go to Identify servers
            installer.next()                 // go to Configure networks
            installer.next();                // got toServer role associations

            table = thisSection.getServerRoleTable();

        });

        it('should display table listing roles of selected cloud in step 2', function() {
            expect(installer.getTableCellAt(table, 0, 0).getText()).toEqual('CONTROLLER-ROLE');
            expect(installer.getTableCellAt(table, 1, 0).getText()).toEqual('COMPUTE-ROLE');
            expect(installer.getTableCellAt(table, 2, 0).getText()).toEqual('VSA-ROLE');
        });

    });

    describe('Cloud needs: select option 2', function() {
        beforeEach(function() {
            installer.load();             // go to Get started
            installer.next();             // go to Cloud needs
            cloudNeeds.getOption('entry-scale-kvm-vsa').click();
            cloudNeeds.getOption('entry-scale-esx').click();
            installer.next();             // go to Install OS
            installer.sections['Install OS'].getOptions().get(1).click();
            installer.next();             // go to Identify servers
            installer.next();                // got toServer role associations
            installer.next();             // got toServer role associations

            table = thisSection.getServerRoleTable();
            addDiskModelButton = thisSection.getAddDiskModelButton();
            addInterfaceModelButton = thisSection.getAddInterfaceModelButton();
        });

        it('should display table listing roles of selected cloud in step 2', function() {
            expect(installer.getTableCellAt(table, 0, 0).getText()).toEqual('CONTROLLER-ROLE');
            expect(installer.getTableCellAt(table, 1, 0).getText()).toEqual('ESX-COMPUTE-ROLE');
            expect(installer.getTableCellAt(table, 2, 0).getText()).toEqual('OVSVAPP-ROLE');
        });

        it('should display a select field for "Disk model" and "Interface model" columns', function() {
            expect(installer.getTableHeadAt(table, 1).getText()).toEqual('DISK MODEL');
            expect(installer.getTableHeadAt(table, 2).getText()).toEqual('INTERFACE MODEL');
        });

        it('should allow user to add disk model and add interface model', function() {
            expect(addDiskModelButton.getText()).toBe('ADD DISK MODEL');
            expect(addInterfaceModelButton.getText()).toBe('ADD INTERFACE MODEL');
            expect(addDiskModelButton.isEnabled()).toBe(true);
            expect(addInterfaceModelButton.isEnabled()).toBe(true);
        });

        it('should allow user to edit disk model and edit interface model of each role', function() {
            installer.getTableActionDropdownButtonAtRow(table, 0).click();
            var actionList = installer.getTableActionListAtRow(table, 0);
            var editDiskModelButton = actionList.get(0);
            var editInterfaceModelButton = actionList.get(1);

            expect(editDiskModelButton.getText()).toBe('Edit disk model');
            expect(editInterfaceModelButton.getText()).toBe('Edit interface model');
            expect(editDiskModelButton.isEnabled()).toBe(true);
            expect(editInterfaceModelButton.isEnabled()).toBe(true);
        });

        describe('Add disk model', function() {
            beforeEach(function() {
                addDiskModelButton.click();
                browser.driver.sleep(1000);
            });

            it('should display drawer for entering disk model information if "Add disk model" clicked', function() {
                installer.drawerShouldActive();
            });

            it('should list 1 input fields', function() {
                expect(installer.getModalFormFields().count()).toBe(1);
            });

            it('Disk model name: text, required', function() {
                var field = installer.getModalFormFields().get(0);
                expect(installer.getAttribute(field, 'required')).toBe('true');
                expect(installer.getFieldType(field)).toBe('text');
            });

            it('should display placeholder with "Add device group" button', function() {
                var deviceGroupEditable = thisSection.getDeviceGroupEditable();

                expect(thisSection.getPlaceHolder(deviceGroupEditable).getInnerHtml()).toBe('Device groups');
                expect(thisSection.getPlaceHolder(deviceGroupEditable).isPresent()).toBe(true);

                expect(thisSection.getAddButton(deviceGroupEditable).getInnerHtml()).toContain('Add device group');
                expect(thisSection.getAddButton(deviceGroupEditable).isPresent()).toBe(true);
            });

            it('should display placeholder with "Add volume group" button', function() {
                var volumeGroupEditable = thisSection.getVolumeGroupEditable();

                expect(thisSection.getPlaceHolder(volumeGroupEditable).getInnerHtml()).toBe('Volume groups');
                expect(thisSection.getPlaceHolder(volumeGroupEditable).isPresent()).toBe(true);

                expect(thisSection.getAddButton(volumeGroupEditable).getInnerHtml()).toContain('Add volume group');
                expect(thisSection.getAddButton(volumeGroupEditable).isPresent()).toBe(true);
            });

            it('should have "Save disk model" button disabled', function() {
                expect(installer.getModalCommitButton().isEnabled()).not.toBe(true);
            });

            it('should add a disk model to select field after clicking on "Save disk model"', function() {
                browser.driver.sleep(1000);
                expect(installer.getTableDropdownMenuListAt(table, 0, 1).count()).toBe(3);

                var diskModelNameField = installer.getModalFormFields().get(0);
                diskModelNameField.sendKeys('DISK_SET_SOMETHING');
                installer.getModalCommitButton().click();

                expect(installer.getTableDropdownMenuListAt(table, 0, 1).count()).toBe(4);
            });

        });

        describe('Edit disk model', function() {
            beforeEach(function() {
                installer.getTableActionDropdownButtonAtRow(table, 0).click();
                var actionList = installer.getTableActionListAtRow(table, 0);
                var editDiskModelButton = actionList.get(0);
                editDiskModelButton.click();
            });

            it('should display drawer for entering disk model information if "Edit disk model" clicked', function() {
                installer.drawerShouldActive();
            });

            it('should populate disk model name field', function() {
                var deviceGroupTable = thisSection.getModalDeviceGroupTable();
                var volumeGroupTable = thisSection.getModalVolumeGroupTable();

                expect(installer.getModalFormFields().get(0).getAttribute('value')).toBe('CONTROLLER-DISKS');
                expect(installer.getTableRowCount(deviceGroupTable)).toBe(1);
                expect(installer.getTableRowCount(volumeGroupTable)).toBe(1);
            });

            it('should have "Save disk model" button enabled', function() {
                var saveButton = installer.getModalCommitButton();
                expect(saveButton.isEnabled()).toBe(true);
            });

            it('should allow user to add device or volume group', function() {
                var deviceGroupTable = thisSection.getModalDeviceGroupTables();
                var volumeGroupTable = thisSection.getModalVolumeGroupTables();
                installer.shouldAllowActionsOnTable(deviceGroupTable);
                installer.shouldAllowActionsOnTable(volumeGroupTable);
            });

            it('should not display placeholder with "Add device group" button', function() {
                var deviceGroupEditable = thisSection.getDeviceGroupEditable();
                expect(thisSection.getPlaceHolder(deviceGroupEditable).isPresent()).not.toBe(true);
                expect(thisSection.getAddButton(deviceGroupEditable).isPresent()).not.toBe(true);
            });

            it('should not display placeholder with "Add volume group" button', function() {
                var volumeGroupEditable = thisSection.getVolumeGroupEditable();
                expect(thisSection.getPlaceHolder(volumeGroupEditable).isPresent()).not.toBe(true);
                expect(thisSection.getAddButton(volumeGroupEditable).isPresent()).not.toBe(true);
            });

            it('should update disk model to select field after clicking on "Save disk model"', function() {
                expect(installer.getTableDropdownMenuListAt(table, 0, 1).count()).toBe(3);
                expect(installer.getTableDropdownToggleButtonAt(table, 0, 1).getText()).toBe('CONTROLLER-DISKS');

                var diskModelNameField = installer.getModalFormFields().get(0);
                diskModelNameField.sendKeys('_NEW');
                browser.driver.sleep(1000);
                installer.getModalCommitButton().click();

                expect(installer.getTableDropdownMenuListAt(table, 0, 1).count()).toBe(3);
                expect(installer.getTableDropdownToggleButtonAt(table, 0, 1).getText()).toBe('CONTROLLER-DISKS_NEW');
            });

        });

        describe('Add interface model', function() {
            beforeEach(function() {
                addInterfaceModelButton.click();
            });

            it('should display drawer for entering interface model information if "Add interface model" clicked', function() {
                installer.drawerShouldActive();
            });

            it('should list 1 input fields', function() {
                expect(installer.getModalFormFields().count()).toBe(1);
            });

            it('Interface model name: text, required', function() {
                var field = installer.getModalFormFields().get(0);
                expect(installer.getAttribute(field, 'name')).toBe('interface_model_name');
                expect(installer.getAttribute(field, 'required')).toBe('true');
                expect(installer.getFieldType(field)).toBe('text');
            });

            it('should display placeholder with "Add interfaces and networks" button', function() {
                var interfaceAndNetworkEditable = thisSection.getInterfaceAndNetworkEditable();
                expect(thisSection.getPlaceHolder(interfaceAndNetworkEditable).getInnerHtml()).toBe('Interfaces and networks');
                expect(thisSection.getPlaceHolder(interfaceAndNetworkEditable).isPresent()).toBe(true);

                expect(thisSection.getAddButton(interfaceAndNetworkEditable).getInnerHtml()).toContain('Add interfaces and networks');
                expect(thisSection.getAddButton(interfaceAndNetworkEditable).isPresent()).toBe(true);
            });

            it('should add a interface model to select field after clicking on "Save interface model"', function() {
                expect(installer.getTableDropdownMenuListAt(table, 0, 2).count()).toBe(3);

                var interfaceModelNameField = installer.getModalFormFields().get(0);
                interfaceModelNameField.sendKeys('INTERFACE_SET_SOMETHING');
                browser.driver.sleep(1000);
                installer.getModalCommitButton().click();

                expect(installer.getTableDropdownMenuListAt(table, 0, 2).count()).toBe(4);
            });

        });

        describe('Edit interface model', function() {
            beforeEach(function() {
                installer.getTableActionDropdownButtonAtRow(table, 0).click();
                var actionList = installer.getTableActionListAtRow(table, 0);
                var editInterfaceModelButton = actionList.get(1);
                editInterfaceModelButton.click();
            });

            it('should display drawer for entering interface model information if "Edit interface model" clicked', function() {
                installer.drawerShouldActive();
            });

            it('should populate interface model name field', function() {
                var interfacesAndNetworksTable = thisSection.getModalInterfacesAndNetworksTable();

                expect(installer.getModalFormFields().get(0).getAttribute('value')).toBe('CONTROLLER-INTERFACES');
                expect(installer.getTableRowCount(interfacesAndNetworksTable)).toBe(1);
            });

            it('should have "Save interface model" button enabled', function() {
                var saveButton = installer.getModalCommitButton();
                expect(saveButton.getInnerHtml()).toContain('Save interface model');
                expect(saveButton.isEnabled()).toBe(true);
            });

            it('should allow user to add interfaces and networks', function() {
                var interfacesAndNetworksTable = thisSection.getModalInterfacesAndNetworksTables();
                installer.shouldAllowActionsOnTable(interfacesAndNetworksTable);
            });

            it('should not display placeholder with "Add interfaces and networks" button', function() {
                var interfacesAndNetworksTable = thisSection.getModalInterfacesAndNetworksTable();
                expect(thisSection.getPlaceHolder(interfacesAndNetworksTable).isPresent()).not.toBe(true);
                expect(thisSection.getAddButton(interfacesAndNetworksTable).isPresent()).not.toBe(true);
            });

            it('should update interface model to select field after clicking on "Save interface model"', function() {
                expect(installer.getTableDropdownMenuListAt(table, 0, 2).count()).toBe(3);
                expect(installer.getTableDropdownToggleButtonAt(table, 0, 2).getText()).toBe('CONTROLLER-INTERFACES');

                var interfaceModelNameField = installer.getModalFormFields().get(0);
                interfaceModelNameField.sendKeys('_NEW');

                browser.driver.sleep(1000);
                installer.getModalCommitButton().click();

                expect(installer.getTableDropdownMenuListAt(table, 0, 2).count()).toBe(3);
                expect(installer.getTableDropdownToggleButtonAt(table, 0, 2).getText()).toBe('CONTROLLER-INTERFACES_NEW');
            });

        });

    });

});
