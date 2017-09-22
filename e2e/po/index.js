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

var config = require('../e2e.conf');
var _ = require('underscore');

module.exports = {

    // main work flow wizard helps

    load: load,
    nextButton: nextButton,
    prevButton: prevButton,
    next: next,
    installOs: installOs,

    // modal drawer helpers

    getModalDrawer: getModalDrawer,
    getModalDrawerTitleText: getModalDrawerTitleText,
    modalDrawerShouldHaveTitleText: modalDrawerShouldHaveTitleText,
    getModalFormFields: getModalFormFields,
    getModalCommitButton: getModalCommitButton,
    getModalCancelButton: getModalCancelButton,
    drawerShouldActive: drawerShouldActive,
    getSecondaryModalWindow: getSecondaryModalWindow,
    getSecondaryModalWindowTitle: getSecondaryModalWindowTitle,
    getSecondaryModalWindowSaveBtn: getSecondaryModalWindowSaveBtn,
    closeSecondaryModalWindow: closeSecondaryModalWindow,
    getUpdateButtonInSecondaryModalWindow: getUpdateButtonInSecondaryModalWindow,

    // form fields

    getModalFormFieldsMetadata: getModalFormFieldsMetadata,
    getFormFieldByName: getFormFieldByName,
    //getModalFormFieldsMetadataMap: getModalFormFieldsMetadataMap,
    getFormFieldMetadata: getFormFieldMetadata,

    // modal helpers

    getModal: getModal,
    getModalTitleText: getModalTitleText,
    getModalLgFormFields: getModalLgFormFields,
    modalIsActive: modalIsActive,

    // confirmation modal helpers

    getConfirmModal: getConfirmModal,
    getConfirmModalRemoveButton: getConfirmModalRemoveButton,
    getConfirmModalCancelButton: getConfirmModalCancelButton,

    // selector helpers

    selectItemFromDropdown: selectItemFromDropdown,
    getCurrentValueFromDropdown: getCurrentValueFromDropdown,

    // tables helpers

    getTables: getTables,
    getTableRows: getTableRows,
    getTableCellAt: getTableCellAt,
    getTableAddButton: getTableAddButton,
    getTableDropdownToggleButtonAtRow: getTableDropdownToggleButtonAtRow,
    getTableDropdownMenuListAtRow: getTableDropdownMenuListAtRow,
    getTableDropdownToggleButtonAt: getTableDropdownToggleButtonAt,
    getTableDropdownMenuListAt: getTableDropdownMenuListAt,
    getTableActionDropdownButtonAtRow: getTableActionDropdownButtonAtRow,
    getTableActionListAtRow: getTableActionListAtRow,
    getTableEditButtonAtRow: getTableEditButtonAtRow,
    getTableDeleteButtonAtRow: getTableDeleteButtonAtRow,
    getTableRowCount: getTableRowCount,
    getTableTitleText: getTableTitleText,
    getTableHeadAt: getTableHeadAt,
    getTableCellAt: getTableCellAt,
    shouldAllowActionsOnTable: shouldAllowActionsOnTable,
    getCheckboxIn: getCheckboxIn,
    clearAllInCheckboxGroup: clearAllInCheckboxGroup,
    checkCheckBox: checkCheckBox,

    // helper for form

    getForm: getForm,
    getFormFields: getFormFields,
    getAttribute: getAttribute,
    getFieldType: getFieldType,

    // sections

    sections: {
        'Get started': require('./section_get_started.po'),
        'Cloud needs': require('./section_cloud_needs.po'),
        'Install OS': require('./section_install_os.po'),
        'Identify servers': require('./section_identify_servers.po'),
        'Assign network groups': require('./section_network_grps.po'),
        'Server role associations': require('./section_server_assocs.po'),
        'NIC mapping': require('./section_nic_mapping.po')
    }
};

function load() {
    browser.get(config.UI_HOST);
}

function prevButton() {
    return element(by.id('prevButton'));
}

function nextButton() {
    return element(by.id('nextButton'));
}

function next() {
    return nextButton().click();
}

function installOs() {
    return element(by.id('installOsButton')).click();
}

