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
var mockApiService = require('./po/mockApiService');

describe('Continuation:', function() {

    describe('Continuing editing previous model', function() {

        beforeEach(function() {
            mockApiService.set({
                modelReadFailures: 0,
                modelFile: 'e2e/testdata/templates/entry-scale-swift.json'
            });
            installer.load();             // go to Get started
        });

        afterEach(function() {
            mockApiService.reset();
        });

        it('should load previously saved model', function() {
            browser.driver.sleep(500);

            var msg = element.all(by.css('p.previous-config'));
            expect(msg.count()).toBe(1);
            expect(msg.get(0).isDisplayed()).toBe(true);
            installer.next();             // go to Cloud needs

            var btn = element(by.css('button.option-button.ng-scope.selected'));
            expect(btn.element(by.css('.option-label')).getText()).toBe('entry-scale-swift');
        });

        it('should warn when changing example', function() {
            browser.driver.sleep(500);

            installer.next();             // go to Cloud needs
            // Change the example
            cloudNeeds.getOption('entry-scale-esx').click();

            expect(element(by.css('.modal-dialog')).isDisplayed()).toBe(true);
            expect(element(by.css('.modal-dialog .modal-title')).getText()).toBe('Replace Configuration');
        });
    });

    describe('Continue deploying', function() {

        beforeEach(function() {
            mockApiService.set({
                modelFile: 'e2e/testdata/templates/entry-scale-kvm-vsa.json',
                modelReadFailures: 0,
                playsList: [
                    {
                        'alive': true,
                        'pRef': 12345,
                        'commandString': 'playbook site.yml'
                    }
                ]
            });
            installer.load();
        });

        afterEach(function() {
            mockApiService.reset();
        });

        it('should continue at deploying screen', function() {
            // Get section heading
            var sections = element.all(by.css('.section-header')).filter(function(elem) {
                return elem.isDisplayed();
            });
            expect(sections.count()).toBe(1);
            expect(sections.get(0).getText()).toBe('Deploy');

            var section = element(by.id('section_deploy'));
            var checkboxes = section.all(by.css('input[type=\"checkbox\"]'));
            expect(checkboxes.count()).toBe(2);
        });

    });


});
