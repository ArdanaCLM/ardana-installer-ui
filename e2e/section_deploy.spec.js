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
//var thisSection = installer.sections['Install OS'];
var mockApiService = require('./po/mockApiService');
var CheckBox = require('./po/controls/checkbox');

describe('Ardana installer', function() {

    describe('Section: Deploy Flow', function() {

        beforeEach(function() {
            mockApiService.set({
                modelWriteFailures: 0,
                mockPlays: [
                    'config_processor_run',
                    'ready_deployment',
                    'site'
                ]
            });
            installer.load(); // Get started
            installer.next(); // Cloud needs
            // Force a change in model to ensure it gets reset
            cloudNeeds.getOption('entry-scale-esx').click();
            cloudNeeds.getOption('entry-scale-kvm-vsa').click();
            installer.next(); // Install OS
            installer.sections['Install OS'].getOptions().get(1).click();
            installer.next(); // Identify servers
            installer.next(); // Config networks
            installer.next(); // Server assocs
            installer.next(); // Ready to deploy
        });


        afterEach(function() {
            mockApiService.reset();
        });

        it('should show ready to deploys section', function() {
            var sections = element.all(by.css('.section-header')).filter(function(e) {
                return e.isDisplayed();
            });

            expect(sections.count()).toBe(1);
            expect(sections.get(0).getText()).toBe('Ready to deploy!');

            var deployBtn = element(by.buttonText('Deploy'));
            expect(deployBtn.isPresent()).toBe(true);
            expect(deployBtn.isEnabled()).toBe(true);
            deployBtn.click();

            browser.driver.sleep(500);

            // Toggle the raw log view
            var section = element(by.id('section_deploy'));
            var logToggle = new CheckBox(section.all(by.css('input[type=\"checkbox\"]')).get(0));
            expect(logToggle.isChecked()).toBe(true);
            browser.driver.sleep(1000);
            logToggle.toggle();
            expect(logToggle.isChecked()).toBe(false);
            browser.driver.sleep(1000);
            logToggle.toggle();
            expect(logToggle.isChecked()).toBe(true);
            browser.driver.sleep(1000);

            // Wait a bit to go through the other steps
            // TODO: Need quicker log files for these tests
            browser.driver.sleep(15000);
        });
    });
});
