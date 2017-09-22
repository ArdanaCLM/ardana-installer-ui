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
    getNetworkGroupTables: getNetworkGroupTables,
    getAddButton: getAddButton,
    getDropdownToggleButton: getDropdownToggleButton,
    getEditButton: getEditButton,
    getDeleteButton: getDeleteButton,
    getTableRowCount: getTableRowCount
};

function getNetworkGroupTables() {
    return $$('#section_network_grps .network-grps');
}

function getAddButton(index) {
    return getNetworkGroupTables().get(index).element(by.css('[ng-click="addAction()"]'));
}

function getDropdownToggleButton(index) {
    return getNetworkGroupTables().get(index).element(by.css('[dropdown-toggle]'));
}

function getEditButton(index) {
    return getNetworkGroupTables().get(index).all(by.css('.dropdown-menu a')).get(0);
}

function getDeleteButton(index) {
    return getNetworkGroupTables().get(index).all(by.css('.dropdown-menu a')).get(1);
}

function getTableRowCount(index) {
    return getNetworkGroupTables().get(index).all(by.css('tbody tr')).count();
}
