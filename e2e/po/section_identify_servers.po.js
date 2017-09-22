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

module.exports = {
    getServerTable: getServerTable,
    getAddServerButton: getAddServerButton,
    getADropdownToggleButton: getADropdownToggleButton,
    getAnEditServerButton: getAnEditServerButton,
    getAnDeleteServerButton: getAnDeleteServerButton,

    setArdanaUserPassword: setArdanaUserPassword
};

function getServerTable() {
    return element.all(by.css('#section_identify_servers table.table-as-content tbody tr[ng-repeat-start]'));
}

function getAddServerButton() {
    return element(by.css('#section_identify_servers [ng-click="addAction()"]'));
}

function getADropdownToggleButton() {
    return getServerTable().get(0).element(by.css('[dropdown-toggle]'));
}

function getAnEditServerButton() {
    return getServerTable().get(0).all(by.css('.dropdown-menu a')).get(0);
}

function getAnDeleteServerButton() {
    return getServerTable().get(0).all(by.css('.dropdown-menu a')).get(1);
}

function setArdanaUserPassword() {
    element(by.buttonText('Edit settings')).click();
    browser.driver.sleep(1000);
    element(by.model('this_data.user_password')).sendKeys('testing');
    element(by.buttonText('Submit')).click();
    browser.driver.sleep(1000);
}
