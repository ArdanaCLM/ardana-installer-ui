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
var cloudNeeds = installer.sections['Cloud needs'];
var thisSection = installer.sections['Identify servers'];

describe('Section: Identify servers', function() {

    describe('Section: Identify servers: Simple Checks: ', function() {

        beforeEach(function() {
            installer.load(); // Get started
            installer.next(); // Cloud needs
            // Force a change in model to ensure it gets reset
            cloudNeeds.getOption('entry-scale-esx').click();
            cloudNeeds.getOption('entry-scale-kvm-vsa').click();
            installer.next(); // Install OS
            installer.next(); // Identify servers
        });

        it('should allow user to add server using "Add server" button', function() {
            thisSection.getAddServerButton().isEnabled();
        });

        it('should allow user to edit or remove server', function() {
            thisSection.getAnEditServerButton().isEnabled();
            thisSection.getAnDeleteServerButton().isEnabled();
        });

        it('should display drawer for entering server information if "Add server" clicked', function() {
            thisSection.getAddServerButton().click();
            browser.driver.sleep(250);
            expect(element.all(by.css('.modal-drawer.active')).count()).toBe(1);

            // Press cancel to close the drawer
            installer.getModalCancelButton().click();
            browser.driver.sleep(500);
        });

        it('should display drawer for entering server information if "Edit server" clicked', function() {
            thisSection.getADropdownToggleButton().click();
            thisSection.getAnEditServerButton().click();
            browser.driver.sleep(250);
            expect(element.all(by.css('.modal-drawer.active')).count()).toBe(1);
        });

        it('should remove server from table if "Delete server" clicked', function() {
            thisSection.getADropdownToggleButton().click();
            thisSection.getAnDeleteServerButton().click();
            installer.getConfirmModalRemoveButton().click();
            expect(thisSection.getServerTable().count()).toBe(7 - 1);
        });

        // add or edit server

        it('should be entitled "Add server information"', function() {
            thisSection.getAddServerButton().click();
            browser.driver.sleep(1000);
            installer.getModalDrawerTitleText().then(function(text) {
                expect(text).toEqual('Add server information');
            });
        });

        it('should be entitled "Edit server information"', function() {
            thisSection.getADropdownToggleButton().click();
            thisSection.getAnEditServerButton().click();
            browser.driver.sleep(1000);
            installer.getModalDrawerTitleText().then(function(text) {
                expect(text).toEqual('Edit server information');
            });
        });

        it('should list 9 input fields when selecting "Yes" for installing OS', function() {
            thisSection.getAddServerButton().click();
            expect(installer.getModalFormFields().count()).toBe(9);
        });

    });


    it('should display table listing servers of selected cloud in step 2', function() {
        // reload
        installer.load(); // Get started
        installer.next(); // Cloud needs
        cloudNeeds.getOption('entry-scale-esx').click();
        expect(thisSection.getServerTable().count()).toBe(3);

        // reload
        installer.load(); // Get started
        installer.next(); // Cloud needs
        //installer.sections['Cloud needs'].getOptions().get(1).click(); // Select option 2
        cloudNeeds.getOption('entry-scale-kvm-vsa').click();
        installer.next(); // Install OS
        installer.next(); // Identify servers

        expect(thisSection.getServerTable().count()).toBe(7);
    });

    it('should list 5 input fields when selecting "No" for installing OS', function() {
        installer.load(); // Get started
        installer.next(); // Cloud needs
        cloudNeeds.getOption('entry-scale-esx').click();
        cloudNeeds.getOption('entry-scale-kvm-vsa').click();
        installer.next(); // Install OS
        installer.sections['Install OS'].getOptions().get(1).click(); // Select option 2
        installer.next(); // Identify servers
        //thisSection.getAddServerButton().click();
        //expect(installer.getModalFormFields().count()).toBe(5);
        /*
        expect(installer.getModalFormFields().get(0).getTagName()).toBe('selector');
        expect(installer.getModalFormFields().get(0).getAttribute('required')).toBe('true');
        expect(installer.getModalFormFields().get(1).getTagName()).toBe('selector');
        expect(installer.getModalFormFields().get(2).getTagName()).toBe('input');
        expect(installer.getModalFormFields().get(2).getAttribute('type')).toBe('text');
        expect(installer.getModalFormFields().get(2).getAttribute('required')).toBe('true');
        expect(installer.getModalFormFields().get(3).getTagName()).toBe('input');
        expect(installer.getModalFormFields().get(3).getAttribute('type')).toBe('text');
        expect(installer.getModalFormFields().get(3).getAttribute('required')).toBe('true');
        expect(installer.getModalFormFields().get(3).getAttribute('ardana-valid-mac-address')).toBe('');
        expect(installer.getModalFormFields().get(4).getTagName()).toBe('input');
        expect(installer.getModalFormFields().get(4).getAttribute('type')).toBe('text');
        expect(installer.getModalFormFields().get(4).getAttribute('required')).toBe('true');
        expect(installer.getModalFormFields().get(4).getAttribute('ardana-valid-ip-address')).toBe('');
        expect(installer.getModalFormFields().get(5).getTagName()).toBe('input');
        expect(installer.getModalFormFields().get(5).getAttribute('type')).toBe('text');
        expect(installer.getModalFormFields().get(5).getAttribute('required')).toBe('true');
        expect(installer.getModalFormFields().get(5).getAttribute('ardana-valid-ip-address')).toBe('');
        expect(installer.getModalFormFields().get(6).getTagName()).toBe('input');
        expect(installer.getModalFormFields().get(6).getAttribute('type')).toBe('text');
        expect(installer.getModalFormFields().get(6).getAttribute('required')).toBe('true');
        expect(installer.getModalFormFields().get(7).getTagName()).toBe('input');
        expect(installer.getModalFormFields().get(7).getAttribute('type')).toBe('text');
        expect(installer.getModalFormFields().get(7).getAttribute('required')).toBe('true');
        expect(installer.getModalFormFields().get(0).getText()).toBe('Select server role');
        expect(installer.getModalFormFields().get(1).getText()).toBe('Select server group');
        expect(installer.getModalFormFields().get(2).getAttribute('value')).toBe('');
        expect(installer.getModalFormFields().get(3).getAttribute('value')).toBe('');
        expect(installer.getModalFormFields().get(4).getAttribute('value')).toBe('');
        expect(installer.getModalFormFields().get(5).getAttribute('value')).toBe('');
        expect(installer.getModalFormFields().get(6).getAttribute('value')).toBe('');
        expect(installer.getModalFormFields().get(7).getAttribute('value')).toBe('');
        */
    });

    it('should populate fields with server information if editing', function() {
        installer.load(); // Get started
        installer.next(); // Cloud needs
        cloudNeeds.getOption('entry-scale-esx').click();
        cloudNeeds.getOption('entry-scale-kvm-vsa').click();
        installer.next(); // Install OS
        // Not installing OS
        installer.sections['Install OS'].getOptions().get(1).click(); // Select option 2
        installer.next(); // Identify servers
        thisSection.getADropdownToggleButton().click();
        thisSection.getAnEditServerButton().click();

        expect(installer.getFormFieldByName('server_name')).toBeDefined();
        expect(installer.getFormFieldByName('pxe_ip')).toBeDefined();
        expect(installer.getFormFieldByName('server_name').getAttribute('value')).not.toBe('');
        expect(installer.getFormFieldByName('pxe_ip').getAttribute('value')).not.toBe('');
    });

    it('should enable "Save" button when form is valid', function() {
        installer.load(); // Get started
        installer.next(); // Cloud needs
        cloudNeeds.getOption('entry-scale-esx').click();
        cloudNeeds.getOption('entry-scale-kvm-vsa').click();
        installer.next(); // Install OS
        installer.sections['Install OS'].getOptions().get(0).click(); // Select option 2
        installer.next(); // Identify servers
        thisSection.getAddServerButton().click();

        var saveButton = installer.getModalCommitButton();
        expect(saveButton.isEnabled()).not.toBe(true);
        installer.getFormFieldByName('server_name').sendKeys('Controller');
        expect(saveButton.isEnabled()).not.toBe(true);
        installer.getFormFieldByName('pxe_ip').sendKeys('169.1.1.1');
        expect(saveButton.isEnabled()).not.toBe(true);
        installer.getFormFieldByName('pxe_mac').sendKeys('5c:b9:01:89:c2:d8');
        expect(saveButton.isEnabled()).not.toBe(true);
        installer.getFormFieldByName('ipmi_ip').sendKeys('169.1.1.1');
        expect(saveButton.isEnabled()).not.toBe(true);
        installer.getFormFieldByName('ipmi_usr').sendKeys('user');
        expect(saveButton.isEnabled()).not.toBe(true);
        installer.getFormFieldByName('ipmi_pw', 'input').sendKeys('password');
        expect(saveButton.isEnabled()).not.toBe(true);
        installer.selectItemFromDropdown(0, '#server-role');
        // FIXME: NIC Mapping selector does not have a name attribute, so have to find by index
        installer.selectItemFromDropdown(0, installer.getModalDrawer().all(by.xpath('.//selector')).get(2));
        expect(saveButton.isEnabled()).toBe(true);

        // it ('should only add to "Server information" table if saved', function() {
        expect(thisSection.getServerTable().count()).toBe(7);
        saveButton.click();
        expect(thisSection.getServerTable().count()).toBe(7 + 1);
    });

    it('should allow user to add then contiunue to add another server', function() {
        installer.load(); // Get started
        installer.next(); // Cloud needs
        cloudNeeds.getOption('entry-scale-esx').click();
        cloudNeeds.getOption('entry-scale-kvm-vsa').click();
        installer.next(); // Install OS
        installer.sections['Install OS'].getOptions().get(0).click(); // Select option 1
        installer.next(); // Identify servers
        thisSection.getAddServerButton().click();
        browser.driver.sleep(500);

        installer.getFormFieldByName('server_name').sendKeys('Controller');
        installer.getFormFieldByName('pxe_ip').sendKeys('169.1.1.1');
        installer.getFormFieldByName('pxe_mac').sendKeys('5c:b9:01:89:c2:d8');
        installer.getFormFieldByName('ipmi_ip').sendKeys('169.1.1.1');
        installer.getFormFieldByName('ipmi_usr').sendKeys('user');
        installer.getFormFieldByName('ipmi_pw', 'input').sendKeys('password');
        installer.selectItemFromDropdown(0, '#server-role');
        // FIXME: NIC Mapping selector does not have a name attribute, so have to find by index
        installer.selectItemFromDropdown(0, installer.getModalDrawer().all(by.xpath('.//selector')).get(2));

        // Press continue button
        installer.getModalDrawer().element(by.buttonText('Next server')).click();
        expect(installer.getFormFieldByName('server_name').getText()).toBe('');
        expect(installer.getFormFieldByName('pxe_ip').getText()).toBe('');
        expect(installer.getFormFieldByName('pxe_mac').getText()).toBe('');
        expect(installer.getFormFieldByName('pxe_ip').getText()).toBe('');
        expect(installer.getFormFieldByName('ipmi_ip').getText()).toBe('');
        expect(installer.getFormFieldByName('ipmi_usr').getText()).toBe('');
        expect(installer.getFormFieldByName('ipmi_pw').getText()).toBe('');

        installer.getFormFieldByName('pxe_ip').sendKeys('not.an.ip.address');
        installer.getModalDrawer().element(by.buttonText('Cancel')).click();

        browser.driver.sleep(5000);

    });

});
