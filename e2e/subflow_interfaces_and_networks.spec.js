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

describe('subflow: Create, modify and delete interface model', function() {
    var table, interfaceAndNetworkEditable, interfacesAndNetworksTable;

    beforeEach(function() {
        installer.load();             // go to Get started
        installer.next();             // go to Cloud needs
        installer.next();             // go to Install OS
        installer.sections['Install OS'].getOptions().get(1).click(); // Select option 2
        installer.next();             // go to Identify servers
        installer.next();             // go to Assign network groups
        installer.next();             // go to Configure disks and NICs

        table = thisSection.getServerRoleTable();
        installer.getTableActionDropdownButtonAtRow(table, 0).click();
        installer.getTableActionListAtRow(table, 0).get(1).click(); // Edit interface model
        browser.driver.sleep(1000);
        interfacesAndNetworksTable = thisSection.getModalInterfacesAndNetworksTable();
    });

    describe('Add interfaces and networks', function() {
        var form, checkboxGroups, fields;

        beforeEach(function() {
            interfaceAndNetworkEditable = thisSection.getInterfaceAndNetworkEditable();
            interfaceAndNetworkEditable.element(by.css('[ng-click="addAction()"]')).click();
            form = $('form[name="interfacesAndNetworksForm"]');
            checkboxGroups = form.all(by.css('[ardana-checkbox-group]'));
            fields = form.all(by.css('input[type="text"], textarea'));
        });

        it('should display modal entitled "Add interfaces and networks"', function() {
            expect(installer.getSecondaryModalWindowTitle()).toBe('Add interfaces and networks');
        });

        it('should display 3 fields and 2 checkbox groups in form', function() {
            expect(checkboxGroups.count()).toBe(2);
            expect(fields.count()).toBe(4);
            expect(form.all(by.css('input[type="text"][readonly]')).count()).toBe(1);

            expect(checkboxGroups.get(0).getAttribute('required')).toBeTruthy();
            expect(checkboxGroups.get(1).getAttribute('required')).toBeTruthy();

            var interfaceNameField = installer.getFormFieldByName('interfaceName', 'input', form);
            var bondAliasField = installer.getFormFieldByName('bondAlias', 'input', form);
            var bondOptionsField = installer.getFormFieldByName('bondOptions', 'textarea', form);

            expect(fields.get(0).getAttribute('type')).toBe('text');
            expect(fields.get(1).getAttribute('type')).toBe('text');
            expect(bondOptionsField.getAttribute('yamlize')).not.toBe(null);

            expect(interfaceNameField.getAttribute('required')).toBeTruthy();
            expect(bondAliasField.getAttribute('required')).not.toBeTruthy();
            expect(bondOptionsField.getAttribute('required')).not.toBeTruthy();

            //var interfaceCheckboxs = checkboxGroups.get(0).all(by.css('input[type="checkbox"]'));
            var interfaceCheckboxs = checkboxGroups.get(0).all(by.css('label[for]'));

            interfaceCheckboxs.get(0).click();
            expect(interfaceNameField.getAttribute('required')).toBeTruthy();
            expect(bondAliasField.getAttribute('required')).not.toBeTruthy();
            expect(bondOptionsField.getAttribute('required')).not.toBeTruthy();

            interfaceCheckboxs.get(1).click();
            expect(interfaceNameField.getAttribute('required')).toBeTruthy();
            expect(bondAliasField.getAttribute('required')).toBeTruthy();
            expect(bondOptionsField.getAttribute('required')).toBeTruthy();
        });
    });

    describe('Edit interfaces and networks', function() {
        var form, checkboxGroups, fields;

        beforeEach(function() {
            installer.getTableActionDropdownButtonAtRow(interfacesAndNetworksTable, 0).click();
            // Edit interfaces and networks
            installer.getTableActionListAtRow(interfacesAndNetworksTable, 0).get(0).click();
            form = $('form[name="interfacesAndNetworksForm"]');
            checkboxGroups = form.all(by.css('[ardana-checkbox-group]'));
            fields = form.all(by.css('input[type="text"], textarea'));
        });

        it('should display modal entitled "Edit interfaces and networks"', function() {
            expect(installer.getSecondaryModalWindowTitle()).toBe('Edit interfaces and networks');
        });

        it('should display 2 fields and 2 checkbox groups in form', function() {
            expect(checkboxGroups.count()).toBe(2);
            expect(fields.count()).toBe(4);

            expect(checkboxGroups.get(0).getAttribute('required')).toBeTruthy();
            expect(checkboxGroups.get(1).getAttribute('required')).toBeTruthy();

            var bondOptionsField = installer.getFormFieldByName('bondOptions', 'textarea', form);

            expect(fields.get(0).getAttribute('type')).toBe('text');
            expect(fields.get(1).getAttribute('type')).toBe('text');
            expect(bondOptionsField.getAttribute('yamlize')).not.toBe(null);
        });
    });

    it('should disable interfaces already assigned in other sets', function() {

        // 1) check first checkbox in interface checkbox group and save changes:

        // Show dropdown action menu
        installer.getTableActionDropdownButtonAtRow(interfacesAndNetworksTable, 0).click();
        // Select `Edit interfaces and networks`
        installer.getTableActionListAtRow(interfacesAndNetworksTable, 0).get(0).click();
        var form = $('form[name="interfacesAndNetworksForm"]');
        var checkboxGroups = form.all(by.css('[ardana-checkbox-group]'));
        var interfaceCheckboxs = checkboxGroups.get(0).all(by.css('label[for]'));
        interfaceCheckboxs.get(0).click();
        installer.getSecondaryModalWindowSaveBtn().click(); // click on `save` button

        // 2) try `Add interfaces and networks`

        interfaceAndNetworkEditable = thisSection.getInterfaceAndNetworkEditable();
        // click on `Add interfaces and networks` button
        interfaceAndNetworkEditable.element(by.css('[ng-click="addAction()"]')).click();
        form = $('form[name="interfacesAndNetworksForm"]');
        checkboxGroups = form.all(by.css('[ardana-checkbox-group]'));
        interfaceCheckboxs = checkboxGroups.get(0).all(by.css('input[type="checkbox"]'));
        //var interfaceCheckboxs = checkboxGroups.get(0).all(by.css('label[for]'));

        // Only check the first one, as this is the only one we know wwe have used
        expect(interfaceCheckboxs.get(0).getAttribute('disabled')).toBeTruthy();

        /*

        TODO: Set up test so we can verify all check boxes?

        expect(interfaceCheckboxs.get(1).getAttribute('disabled')).not.toBeTruthy();
        expect(interfaceCheckboxs.get(2).getAttribute('disabled')).not.toBeTruthy();
        expect(interfaceCheckboxs.get(3).getAttribute('disabled')).not.toBeTruthy();
        expect(interfaceCheckboxs.get(4).getAttribute('disabled')).not.toBeTruthy();
        expect(interfaceCheckboxs.get(5).getAttribute('disabled')).not.toBeTruthy();
        */
    });

    it('should disable network groups already assigned in other sets', function() {
        // 1) uncheck first checkbox in network checkbox group and save changes:

        // Show dropdown action menu
        installer.getTableActionDropdownButtonAtRow(interfacesAndNetworksTable, 0).click();
        // Select `Edit interfaces and networks`
        installer.getTableActionListAtRow(interfacesAndNetworksTable, 0).get(0).click();
        var form = $('form[name="interfacesAndNetworksForm"]');
        var checkboxGroups = form.all(by.css('[ardana-checkbox-group]'));
        //var networkCheckboxs = checkboxGroups.get(1).all(by.css('input[type="checkbox"]'));
        var networkCheckboxs = checkboxGroups.get(1).all(by.css('label[for]'));
        networkCheckboxs.get(0).click();
        installer.getSecondaryModalWindowSaveBtn().click(); // click on `save` button

        // 2) try `Add interfaces and networks`

        interfaceAndNetworkEditable = thisSection.getInterfaceAndNetworkEditable();
        // click on `Add interfaces and networks` button
        interfaceAndNetworkEditable.element(by.css('[ng-click="addAction()"]')).click();
        form = $('form[name="interfacesAndNetworksForm"]');
        checkboxGroups = form.all(by.css('[ardana-checkbox-group]'));
        networkCheckboxs = checkboxGroups.get(1).all(by.css('input[type="checkbox"]'));

        expect(networkCheckboxs.get(0).getAttribute('disabled')).toBeTruthy();

        /* TODO: Same as devices - we can't assume the state of the other checkboxes
        expect(networkCheckboxs.get(1).getAttribute('disabled')).toBeTruthy();
        expect(networkCheckboxs.get(2).getAttribute('disabled')).toBeTruthy();
        expect(networkCheckboxs.get(3).getAttribute('disabled')).toBeTruthy();
        */
    });

    it('should enable "Save" button when all required fields filled out', function() {
        // Show dropdown action menu
        installer.getTableActionDropdownButtonAtRow(interfacesAndNetworksTable, 0).click();
        // Select `Edit interfaces and networks`
        installer.getTableActionListAtRow(interfacesAndNetworksTable, 0).get(0).click();

        var form = $('form[name="interfacesAndNetworksForm"]');
        var checkboxGroups = form.all(by.css('[ardana-checkbox-group]'));
        var fields = form.all(by.css('input[type="text"], textarea'));
        //var interfaceCheckboxes = checkboxGroups.get(0).all(by.css('input[type="checkbox"]'));
        var interfaceCheckboxes = checkboxGroups.get(0).all(by.css('label[for]'));
        //var networkCheckboxes = checkboxGroups.get(1).all(by.css('input[type="checkbox"]'));
        var networkCheckboxes = checkboxGroups.get(1).all(by.css('label[for]'));
        //var bondAliasField = fields.get(0);
        //var bondOptionsField = fields.get(1);

        //interfaceName
        //bondAlias
        //bondOptions

        var bondInterfaceNameField = installer.getFormFieldByName('interfaceName', 'input', form);
        var bondAliasField = installer.getFormFieldByName('bondAlias', 'input', form);
        var bondOptionsField = installer.getFormFieldByName('bondOptions', 'textarea', form);

        // Clear the form

        // Need to make sure two devices are selected, so that the bond fields are editable
        // and thus can be cleared
        installer.checkCheckBox(checkboxGroups.get(0), 0);
        installer.checkCheckBox(checkboxGroups.get(0), 1);

        bondInterfaceNameField.clear();
        bondAliasField.clear();
        bondOptionsField.clear();

        installer.clearAllInCheckboxGroup(checkboxGroups.get(0));
        installer.clearAllInCheckboxGroup(checkboxGroups.get(1));

        // Fill the form in field by field and check the save button enabled state as we go

        expect(installer.getSecondaryModalWindowSaveBtn().isEnabled()).not.toBeTruthy();

        interfaceCheckboxes.get(0).click();
        expect(installer.getSecondaryModalWindowSaveBtn().isEnabled()).not.toBeTruthy();

        networkCheckboxes.get(0).click();
        expect(installer.getSecondaryModalWindowSaveBtn().isEnabled()).not.toBeTruthy();

        interfaceCheckboxes.get(1).click();
        expect(installer.getSecondaryModalWindowSaveBtn().isEnabled()).not.toBeTruthy();

        bondInterfaceNameField.sendKeys('bond0');
        expect(installer.getSecondaryModalWindowSaveBtn().isEnabled()).not.toBeTruthy();

        bondAliasField.sendKeys('BOND_NEW');
        expect(installer.getSecondaryModalWindowSaveBtn().isEnabled()).not.toBeTruthy();

        bondOptionsField.sendKeys('mode: active-backup\nmiimon: 200\nprimary: hed3');
        expect(installer.getSecondaryModalWindowSaveBtn().isEnabled()).toBeTruthy();
    });

});
