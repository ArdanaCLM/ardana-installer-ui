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

describe('Ardana installer', function() {

    beforeEach(function() {
        installer.load();
    });

    describe('Section: Get Started', function() {

        it('should have 6 steps listed', function() {
            installer.sections['Get started'].getStepList().then(function(stepList) {
                expect(stepList.length).toBe(6);
            });
        });

        it('should have "Previous" button disabled', function() {
            expect(installer.prevButton().isEnabled()).not.toBe(true);
        });

    });

});
