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

    var defaultConfig = {
        btn: {
            add: 'Add',
            edit: 'Edit',
            del: 'Delete'
        },
        drawer: {
            addTitle: 'Add Item',
            editTitle: 'Edit Item',
            cancelLabel: 'Cancel',
            commitLabel: 'Save'
        },
        deleteConfig: {
            confirmNo: 'installer.btn.cancel',
            confirmYes: 'installer.btn.remove',
            message: 'Are you sure you want to delete this item?',
            title: 'Delete item'
        }
    };

    angular
        .module('dayzero')
        .constant('defaultConfig', defaultConfig)
        .filter('blankPlaceholder', blankPlaceholder)
        .filter('multiKey', multiKey)
        .filter('multiValue', multiValue);

    multiKey.$inject = ['$parse'];
    multiValue.$inject = ['$parse'];

    function blankPlaceholder() {
        return function(item) {
            if (angular.isUndefined(item) || item === null || item === '') {
                return '--';
            } else {
                return item;
            }
        };
    }

    /**
     * Correctly display multi-key values in table. The
     * delimiter is a whitespace by default but can
     * be specified.
     */
    function multiKey($parse) {
        return function(item, key, separator) {
            if (angular.isArray(key)) {
                var sep = separator || ' ';
                var values = [];
                angular.forEach(key, function(k) {
                    if (item[k]) {
                        values.push(item[k]);
                    }
                });
                return values.length ? values.join(sep) : '';
            } else {
                return item[key];
            }
        };
    }

    /**
     * Correctly display multi values in table. The
     * delimiter is a comma by default but can be
     * specified.
     */
    function multiValue($parse) {
        return function(row, arrayKey, key, separator) {
            if (arrayKey) {
                var items = $parse(arrayKey)(row) || [];
                var sep = separator || ', ';

                var value = items.map(function(item) {
                        return key ? item[key] : item;
                    })
                    .filter(function(item) {
                        return item;
                    })
                    .join(sep);

                return value;
            } else {
                return $parse(key)(row);
            }
        };
    }

})();