//
// modal drawer helpers
//

function getModalDrawer() {
    return element(by.css('.modal-drawer'));
}

function getModalDrawerTitleText() {
    return getModalDrawer().element(by.css('.header-drawer')).getText();
}

function modalDrawerShouldHaveTitleText(text) {
    expect(getModalDrawerTitleText()).toBe(text);
}

function getModalFormFields() {
    return getModalDrawer().all(by.css('input, selector'));
}

/**
 * Turn the elements into a s4te of form field metadata
 *
 * Returns a promise
 */
function getModalFormFieldsMetadata() {
    return getModalDrawer().all(by.css('input, selector')).map(function(elm, index) {
        return {
            index: index,
            name: elm.getAttribute('name').then(function(name) {
                return name || '$index-' + index;
            }),
            id: elm.getAttribute('id'),
            required: elm.getAttribute('required'),
            type: elm.getAttribute('type'),
            tag: elm.getTagName(),
            text: elm.getText(),
            value: elm.getAttribute('value'),
            element: elm
        };
    });
}

function getFormFieldMetadata(field) {
    return field.then(function(elm) {
        return {
            name: elm.getAttribute('name').then(function(name) {
                return name || '$unknown';
            }),
            id: elm.getAttribute('id'),
            required: elm.getAttribute('required'),
            type: elm.getAttribute('type'),
            tag: elm.getTagName(),
            text: elm.getText(),
            value: elm.getAttribute('value'),
            element: elm
        };
    });
}

function getFormFieldByName(name, tagName, form) {
    if (!form) {
        form = getModalDrawer();
    }
    if (tagName) {
        return form.all(by.xpath('//' + tagName + '[@name=\"' + name + '\"]')).first();
    } else {
        return form.all(by.name(name)).first();
    }
}

function getModalCommitButton() {
    return getModalDrawer().element(by.css('.footer-drawer button[ng-click="commit()"]'));
}

function getModalCancelButton() {
    return getModalDrawer().element(by.css('.footer-drawer button[ng-click="cancel()"]'));
}

function drawerShouldActive() {
    return expect(getModalDrawer().getAttribute('class')).toContain('active');
}

function getSecondaryModalWindow() {
    return $('[modal-window="modal-window"]');
}

function getSecondaryModalWindowTitle() {
    return $('[modal-window="modal-window"] .modal-title').getText();
}

function getSecondaryModalWindowSaveBtn() {
    return getSecondaryModalWindow()
        .element(by.buttonText('Save'));
}

function closeSecondaryModalWindow() {
    return $('[modal-window="modal-window"] [ng-click="cancel()"]').click();
}

function getUpdateButtonInSecondaryModalWindow() {
    return $('[modal-window="modal-window"] [ng-click="update()"]');
}

//
// modal helpers
//

function getModal() {
    return element(by.css('.modal-lg'));
}

function getModalTitleText() {
    return getModal().element(by.css('.modal-title')).getText();
}

function getModalLgFormFields() {
    return getModal().all(by.css('input, selector'));
}

function modalIsActive() {
    return expect(getModal().getAttribute('class')).toContain('active');
}

//
// helper for selector dropdown
//

function selectItemFromDropdown(itemIndex, dropdown) {
    if (typeof dropdown === 'string') {
        dropdown = $(dropdown);
    }
    dropdown.element(by.css('button')).click();
    dropdown.all(by.css('ul a')).get(itemIndex).click();
}

function getCurrentValueFromDropdown(dropdown) {
    return dropdown.element(by.css('button')).getText();
}

//
// Confirmation modal helpers
//

function getConfirmModal() {
    return element(by.css('.confirm-modal'));
}

function getConfirmModalRemoveButton() {
    return getConfirmModal().element(by.css('.modal-footer button[ng-click="confirmCtrl.ok()"]'));
}

function getConfirmModalCancelButton() {
    return getConfirmModal().element(by.css('.modal-footer button[ng-click="confirmCtrl.cancel()"]'));
}

//
// helper for table
//

function getTables(cssSelector) {
    return $$(cssSelector);
}

