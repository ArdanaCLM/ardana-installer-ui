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
    getServerNicMappingTable: getServerNicMappingTable,
    getSelectAllCheckbox: getSelectAllCheckbox,
    getTableNicMappingSelector: getTableNicMappingSelector,
    getViewAllNicMapsButton: getViewAllNicMapsButton
};

function getServerNicMappingTable() {
    return $('#section_nic_mapping .action-table');
}

function getSelectAllCheckbox() {
    return getServerNicMappingTable()
        .element(by.css('thead'))
        .element(by.css('.select-all'));
}

function getTableNicMappingSelector() {
    return getServerNicMappingTable()
        .element(by.css('thead selector'));
}

function getViewAllNicMapsButton() {
    return getServerNicMappingTable()
        .element(by.css('thead'))
        .element(by.buttonText('View all NIC maps'));
}
