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
(function() {
    'use strict';

    angular
        .module('dayzero')
        .factory('PapaParse', PapaParse);

    function PapaParse() {
        // Check that the external dependency is available
        //noinspection JSUnresolvedVariable
        var papaParse = Papa;
        if (!angular.isDefined(papaParse)) {
            throw new Error('PapaParse library not available');
        } else {
            return papaParse;
        }
    }

    angular
        .module('dayzero')
        .factory('ServerCSVImportService', serverCSVImportService);

    serverCSVImportService.$inject = ['$q', 'PapaParse', 'ValidatorsService', 'ardanaInstallationData'];

    function serverCSVImportService($q, PapaParse, ValidatorsService, ardanaInstallationData) {
        var fieldDefinitions = initFieldDefinitions();

        return {
            getFields: getFields,
            getRequiredFields: getRequiredFields,
            getOptionalFields: getOptionalFields,
            parse: parse,
            transformCSV: transformCSV,
            tableToArray: tableToArray
        };

        // Required fields/columns for Server in CSV file
        function initFieldDefinitions() {
            return [
                {
                    key: 'id',
                    unique: true,
                    validator: 'ardanaValidName',
                    aliases: [
                        'server_id',
                        'id'
                    ],
                    label: 'identify_servers.import.fields.server_id'
                },

                {
                    key: 'ip-addr',
                    unique: true,
                    validator: 'ardanaValidIpAddress',
                    aliases: [
                        'ip',
                        'ip_address',
                        'address'
                    ],
                    label: 'identify_servers.import.fields.ip_addr'
                },
                {
                    key: 'mac-addr',
                    unique: true,
                    validator: 'ardanaValidMacAddress',
                    aliases: [
                        'mac',
                        'mac_address',
                        'mac_addr'
                    ],
                    os: true,
                    label: 'identify_servers.import.fields.mac_addr'
                },
                {
                    key: 'ilo-ip',
                    unique: true,
                    validator: 'ardanaValidIpAddress',
                    aliases: [
                        'ipmi_ip',
                        'ipmi_ip_address',
                        'impi',
                        'ilo_ip'
                    ],
                    os: true,
                    label: 'identify_servers.import.fields.ipmi_ip'
                },
                {
                    key: 'ilo-user',
                    aliases: [
                        'ipmi_user',
                        'ipmi_username',
                        'ipmi_user_name',
                        'user',
                        'ilo_user'
                    ],
                    os: true,
                    label: 'identify_servers.import.fields.ipmi_usr'
                },
                {
                    key: 'ilo-password',
                    aliases: [
                        'ipmi_password',
                        'password',
                        'ilo_password'
                    ],
                    os: true,
                    label: 'identify_servers.import.fields.ipmi_pw'
                },
                {
                    key: 'role',
                    restriction: 'server-roles',
                    aliases: [
                        'server_role',
                        'role'
                    ],
                    label: 'identify_servers.import.fields.role'
                },
                {
                    key: 'group',
                    restriction: 'server-groups',
                    aliases: [
                        'server_group',
                        'group'
                    ],
                    optional: true,
                    label: 'identify_servers.import.fields.group'
                },
                {
                    key: 'nic-mapping',
                    restriction: 'nic-mappings',
                    aliases: [
                        'server_nic_map',
                        'nic_map',
                        'nic_mapping'
                    ],
                    label: 'identify_servers.import.fields.nic_map'
                }
            ];
        }

        function getFields(isInstallingOS) {
            return _.filter(fieldDefinitions, function(f) {
                return (isInstallingOS && f.os) || !f.os;
            });
        }

        /**
         * Get an array of the fields for displaying in the UI
         * @param {boolean} isInstallingOS Indicates if we are installing OS and thus need extra required fields
         */
        function getRequiredFields(isInstallingOS) {
            return _.filter(getFields(isInstallingOS), function(f) {
                return !f.optional;
            });
        }

        function getOptionalFields(isInstallingOS) {
            return _.filter(getFields(isInstallingOS), function(f) {
                return f.optional;
            });
        }

        function getFieldMap(fields) {
            return _.object(_.map(fields, function(item) {
                return [item.key, item];
            }));
        }

        function replaceAll(str, find, replace) {
            return str.replace(new RegExp(find, 'g'), replace);
        }

        function normalizeName(field) {
            // 1. remove whitespace at head and tail
            // 2. replace space and - with _
            // 3. lowercase
            var f = field.toLowerCase().trim();
            f = replaceAll(f, ' ', '_');
            return replaceAll(f, '-', '_');
        }

        function hasField(fieldMap, name) {
            // Need to check all of the aliases
            var v = _.values(fieldMap);
            for (var i = 0; i < v.length; i++) {
                var f = v[i];
                if (f.aliases) {
                    var found = _.find(f.aliases, function(alias) {
                        return alias === name;
                    });
                    if (found) {
                        return f;
                    }
                }
            }
            return undefined;
        }

        /***
         * Get field metadata including missing field and present field.
         */
        function getFieldMetadata(result, isInstallingOS) {
            var header = [];    // If there is no header, this is = to no fields be available
            if (result.data && result.data.length > 0) {
                header = result.data[0];
            }

            var allFields = getFields(isInstallingOS);  // Includes optional fields
            var reqFields = getRequiredFields(isInstallingOS);

            var indexes = {};
            // Start off assuming that all fields are missing
            var missingFields = getFieldMap(reqFields);
            // Go through all of the items in the header and see which fields we have
            _.each(header, function(field, index) {
                // Normalise the field name
                var name = normalizeName(field);
                var found = hasField(allFields, name);
                if (found) {
                    // Found one of the missing fields, so remove it
                    delete missingFields[found.key];
                    indexes[found.key] = index;
                }
            });

            // Keep the order of the fields as defined in the fields array
            var orderedMissingFields = _.filter(reqFields, function(f) {
                return missingFields.hasOwnProperty(f.key);
            });

            var columns = _.map(allFields, function(f) {
                return {
                    index: indexes[f.key],
                    field: f
                };
            });

            return {
                notFound: orderedMissingFields,
                columns: columns
            };
        }

        function validate(table) {
            // Go through all of the table and validate for uniqueness and formats

            // Store the valid values per field - we will use these for checking uniqueness as we go
            var valid = {};
            _.each(table.header, function(c) {
                valid[c.field.key] = {};
            });

            var validators = ValidatorsService.getValidatorFunctions();
            _.each(table.rows, function(row) {
                _.each(row.data, function(data, i) {
                    var columnField = table.header[i].field;
                    var colErr = false;

                    // Check required fields
                    if (!columnField.optional) {
                        if (!(data.value && data.value.length > 0)) {
                            colErr = 'requiredField';
                        }
                    }

                    if (!colErr && columnField.validator) {
                        var vFunction = validators[columnField.validator];
                        if (vFunction) {
                            var validation = vFunction(data.value);
                            if (!validation) {
                                colErr = columnField.validator;
                            } else {
                                // Validator can also modify the value (e.g. convert to uppercase)
                                if (validation.value) {
                                    data.value = validation.value;
                                }
                            }
                        }
                    }

                    if (!colErr && columnField.unique) {
                        // Column needs to be unique
                        if (valid[columnField.key][data.value]) {
                            colErr = 'notUniqueInFile';
                        } else {
                            // Check all of the servers in the current model (not the CSV file) as well
                            var exists = _.find(ardanaInstallationData.data['servers'], function(svr) {
                                return svr[columnField.key] === data.value;
                            });
                            if (exists) {
                                colErr = 'notUniqueInModel';
                            }
                        }
                    }

                    if (!colErr && columnField.restriction) {
                        if (!(columnField.optional && (!data.value || data.value.length === 0))) {
                            // Field is not optional and has a value
                            var found = _.find(ardanaInstallationData.data[columnField.restriction], function(r) {
                                return r.name.toUpperCase() === data.value.trim().toUpperCase();
                            });
                            if (found) {
                                data.value = found.name;
                            } else {
                                colErr = 'restriction-' + columnField.restriction;
                            }
                        }
                    }

                    if (colErr) {
                        data.error = colErr;
                        row.valid = false;
                    } else {
                        valid[columnField.key][data.value] = true; // Store this value in map for uniqueness checking
                    }
                });
            });
        }

        /**
         * Ensure we have a fully populated table with no gaps in the columns.
         * Layout of the columns should be in the order of the field definitions
         * and not the order in the CSV file.
         * @param {Object} results Input data
         * @param {Object} columns Column metadata
         * @returns {{}} Transformed table
         */

        function transformCSV(results, columns) {
            var table = {};
            table.header = columns;
            table.rows = [];
            var data = results.data;
            if (data.length > 2) {   // need at least one row (header is row 0)
                for (var i = 1; i < data.length; i++) {
                    var row = data[i];
                    var newRow = {};
                    newRow.valid = true;
                    newRow.data = [];
                    _.each(columns, function(c) {
                        if (angular.isDefined(c.index)) {
                            newRow.data.push({
                                value: row[c.index]
                            });
                        } else {
                            newRow.data.push({
                                value: ''
                            });
                        }
                    });
                    table.rows.push(newRow);
                }
            }
            validate(table);
            return table;
        }

        /**
         * Transform the table structure into an array containing an object for each valid item.
         * Use the correct keys from the column definitions when creating the objects in the table.
         * @param {Object} table Input table with header metadata and rows
         */
        function tableToArray(table) {
            var array = [];
            _.each(table.rows, function(row) {
                if (row.valid) {
                    var obj = {};
                    _.each(row.data, function(col, i) {
                        var columnDefn = table.header[i].field;
                        if (col.value && col.value.length > 0) {
                            obj[columnDefn.key] = col.value;
                        }
                    });
                    array.push(obj);
                }
            });
            return array;
        }

        /**
         * Parse local CSV File
         * @param {Object} file Loacl file object
         * @param {boolean} isInstallingOS Indicates if we are installing OS and thus need extra required fields
         * @returns (function) Promise for async CSV file parsing completion
         */
        function parse(file, isInstallingOS) {
            var deferred = $q.defer();
            PapaParse.parse(file, {
                skipEmptyLines: true,
                complete: function(results) {
                    // If there are any errors, then report them
                    if (results.errors.length > 0) {
                        deferred.reject({
                            parsed: false
                        });
                    } else {
                        // Read okay - check that we have the fields that we need
                        var result = getFieldMetadata(results, isInstallingOS);
                        if (result.notFound && result.notFound.length > 0) {
                            deferred.reject({
                                parsed: true,
                                notFound: result.notFound
                            });
                        } else {
                            // Transform CSV JSON into a table with all fields populated and in the order we want
                            try {
                                var table = transformCSV(results, result.columns);
                                deferred.resolve(table);
                            } catch (e) {
                                deferred.reject({
                                    parsed: false,
                                    error: e
                                });
                            }
                        }
                    }
                }
            });

            return deferred.promise;
        }
    }
})();
