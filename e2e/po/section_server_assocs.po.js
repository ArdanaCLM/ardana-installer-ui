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
    getServerRoleTable: getServerRoleTable,
    getAddDiskModelButton: getAddDiskModelButton,
    getAddInterfaceModelButton: getAddInterfaceModelButton,
    getDeviceGroupEditable: getDeviceGroupEditable,
    getDeviceEditable: getDeviceEditable,
    getVolumeGroupEditable: getVolumeGroupEditable,
    getVolumeTable: getVolumeTable,
    getPhysicalVolumeEditable: getPhysicalVolumeEditable,
    getLogicalVolumeEditable: getLogicalVolumeEditable,
    getInterfaceAndNetworkEditable: getInterfaceAndNetworkEditable,
    getPlaceHolder: getPlaceHolder,
    getAddButton: getAddButton,
    getModalDeviceGroupTable: getModalDeviceGroupTable,
    getDeviceTable: getDeviceTable,
    getDeviceForm: getDeviceForm,
    getModalVolumeGroupTable: getModalVolumeGroupTable,
    getPhysicalVolumeTable: getPhysicalVolumeTable,
    getPhysicalVolumeForm: getPhysicalVolumeForm,
    getLogicalVolumeTable: getLogicalVolumeTable,
    getLogicalVolumeForm: getLogicalVolumeForm,
    getModalInterfacesAndNetworksTable: getModalInterfacesAndNetworksTable,
    getModalDeviceGroupTables: getModalDeviceGroupTables,
    getModalVolumeGroupTables: getModalVolumeGroupTables,
    getModalInterfacesAndNetworksTables: getModalInterfacesAndNetworksTables

};

function getServerRoleTable() {
    return $('#section_server_assocs .action-table');
}

function getAddDiskModelButton() {
    return $('#section_server_assocs [ng-click="serverAssociationCtrl.createDiskModel()"]');
}

function getAddInterfaceModelButton() {
    return $('#section_server_assocs [ng-click="serverAssociationCtrl.createInterface()"]');
}

function getDeviceGroupEditable() {
    return $('editable-placeholder[add-action-label="server_assocs.disk_models.device_groups.btn.add"]');
}

function getDeviceEditable() {
    return $('editable-placeholder[add-action-label="server_assocs.disk_models.devices.btn.add"]');
}

function getVolumeGroupEditable() {
    return $('editable-placeholder[add-action-label="server_assocs.disk_models.volume_groups.btn.add"]');
}

function getPhysicalVolumeEditable() {
    return $('editable-placeholder[add-action-label="server_assocs.disk_models.physical_volumes.btn.add"]');
}

function getLogicalVolumeEditable() {
    return $('editable-placeholder[add-action-label="server_assocs.disk_models.logical_volumes.btn.add"]');
}

function getInterfaceAndNetworkEditable() {
    return $('editable-placeholder[add-action-label="server_assocs.interface_models.interfaces.btn.add"]');
}

function getPlaceHolder(editable) {
    return editable.element(by.css('.ep-label'));
}

function getAddButton(editable) {
    return editable.element(by.css('button.ep-action'));
}

function getModalDeviceGroupTable() {
    return getDeviceGroupEditable()
        .element(by.css('.action-table.table-as-content'));
}

function getModalDeviceGroupTables() {
    return getDeviceGroupEditable()
        .all(by.css('.action-table'));
}

function getDeviceTable() {
    return getDeviceEditable().element(by.css('.action-table.table-as-content'));
}

function getDeviceForm(rowIndex) {
    return getDeviceTable()
        .all(by.css('tbody tr.detail-row')).get(rowIndex)
        .element(by.css('form[name="editDeviceForm"]'));
}

function getModalVolumeGroupTable() {
    return getVolumeGroupEditable()
        .element(by.css('.action-table.table-as-content'));
}

function getModalVolumeGroupTables() {
    return getVolumeGroupEditable()
        .all(by.css('.action-table'));
}

function getVolumeTable() {
    return getVolumeGroupEditable().element(by.css('.action-table.table-as-content'));
}

function getPhysicalVolumeTable() {
    return getPhysicalVolumeEditable()
        .element(by.css('.action-table.table-as-content'));
}

function getPhysicalVolumeForm(rowIndex) {
    return getPhysicalVolumeTable()
        .all(by.css('tbody tr.detail-row')).get(rowIndex)
        .element(by.css('form[name="editPhysicalVolumeForm"]'));
}

function getLogicalVolumeTable() {
    return getLogicalVolumeEditable()
        .element(by.css('.action-table.table-as-content'));
}

function getLogicalVolumeForm(rowIndex) {
    return getLogicalVolumeTable()
        .all(by.css('tbody tr.detail-row')).get(rowIndex)
        .element(by.css('form[name="editLogicalVolumeForm"]'));
}

function getModalInterfacesAndNetworksTable() {
    return getInterfaceAndNetworkEditable()
        .element(by.css('.action-table.table-as-content'));
}

function getModalInterfacesAndNetworksTables() {
    return getInterfaceAndNetworkEditable()
        .all(by.css('.action-table'));
}

