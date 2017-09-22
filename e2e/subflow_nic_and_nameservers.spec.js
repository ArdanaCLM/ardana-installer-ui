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

    describe('NIC Servers', function() {
        var section;
        beforeEach(function() {
            installer.load(); // Get started
            installer.next(); // Cloud needs
            // Force a change in model to ensure it gets reset
            cloudNeeds.getOption('entry-scale-esx').click();
            cloudNeeds.getOption('entry-scale-kvm-vsa').click();
            cloudNeeds.getOption('entry-scale-esx').click();
            installer.next(); // Install OS
            installer.sections['Install OS'].getOptions().get(1).click(); // Select option 2
            installer.next(); // Identify servers
            section = element(by.css('[ng-controller="BaremetalServersController as bmCtrl"]'));
        });

        it('should show NIC server', function() {
            var ntpServers = section.all(by.css('dl')).get(1).element(by.css('dd'));
            expect(ntpServers.getText()).toBe('pool.ntp.org');
        });

        it('should allow NIC server to be removed', function() {
            var ntpServers = section.all(by.css('dl')).get(1).element(by.css('dd'));
            expect(ntpServers.getText()).toBe('pool.ntp.org');
            element(by.buttonText('Edit settings')).click();
            // Animation time for drawer to show - TODO: Could tweak CSS to remove animations
            browser.driver.sleep(500);
            var drawer = element(by.css('.modal-drawer'));
            var ntpActionTable = drawer.element(by.css('[add-action="ntpCtrl.addNtpServer"]'));
            expect(ntpActionTable.isDisplayed()).toBe(true);
            var ntpServerTable = ntpActionTable.element(by.css('.action-table.table-as-content'));

            var rows = ntpServerTable.all(by.css('tbody tr:not([ng-if="detailTemplate"])'));
            expect(rows.count()).toBe(1);
            expect(installer.getTableCellAt(ntpServerTable, 0, 0).getText()).toBe('pool.ntp.org');

            installer.getTableDropdownToggleButtonAtRow(ntpServerTable, 0).click();
            var menu = installer.getTableDropdownMenuListAtRow(ntpServerTable, 0);
            expect(menu.count()).toBe(2);

            menu.get(1).click();
            var modalDialog = element(by.css('.modal-dialog'));
            expect(modalDialog.isDisplayed()).toBe(true);
            modalDialog.element(by.buttonText('Remove')).click();

            rows = ntpServerTable.all(by.css('tbody tr:not([ng-if="detailTemplate"])'));
            expect(rows.count()).toBe(0);
            drawer.element(by.buttonText('Submit')).click();
            ntpServers = section.all(by.css('dl')).get(1).element(by.css('dd'));
            expect(ntpServers.getText()).toBe('--');
        });

        it('should allow NIC server to be edited', function() {
            element(by.buttonText('Edit settings')).click();
            // Animation time for drawer to show - TODO: Could tweak CSS to remove animations
            browser.driver.sleep(500);
            var drawer = element(by.css('.modal-drawer'));
            var ntpActionTable = drawer.element(by.css('[add-action="ntpCtrl.addNtpServer"]'));
            expect(ntpActionTable.isDisplayed()).toBe(true);
            var ntpServerTable = ntpActionTable.element(by.css('.action-table.table-as-content'));
            var rows = ntpServerTable.all(by.css('tbody tr:not([ng-if="detailTemplate"])'));
            expect(rows.count()).toBe(1);
            expect(installer.getTableCellAt(ntpServerTable, 0, 0).getText()).toBe('pool.ntp.org');

            installer.getTableDropdownToggleButtonAtRow(ntpServerTable, 0).click();
            var menu = installer.getTableDropdownMenuListAtRow(ntpServerTable, 0);
            expect(menu.count()).toBe(2);
            menu.get(0).click();
            // Edit shown
            var editForm = element(by.name('editNtpServerForm'));
            expect(editForm.isDisplayed()).toBe(true);
            editForm.element(by.id('ntpServerName')).clear();
            editForm.element(by.id('ntpServerName')).sendKeys('myntp.server.com');
            editForm.element(by.buttonText('Save')).click();
            drawer.element(by.buttonText('Submit')).click();
            ntpServers = section.all(by.css('dl')).get(1).element(by.css('dd'));
            expect(ntpServers.getText()).toBe('myntp.server.com');
        });
    });

    describe('Name Servers', function() {
        var section;
        beforeEach(function() {
            installer.load(); // Get started
            installer.next(); // Cloud needs
            // Force a change in model to ensure it gets reset
            cloudNeeds.getOption('entry-scale-esx').click();
            cloudNeeds.getOption('entry-scale-kvm-vsa').click();
            cloudNeeds.getOption('entry-scale-esx').click();
            installer.next(); // Install OS
            installer.sections['Install OS'].getOptions().get(1).click(); // Select option 2
            installer.next(); // Identify servers
            section = element(by.css('[ng-controller="BaremetalServersController as bmCtrl"]'));
        });

       it('should show Name servers', function() {
           var nameServers = section.all(by.css('dl')).get(2).all(by.css('dd'));
           expect(nameServers.count()).toBe(3);
           expect(nameServers.get(0).getText()).toBe('server1');
           expect(nameServers.get(1).getText()).toBe('server2');
           expect(nameServers.get(2).getText()).toBe('server3');
        });
    });
});
