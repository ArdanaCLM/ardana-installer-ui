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
var thisSection = installer.sections['Assign network groups'];
var cloudNeeds = installer.sections['Cloud needs'];
var NumericField = require('./po/controls/numericField');

describe('Section: Assign network groups', function() {

    describe('Cloud needs: option 1; Install OS: option 2', function() {
        beforeEach(function() {
            installer.load(); // Get started
            installer.next(); // Cloud needs
            cloudNeeds.getOption('entry-scale-kvm-vsa').click();
            cloudNeeds.getOption('entry-scale-esx').click();
            installer.next(); // Install OS
            installer.sections['Install OS'].getOptions().get(1).click();
            installer.next(); // Identify servers
            installer.next(); // Assign network groups servers
        });

        it('should display table listing network groups and networks of selected cloud in step 2', function() {
            expect(thisSection.getNetworkGroupTables().count()).toBe(6);
        });
    });

    describe('Edit Network Group Tags', function() {
        beforeEach(function() {
            installer.load(); // Get started
            installer.next(); // Cloud needs
            cloudNeeds.getOption('entry-scale-kvm-vsa').click();
            cloudNeeds.getOption('entry-scale-esx').click();
            installer.next(); // Install OS
            installer.sections['Install OS'].getOptions().get(1).click();
            installer.next(); // Identify servers
            installer.next(); // Assign network groups servers
        });

        it('should allow tags to be edited', function() {
            var tagsButtons = element.all(by.buttonText('Edit network group tags'));
            tagsButtons.get(0).click();
            browser.driver.sleep(250);

            var grpName = installer.getFormFieldByName('ngrp_name', 'input', installer.getModalDrawer());
            var grpTags = installer.getFormFieldByName('ngrp_tags', 'textarea', installer.getModalDrawer());

            expect(grpName.getAttribute('value')).toBe('CONF');
            grpTags.clear();
            grpTags.sendKeys('TEST NETWORK TAGS');

            installer.getModalDrawer().element(by.buttonText('Save')).click();
            browser.driver.sleep(500);

        });
    });

    describe('Cloud needs: option 2; Install OS: option 2', function() {

        beforeEach(function() {
            installer.load(); // Get started
            installer.next(); // Cloud needs
            cloudNeeds.getOption('entry-scale-esx').click();
            cloudNeeds.getOption('entry-scale-kvm-vsa').click();
            installer.next(); // Install OS
            installer.sections['Install OS'].getOptions().get(1).click();
            installer.next(); // Identify servers
            installer.next(); // Assign network groups servers
        });

        it('should display table listing network groups and networks of selected cloud in step 2', function() {
            expect(thisSection.getNetworkGroupTables().count()).toBe(4);
        });

        it('should allow user to add network to a network group using "Add network" button', function() {
            expect(thisSection.getAddButton(0).isEnabled()).toBe(true);
            thisSection.getAddButton(0).click();
            expect(installer.getModalDrawer().getAttribute('class')).toContain('active');
        });

        it('should allow user to edit or remove network', function() {
            thisSection.getNetworkGroupTables().each(function(table, index) {
                thisSection.getDropdownToggleButton(index).click();
                expect(thisSection.getEditButton(index).isEnabled()).toBe(true);
                expect(thisSection.getDeleteButton(index).isEnabled()).toBe(true);
            });
        });

        it('should display drawer for entering network information if "Add network" clicked', function() {
            thisSection.getAddButton(0).click();
            expect(installer.getModalDrawer().getAttribute('class')).toContain('active');
        });

        it('should display drawer for entering network information if "Edit network" clicked', function() {
            thisSection.getDropdownToggleButton(0).click();
            thisSection.getEditButton(0).click();
            expect(installer.getModalDrawer().getAttribute('class')).toContain('active');
        });

        it('should remove network from network group table if "Delete network" clicked', function() {
            expect(thisSection.getTableRowCount(0)).toBe(1);

            thisSection.getDropdownToggleButton(0).click();
            thisSection.getDeleteButton(0).click();
            installer.getConfirmModalRemoveButton().click();
            expect(thisSection.getTableRowCount(0)).toBe(0);
        });

        describe('Add network', function() {
            var table = thisSection.getNetworkGroupTables().get(0);

            it('should be entitled "Add network to [NETWORK_GROUP]"', function() {
                installer.getTableTitleText(table).then(function(text) {
                    installer.getTableAddButton(table).click();
                    browser.driver.sleep(1000);
                    expect(installer.getModalDrawerTitleText()).toEqual('Add network to ' + text);

                    // it('should list 7 input fields')
                    var formFields = installer.getModalFormFields();
                    expect(formFields.count()).toBe(7);
                    expect(formFields.get(0).getAttribute('type')).toBe('text');
                    expect(formFields.get(1).getAttribute('type')).toBe('number');
                    expect(formFields.get(2).getAttribute('type')).toBe('text');
                    expect(formFields.get(3).getAttribute('type')).toBe('text');
                    expect(formFields.get(4).getAttribute('type')).toBe('text');
                    expect(formFields.get(5).getAttribute('type')).toBe('text');
                    expect(formFields.get(6).getAttribute('type')).toBe('checkbox');

                    expect(formFields.get(0).getAttribute('required')).toBe('true');
                    expect(formFields.get(2).getAttribute('ardana-valid-ip-range')).toBe('');
                    expect(formFields.get(3).getAttribute('ardana-valid-ip-address')).toBe('');

                    expect(formFields.get(0).getAttribute('value')).toBe('');
                    expect(formFields.get(1).getAttribute('value')).toBe('');
                    expect(formFields.get(2).getAttribute('value')).toBe('');
                    expect(formFields.get(3).getAttribute('value')).toBe('');
                    expect(formFields.get(4).getAttribute('value')).toBe('');
                    expect(formFields.get(5).getAttribute('value')).toBe('');
                    expect(formFields.get(6).getAttribute('checked')).toBe(null);

                    expect(installer.getModalCommitButton().isEnabled()).not.toBe(true);
                    formFields.get(0).sendKeys('NET_EXTERNAL_API_1');
                    formFields.get(1).sendKeys('102');
                    formFields.get(2).sendKeys('10.1.1.0/24');
                    formFields.get(3).sendKeys('10.1.1.1');
                    expect(installer.getModalCommitButton().isEnabled()).toBe(true);

                    expect(installer.getTableRowCount(table)).toBe(1);

                    browser.driver.sleep(5000);
                    installer.getModalCommitButton().click();
                    browser.driver.sleep(5000);
                    table = thisSection.getNetworkGroupTables().get(0);
                    expect(installer.getTableRowCount(table)).toBe(2);
                });
            });

            it('should check vland id and limit appropriately"', function() {
                installer.getTableAddButton(table).click();
                browser.driver.sleep(1000);

                expect(installer.getModalCommitButton().isEnabled()).not.toBe(true);

                // Enter value for vlan id that is too large
                var vlandId = new NumericField('ngrp_vlan');
                vlandId.getElement().sendKeys(5000);
                expect(vlandId.isValid()).toBe(false);

                vlandId.increment();
                expect(vlandId.getValue()).toBe(4094);
                vlandId.increment();
                expect(vlandId.getValue()).toBe(4094);
                vlandId.decrement();
                expect(vlandId.getValue()).toBe(4093);

                // Save it
                //expect(installer.getModalCommitButton().isEnabled()).not.toBe(true);

            });
        });

        describe('Edit network', function() {
            var table = thisSection.getNetworkGroupTables().get(0);

            it('should be entitled "Edit network to [NETWORK_GROUP]"', function() {
                installer.getTableTitleText(table).then(function(text) {
                    installer.getTableDropdownToggleButtonAtRow(table, 0).click();
                    installer.getTableEditButtonAtRow(table, 0).click();
                    browser.driver.sleep(1000);
                    expect(installer.getModalDrawerTitleText()).toEqual('Edit network in ' + text);

                    // it('should list 7 input fields')
                    var formFields = installer.getModalFormFields();
                    expect(formFields.count()).toBe(7);
                    expect(formFields.get(0).getAttribute('type')).toBe('text');
                    expect(formFields.get(1).getAttribute('type')).toBe('number');
                    expect(formFields.get(2).getAttribute('type')).toBe('text');
                    expect(formFields.get(3).getAttribute('type')).toBe('text');
                    expect(formFields.get(4).getAttribute('type')).toBe('text');
                    expect(formFields.get(5).getAttribute('type')).toBe('text');
                    expect(formFields.get(6).getAttribute('type')).toBe('checkbox');

                    expect(formFields.get(0).getAttribute('required')).toBe('true');
                    expect(formFields.get(2).getAttribute('ardana-valid-ip-range')).toBe('');
                    expect(formFields.get(3).getAttribute('ardana-valid-ip-address')).toBe('');

                    expect(formFields.get(0).getAttribute('value')).toBe('EXTERNAL-API-NET');
                    expect(formFields.get(1).getAttribute('value')).toBe('101');
                    expect(formFields.get(2).getAttribute('value')).toBe('10.0.1.0/24');
                    expect(formFields.get(3).getAttribute('value')).toBe('10.0.1.1');
                    expect(formFields.get(4).getAttribute('value')).toBe('');
                    expect(formFields.get(5).getAttribute('value')).toBe('');
                    expect(formFields.get(6).getAttribute('checked')).toBe('true');

                    expect(installer.getModalCommitButton().isEnabled()).toBe(true);

                    // clicking "save" button
                    expect(installer.getTableRowCount(table)).toBe(1);
                    installer.getModalCommitButton().click();
                    table = thisSection.getNetworkGroupTables().get(0);
                    expect(installer.getTableRowCount(table)).toBe(1);
                });
            });
        });
    });

});
