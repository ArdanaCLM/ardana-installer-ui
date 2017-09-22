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

/*
    TODO: THIS SECTION WAS OBVIOUSLY REMOVED
    NIC Mappings are now handled differently, so we'll need new tests'
*/

var installer = require('./po');
var thisSection = installer.sections['NIC mapping'];

xdescribe('Section: NIC mapping', function() {
    var table, selectAllCheckBox, tableNicMappingSelector, viewAllNicMapsButton;

    describe('Cloud needs: select option 1', function() {
        beforeAll(function() {
            installer.load();                 // go to Get started
            installer.next();                 // go to Cloud needs
            cloudNeeds.getOption('entry-scale-esx').click();
            cloudNeeds.getOption('entry-scale-kvm-vsa').click();
            installer.next();                 // go to Install OS
            installer.sections['Install OS'].getOptions().get(1).click(); // Do not install OS
            installer.next();                 // go to Identify servers
            installer.next();                 // go to Assign network groups
            installer.next();                 // go to Configure disks and NICS
            installer.next();                 // go to Configure NIC mapping

            table = thisSection.getServerNicMappingTable();
            selectAllCheckBox = thisSection.getSelectAllCheckbox();
            tableNicMappingSelector = thisSection.getTableNicMappingSelector();
            viewAllNicMapsButton = thisSection.getViewAllNicMapsButton();
        });

        it('should display table listing servers with a select field for NIC map', function() {
            expect(installer.getTableRowCount(table)).toBe(7);
            installer.getTableRows(table).each(function(row, rowIndex) {
                expect(installer.getTableDropdownToggleButtonAt(table, rowIndex, 4).getText())
                    .not.toBe('Select NIC mapping');
            });
        });

        it('should display a select all checkbox', function() {
            expect(selectAllCheckBox.isPresent()).toBe(true);
        });

        it('should deselect all rows if checkbox unchecked', function() {
            installer.getTableRows(table).each(function(row, rowIndex) {
                var checkBox = row.element(by.css('input[type="checkbox"]'));
                expect(checkBox.getAttribute('checked')).not.toBeTruthy();
                expect(row.getAttribute('class')).not.toContain('selected');
            });
        });

        it('should select all rows if checkbox checked', function() {
            selectAllCheckBox.click();
            installer.getTableRows(table).each(function(row, rowIndex) {
                var checkBox = row.element(by.css('input[type="checkbox"]'));
                expect(checkBox.getAttribute('checked')).toBeTruthy();
                expect(row.getAttribute('class')).toContain('selected');
            });
            // deselect all
            selectAllCheckBox.click();
        });

        describe('Select row 2 and row 4', function() {
            beforeAll(function() {
                installer.getCheckboxIn(installer.getTableCellAt(table, 1, 0)).click();
                installer.getCheckboxIn(installer.getTableCellAt(table, 3, 0)).click();
            });

            it('should have only row 2 and row 4 selected', function() {
                installer.getTableRows(table).each(function(row, rowIndex) {
                    if (rowIndex === 1 || rowIndex === 3) {
                        expect(row.getAttribute('class')).toContain('selected');
                    } else {
                        expect(row.getAttribute('class')).not.toContain('selected');
                    }
                });
            });

            it('should allow user to set NIC map for all selected rows', function() {
                installer.getTableRows(table).each(function(row, rowIndex) {
                    var dropdown = row.element(by.css('selector'));
                    expect(installer.getCurrentValueFromDropdown(dropdown)).not.toBe('Select NIC mapping');
                });

                installer.selectItemFromDropdown(0, tableNicMappingSelector);
                installer.getTableRows(table).each(function(row, rowIndex) {
                    var dropdown = row.element(by.css('selector'));
                    if (rowIndex === 1 || rowIndex === 3) {
                        expect(installer.getCurrentValueFromDropdown(dropdown)).toBe('HP-DL360-4PORT');
                    } else {
                        expect(installer.getCurrentValueFromDropdown(dropdown)).not.toBe('Select NIC mapping');
                    }
                });

                installer.selectItemFromDropdown(1, tableNicMappingSelector);
                installer.getTableRows(table).each(function(row, rowIndex) {
                    var dropdown = row.element(by.css('selector'));
                    if (rowIndex === 1 || rowIndex === 3) {
                        expect(installer.getCurrentValueFromDropdown(dropdown)).toBe('MY-2PORT-SERVER');
                    } else {
                        expect(installer.getCurrentValueFromDropdown(dropdown)).not.toBe('Select NIC mapping');
                    }
                });

            });

        });

        it('should allow user to view all NIC maps in a drawer', function() {
            expect(viewAllNicMapsButton.isPresent()).toBe(true);
            viewAllNicMapsButton.click();
            browser.driver.sleep(1000);
            installer.drawerShouldActive();
            installer.getModalCancelButton().click();
        });

        it('should allow user to add NIC map for a server in a modal', function() {
            installer.getTableRows(table).each(function(row, rowIndex) {
                var item = installer.getTableDropdownMenuListAt(table, rowIndex, 4).get(2);
                expect(item.getInnerHtml()).toContain('Add NIC map');
            });
            installer.getTableDropdownToggleButtonAt(table, 0, 4).click();
            installer.getTableDropdownMenuListAt(table, 0, 4).get(2).click();
            expect(installer.getSecondaryModalWindow().isPresent()).toBeTruthy();
            installer.closeSecondaryModalWindow();
        });

        xdescribe('Add NIC mapping', function() {
            var secondaryModalWindow, form, formFields;
            beforeAll(function() {
                installer.getTableDropdownToggleButtonAt(table, 0, 4).click();
                installer.getTableDropdownMenuListAt(table, 0, 4).get(2).click();
                secondaryModalWindow = installer.getSecondaryModalWindow();
                form = secondaryModalWindow.element(by.css('.modal-body ng-form'));
                formFields = form.all(by.css('input, selector'));
            })

            afterAll(function() {
                installer.closeSecondaryModalWindow();
            });

            it('should allow user to add NIC map for a server in a modal', function() {
                expect(installer.getSecondaryModalWindow().isPresent()).toBeTruthy();
            });

            it('should display 10 fields', function() {
                expect(formFields.count()).toBe(10);

                formFields.each(function(field, index) {
                    expect(installer.getFieldType(field)).toBe('text');
                    if (index === 0) {
                        // Filed NIC map name
                        expect(installer.getAttribute(field, 'value')).toBe('CONTROLLER-ROLE');
                        expect(installer.getAttribute(field, 'readonly')).toBeTruthy();

                    } else if (index === 1) {
                        // Number of NICs
                        expect(installer.getAttribute(field, 'value')).toBe('CONTROLLER-INTERFACES');
                        expect(installer.getAttribute(field, 'readonly')).toBeTruthy();

                    } else if (index === 2) {
                        // Filed NIC map name
                        expect(installer.getAttribute(field, 'name')).toBe('nicmap_name');
                        expect(installer.getAttribute(field, 'required')).toBeTruthy();

                    } else if (index === 3) {
                        // Number of NICs
                        expect(installer.getAttribute(field, 'name')).toBe('nicmap_numNics');
                        expect(installer.getAttribute(field, 'readonly')).toBeTruthy();
                    }
                });
            });

            it('should have "Update" button disabled', function() {
                expect(installer.getUpdateButtonInSecondaryModalWindow().isEnabled()).not.toBe(true);
                formFields.get(2).sendKeys('SOME_UNIQUE_NIC_MAP_NAME');
                formFields.get(4).sendKeys('0000:08:00.1');
                formFields.get(5).sendKeys('0000:00:1a.0');
                formFields.get(6).sendKeys('0000:0f:0b.2');
                formFields.get(7).sendKeys('ffff:ff:1f.7');
                formFields.get(8).sendKeys('pci@0000:0f:0e.0');
                expect(installer.getUpdateButtonInSecondaryModalWindow().isEnabled()).toBe(true);

                // Protractor cannot find value for readonly field
                // expect(formFields.get(1).getOuterHtml()).toBe('5');
            });
        });

        describe('view all NIC maps', function() {
            var modalTable;
            var modalAddButton;

            beforeAll(function() {
                viewAllNicMapsButton.click();
                browser.driver.sleep(1000);
                modalTable = installer.getModalDrawer().element(by.css('.action-table'));
                modalAddButton = installer.getTableAddButton(modalTable);
            });

            it('should allow user to view all NIC maps in a drawer', function() {
                installer.drawerShouldActive();
            });

            it('should be entitled "Configure NIC mapping"', function() {
                installer.modalDrawerShouldHaveTitleText('Configure NIC mapping');
            });

            it('should how a NIC mapping table', function() {
                expect(modalTable.isPresent()).toBeTruthy();
            });

            it('should allow user to add/edit/delete a NIC map', function() {
                installer.shouldAllowActionsOnTable(modalTable);
            });

            describe('Creating NIC mapping', function() {
                var secondaryModalWindow, form, formFields;
                // form = modal-body
                beforeAll(function() {
                    modalAddButton.click();
                    secondaryModalWindow = installer.getSecondaryModalWindow();
                    form = secondaryModalWindow.element(by.css('.modal-body ng-form'));
                    formFields = form.all(by.css('input, selector'));
                });

                afterAll(function() {
                    installer.closeSecondaryModalWindow();
                });

                it('should show a drawer', function() {
                    expect(secondaryModalWindow.isPresent()).toBeTruthy();
                });

                it('should display 8 fields', function() {
                    expect(formFields.count()).toBe(8);

                    formFields.each(function(field, index) {
                        expect(installer.getFieldType(field)).toBe('text');
                        if (index === 0) {
                            // Filed NIC map name
                            expect(installer.getAttribute(field, 'name')).toBe('nicmap_name');
                            expect(installer.getAttribute(field, 'required')).toBeTruthy();

                        } else if (index === 1) {
                            // Number of NICs
                            expect(installer.getAttribute(field, 'name')).toBe('nicmap_numNics');
                            expect(installer.getAttribute(field, 'readonly')).toBeTruthy();
                        }
                    });
                });

                it('should have "Update" button disabled', function() {
                    expect(installer.getUpdateButtonInSecondaryModalWindow().isEnabled()).not.toBe(true);
                    formFields.get(0).sendKeys('SOME_UNIQUE_NIC_MAP_NAME');
                    formFields.get(2).sendKeys('0000:08:00.1');
                    formFields.get(3).sendKeys('0000:00:1a.0');
                    formFields.get(4).sendKeys('0000:0f:0b.2');
                    formFields.get(5).sendKeys('ffff:ff:1f.7');
                    formFields.get(6).sendKeys('pci@0000:0f:0e.0');
                    expect(installer.getUpdateButtonInSecondaryModalWindow().isEnabled()).toBe(true);

                    // Protractor cannot find value for readonly field
                    // expect(formFields.get(1).getOuterHtml()).toBe('5');
                });

            });

        });

    });

});
