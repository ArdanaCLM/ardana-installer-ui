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
var thisSection = installer.sections['Cloud needs'];

describe('Ardana installer', function() {

    beforeEach(function() {
        installer.load();
        installer.next();
    });

    describe('Section: Cloud needs', function() {

        it('should have first option selected initially', function() {
            thisSection.getOptions().get(0).getAttribute('class').then(function(classes) {
                expect(classes).toMatch('selected');
            });
        });

        it('should have at least 2 options', function() {
            thisSection.getOptions().then(function(options) {
                expect(options.length >= 2).toBe(true);
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

        it('should be able to select a named example', function() {
            thisSection.getOption('entry-scale-swift').click();
        });

    });

});