function getTableRows(table) {
    return table.all(by.css('tbody tr'));
}

function getTableCellAt(table, rowIndex, colIndex) {
    return getTableRows(table).get(rowIndex)
        .all(by.css('td')).get(colIndex);
}

function getTableAddButton(table) {
    return table.element(by.css('[ng-click="addAction()"]'));
}

function getTableDropdownToggleButtonAtRow(table, rowIndex) {
    return table.all(by.css('[dropdown-toggle]')).get(rowIndex);
}

function getTableDropdownMenuListAtRow(table, rowIndex) {
    return table.all(by.css('.dropdown-menu')).get(rowIndex)
        .all(by.css('a'));
}

function getTableDropdownToggleButtonAt(table, rowIndex, colIndex) {
    return getTableCellAt(table, rowIndex, colIndex)
        .element(by.css('[dropdown-toggle]'));
}

function getTableDropdownMenuListAt(table, rowIndex, colIndex) {
    return getTableCellAt(table, rowIndex, colIndex)
        .all(by.css('a'));
}

function getTableActionDropdownButtonAtRow(table, rowIndex) {
    return table.all(by.css('[action-col]')).get(rowIndex)
        .element(by.css('button'));
}

function getTableActionListAtRow(table, rowIndex) {
    return table.all(by.css('[action-col]')).get(rowIndex)
        .all(by.css('a'));
}

function getTableEditButtonAtRow(table, rowIndex) {
    return getTableDropdownMenuListAtRow(table, rowIndex).get(0);
}

function getTableDeleteButtonAtRow(table, rowIndex) {
    return getTableDropdownMenuListAtRow(table, rowIndex).get(1);
}

function getTableRowCount(table) {
    return getTableRows(table).count();
}

function getTableTitleText(table) {
    return table.element(by.css('.title')).getText();
}

function getTableHeadAt(table, colIndex) {
    return table.element(by.css('thead'))
        .element(by.css('tr'))
        .all(by.css('th')).get(colIndex);
}

function getTableCellAt(table, rowIndex, colIndex) {
    return table.element(by.css('tbody'))
        .all(by.css('tr')).get(rowIndex)
        .all(by.css('td')).get(colIndex);
}

function shouldAllowActionsOnTable(table) {

    // Table is now a collection of two tables

    // First table should be the header table
    // Second table is the content table

    var addButton = getTableAddButton(table.get(0));
    var editButton = getTableEditButtonAtRow(table.get(1), 0);
    var deleteButton = getTableDeleteButtonAtRow(table.get(1), 0);
    expect(addButton.isEnabled()).toBe(true);
    expect(editButton.isEnabled()).toBe(true);
    expect(deleteButton.isEnabled()).toBe(true);
}

function getCheckboxIn(parent) {
    return parent.element(by.css('input[type="checkbox"]'));
}

function clearAllInCheckboxGroup(checkboxGroup) {
    var checkboxes = checkboxGroup.all(by.css('div.disable-label>input[type="checkbox"]'));
    checkboxes.each(function(elem) {
        elem.isSelected().then(function(s) {
            if (s) {
                // Need to find the corresponding label to click
                elem.getAttribute('id').then(function(id) {
                    checkboxGroup.element(by.xpath('.//label[@for=\"' + id + '\"]')).click();
                });
            }
        });
    });
}

function checkCheckBox(checkboxGroup, index) {
    var checkboxes = checkboxGroup.all(by.css('input[type="checkbox"]'));
    checkboxes.get(index).isSelected().then(function(s) {
        if (!s) {
            // Need to find the corresponding label to click
            checkboxes.get(index).getAttribute('id').then(function(id) {
                checkboxGroup.element(by.xpath('.//label[@for=\"' + id + '\"]')).click();
            });
        }
    });
}

//
// helper for form
//

function getForm(formName) {
    return $('form[name="' + formName + '"]');
}

function getFormFields(formName) {
    return getForm(formName).all(by.css('input, textarea, selector'));
}

function getAttribute(field, attr) {
    return field.getAttribute(attr);
}

function getFieldType(field) {
    return getAttribute(field, 'type');
}
