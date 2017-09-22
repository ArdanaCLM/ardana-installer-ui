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

var mockApiService = require('./po/mockApiService');
var installer = require('./po');
var cloudNeeds = installer.sections['Cloud needs'];
var thisSection = installer.sections['Install OS'];
var serversSection = installer.sections['Identify servers'];

describe('Ardana installer', function() {

    describe('Section: Install OS', function() {

        beforeEach(function() {
            installer.load();
            installer.next();
            installer.next();
        });

        it('should have first option selected initially', function() {
            thisSection.getOptions().get(0).getAttribute('class').then(function(classes) {
                expect(classes).toContain('selected');
            });

            // and

            thisSection.getOptions().get(0).getText().then(function(text) {
                expect(text.substring(0, 3)).toEqual('Yes');
            });
        });

        it('should have 2 options: Yes and No', function() {
            thisSection.getOptions().then(function(options) {
                expect(options.length === 2).toBe(true);
            });

            // and

            thisSection.getOptions().get(1).getText().then(function(text) {
                expect(text.substring(0, 2)).toEqual('No');
            });
        });

        it('should show overview for option currently hovered over', function() {
            var oldText;
            browser.actions().mouseMove(thisSection.getOptions().get(0)).perform();
            thisSection.getOverview().getText().then(function(text) {
                expect(text).not.toEqual('');
                oldText = text;
            });

            browser.actions().mouseMove(thisSection.getOptions().get(1)).perform();
            thisSection.getOverview().getText().then(function(text) {
                expect(text).not.toEqual('');
                expect(text).not.toEqual(oldText);
            });
        });

    });

    describe('Install OS Flow', function() {

        beforeEach(function() {
            // These tests required that persisting the model succeeds
            mockApiService.set({
                modelWriteFailures: 100,
                modelReadFailures: -1
            });
            installer.load(); // Get started
            installer.next(); // Cloud needs
            // Force a change in model to ensure it gets reset
            cloudNeeds.getOption('entry-scale-esx').click();
            cloudNeeds.getOption('entry-scale-kvm-vsa').click();
            cloudNeeds.getOption('entry-scale-esx').click();
            installer.next(); // Install OS
            installer.next(); // Identify servers
        });

        afterEach(function() {
            mockApiService.reset();
        });

        it('should have the OS install screens and flow', function() {
            // Should be on servers page but without a password, so we need to enter one in order to continue
            expect(element(by.id('installOsButton')).isEnabled()).toBe(false);

            element(by.buttonText('Edit settings')).click();
            // Animation time for drawer to show
            var drawer = element(by.css('.modal-drawer'));
            expect(drawer.element(by.buttonText('Submit')).isEnabled()).toBe(false);
            drawer.element(by.css('input[type="password"]')).sendKeys('test_password');
            expect(drawer.element(by.buttonText('Submit')).isEnabled()).toBe(true);
            drawer.element(by.buttonText('Submit')).click();
            browser.driver.sleep(250);
            expect(element(by.id('installOsButton')).isEnabled()).toBe(true);
            element(by.id('installOsButton')).click();

            var sections = element.all(by.css('.section-header')).filter(function(e) {
                return e.isDisplayed();
            });

            expect(sections.count()).toBe(1);
            expect(sections.get(0).getText()).toBe('SLES for Ardana install');

            element(by.id('nextButton')).click();
            element(by.id('nextButton')).click();
            element(by.id('nextButton')).click();

            expect(element(by.id('nextButton')).isEnabled()).toBe(false);
            //expect(installer.getTableRows(sections.get(0)).count()).toBe(3);

            // We have 5 seconds between polls
            browser.driver.sleep(20000);
            expect(element(by.id('nextButton')).isEnabled()).toBe(true);
            element(by.id('nextButton')).click();
        });

        it('should allow use to fix server list and then try again', function() {
            // Should be on servers page but without a password, so we need to enter one in order to continue
            expect(element(by.id('installOsButton')).isEnabled()).toBe(false);

            element(by.buttonText('Edit settings')).click();
            // Animation time for drawer to show
            var drawer = element(by.css('.modal-drawer'));
            expect(drawer.element(by.buttonText('Submit')).isEnabled()).toBe(false);
            drawer.element(by.css('input[type="password"]')).sendKeys('test_password');
            expect(drawer.element(by.buttonText('Submit')).isEnabled()).toBe(true);
            drawer.element(by.buttonText('Submit')).click();
            browser.driver.sleep(500);
            expect(element(by.id('installOsButton')).isEnabled()).toBe(true);

            serversSection.getADropdownToggleButton().click();
            serversSection.getAnEditServerButton().click();
            installer.getFormFieldByName('server_name').clear();
            installer.getFormFieldByName('server_name').sendKeys('__fail_controller1');
            drawer.element(by.buttonText('Complete')).click();
            browser.driver.sleep(500);

            // Fail the 2nd server as well, so we can delete it in a bit
            var servers = serversSection.getServerTable();
            installer.getTableDropdownToggleButtonAtRow(servers, 1).click();
            installer.getTableEditButtonAtRow(servers, 1).click();
            browser.driver.sleep(500);
            installer.getFormFieldByName('server_name').clear();
            installer.getFormFieldByName('server_name').sendKeys('__fail_controller2');
            drawer.element(by.buttonText('Complete')).click();
            browser.driver.sleep(500);

            // Okay - that will instruct test mode to fail the server install
            element(by.id('installOsButton')).click();
            element(by.id('nextButton')).click();
            element(by.id('nextButton')).click();
            element(by.id('nextButton')).click();

            expect(element(by.id('nextButton')).isEnabled()).toBe(false);
            // We have 5 seconds between polls
            browser.driver.sleep(20000);
            expect(element(by.id('nextButton')).isEnabled()).toBe(false);

            // Should be an error
            //expect(element(by.buttonText('Try again')).isEnabled()).toBe(true);

            // Edit the server name and try again
            var osProgress = element(by.id('section_install_os_progress'));
            installer.getTableDropdownToggleButtonAtRow(osProgress, 0).click();
            installer.getTableEditButtonAtRow(osProgress, 0).click();
            browser.driver.sleep(500);
            installer.getFormFieldByName('server_name').clear();
            installer.getFormFieldByName('server_name').sendKeys('controller1_ok');
            drawer.element(by.buttonText('Complete')).click();
            browser.driver.sleep(500);

            // Delete the 2nd server just to exercise that behaviour as well
            installer.getTableDropdownToggleButtonAtRow(osProgress, 1).click();
            installer.getTableDeleteButtonAtRow(osProgress, 1).click();
            browser.driver.sleep(500);
            installer.getConfirmModalRemoveButton().click();
            browser.driver.sleep(500);

            element(by.buttonText('Try again')).click();
            browser.driver.sleep(20000);
            expect(element(by.id('nextButton')).isEnabled()).toBe(true);
            element(by.id('nextButton')).click();
            browser.driver.sleep(500);
        });

    });
});
