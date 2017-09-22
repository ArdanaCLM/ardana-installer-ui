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
var fs = require('fs');
var path = require('path');
var installer = require('./po');
var cloudNeeds = installer.sections['Cloud needs'];
var thisSection = installer.sections['Identify servers'];

describe('Section: Identify servers', function() {

    beforeEach(function() {
        installer.load(); // Get started
        installer.next(); // Cloud needs
        // Force a change in model to ensure it gets reset
        cloudNeeds.getOption('entry-scale-esx').click();
        cloudNeeds.getOption('entry-scale-kvm-vsa').click();
        installer.next(); // Install OS
        installer.sections['Install OS'].getOptions().get(1).click();
        installer.next(); // Identify servers
    });

    // Helpers should go into a Page Object

    function uploadFile(filetoUpload) {
        element(by.buttonText('Import file')).click();
        browser.driver.sleep(500);
        var drawer = element(by.css('.modal-drawer'));
        expect(drawer.element(by.buttonText('Continue Import')).isEnabled()).toBe(false);
        var fileElem = drawer.element(by.css('input[type="file"]'));
        var absolutePath = path.resolve(__dirname, filetoUpload);
        expect(fs.existsSync(absolutePath)).toBe(true);
        fileElem.sendKeys(absolutePath);
        browser.driver.sleep(250);
        expect(drawer.element(by.buttonText('Continue Import')).isEnabled()).toBe(true);
        drawer.element(by.buttonText('Continue Import')).click();
        return drawer;
    }

    function checkSectionHeading(drawer, text) {
        var sections = drawer.all(by.css('.section-header')).filter(function(elem) {
            return elem.isDisplayed();
        });
        expect(sections.count()).toBe(1);
        expect(sections.get(0).getText()).toBe(text);
    }


    it('should display the import csv drawer', function() {
        // No drawer shown to start with
        expect(element.all(by.css('.modal-drawer.active')).count()).toBe(0);

        // Click the import button
        element(by.buttonText('Import file')).click();
        expect(browser.driver.sleep(500));
        var drawer = element(by.css('.modal-drawer'));
        // Drawer should be shown
        expect(element.all(by.css('.modal-drawer.active')).count()).toBe(1);
        drawer.element(by.buttonText('Cancel')).click();
    });

    it('should error with a non-csv file', function() {
        var drawer = uploadFile('./testdata/csv_import_bad_file.csv');
        expect(drawer.element(by.buttonText('Back to Import Screen')).isEnabled()).toBe(true);
        expect(drawer.element(by.buttonText('Cancel')).isEnabled()).toBe(true);
        checkSectionHeading(drawer, 'ERROR: We could not read the CSV File');
        expect(drawer.element(by.buttonText('Cancel')).click());
    });

    it('should error with missing required fields', function() {
        var drawer = uploadFile('./testdata/csv_import_missing_fields.csv');
        expect(drawer.element(by.buttonText('Back to Import Screen')).isEnabled()).toBe(true);
        expect(drawer.element(by.buttonText('Cancel')).isEnabled()).toBe(true);
        checkSectionHeading(drawer, 'ERROR: Required fields are missing');

        // Check that Server ID is shown as the missing field
        var missingFields = drawer.all(by.css('ul[ng-if="missing_fields"] li'));
        expect(missingFields.count()).toBe(1);
        expect(missingFields.get(0).getText()).toBe('Server ID');
        expect(drawer.element(by.buttonText('Back to Import Screen')).click());
    });

    it('should import a server from file', function() {
        var drawer = uploadFile('./testdata/csv_import_1.csv');
        expect(drawer.element(by.buttonText('Back to Import Screen')).isEnabled()).toBe(true);
        expect(drawer.element(by.buttonText('Complete Import')).isEnabled()).toBe(true);
        expect(drawer.element(by.buttonText('Cancel')).isEnabled()).toBe(true);
        checkSectionHeading(drawer, 'Review servers imported from CSV');
        var okItems = element.all(by.css('td.import-row-status>span.glyphicon-ok-circle'));
        expect(okItems.count()).toBe(1);
        element(by.css('.modal-drawer')).element(by.buttonText('Complete Import')).click();
    });

    it('should clear the file input field each time the drawer opens', function() {
        var drawer = uploadFile('./testdata/csv_import_1.csv');
        expect(drawer.element(by.buttonText('Back to Import Screen')).isEnabled()).toBe(true);
        expect(drawer.element(by.buttonText('Complete Import')).isEnabled()).toBe(true);
        expect(drawer.element(by.buttonText('Cancel')).isEnabled()).toBe(true);
        element(by.css('.modal-drawer')).element(by.buttonText('Cancel')).click();
        browser.driver.sleep(500);
        element(by.buttonText('Import file')).click();
        browser.driver.sleep(500);
        drawer = element(by.css('.modal-drawer'));
        // Check that the filename field is empty
        expect(drawer.element(by.css('input[type="file"]')).getText()).toBe('');
    });


});
