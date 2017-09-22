/**
 * (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
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

    var validators = {

        /**
         * Valid IPv4 Address
         * @example: 192.168.10.3

         ```html
         <input name="ip" type="text" ng-model="data.ip_address" ardana-valid-ip-address />
         ```
         */
        ardanaValidIpAddress:
            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,

        /**
         * TODO(esp) This is named incorrectly, it should be named ardanaValidIpCidr but there are a bunch of
         * places that will need to be fixed, including tests!
         *
         * Valid IP range
         * @example: 10.1.1.0/24

         ```html
         <input name="ip-range" type="text" ng-model="data.ip_range" ardana-valid-ip-range />
         ```
         */
        //TODO: RC TEST
        ardanaValidIpRange: new RegExp([
            '^(?:',
            '(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
            '\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
            '\\/(([0-9]|[12][0-9]|3[0-2]))$'
        ].join('')),
        //,

        /**
         * Valid Mac Address
         *
         * @example: b2:72:8d:ac:7c:6f
         ```html
         <input name="mac" type="text" ng-model="data.mac_address" ardana-valid-mac-address />
         ```
         */

        ardanaValidMacAddress: /^(([A-Fa-f0-9]{2}[:]){5}[A-Fa-f0-9]{2})$/,

        /**
         * Valid name
         *
         * @example: controller1, interface_set_controller
         * ```html
         *   <input name="server_name" type="text" ng-model="data.server_name" ardana-valid-name />
         * ```
         */
        ardanaValidName: /^[A-z]+[A-z0-9_\-]*$/,

        /**
         * Valid Integer
         *
         * @example:
         ```html
         <input name="integer" type="text" ng-model="data.integer" ardana-integer />
         ```
         */
        ardanaInteger: /^\d+$/,

        ardanaValidIpAddressOpenBounds: function(modelValue, viewValue) {
            return !/.*\.(255|0)$/.test(viewValue);
        },

        /**
         * Valid hostname per RFC-1123.
         */
        ardanaValidHostname: function(modelValue, viewValue) {
            // Valid hostnames are specified in RFC-1123, which references and extends RFC-1034
            // and RFC-952. At the time RFC-1123 was written, top-level domains (TLDs) were required
            // to adhere to RFC-920, which only defined alphabetic characters.  As such, RFC-1123
            // section 2.1 specifies that the "highest-lovel component label" (e.g. the TLD) will
            // be alphabetic and therefore "can never have the dotted-decimal form #.#.#.#" and
            // so cannot be confused with a numeric IP address.
            //
            // Note that domain names rules have since been relaxed by ICANN and internationalized
            // domain names (IDNA) with unicode are permitted in some contexts, but these are not
            // valid host names.  RFC-3492 defines an encoding convention called Punycode that
            // maps these unicode names into valid hostnames per RFC-1123, using hyphens and digits.
            //
            // We will relax the constraint on alphabetic-only characters in the TLD in order
            // to support RFC-3492-encoded labels in the top-level domain, but we will still
            // require at least one alphabetic character to retain the property of never being
            // confused with a numeric IP address.
            //
            // Therefore the constraints that will imposed are:
            // Overall:
            // - the max length of a hostname is 255 characters (RFC-1123 section 2.1)
            // Hostname is a group of "labels" concatenated with dots.  Each label:
            //  - must only have the characters A-Z (case insensitive), 0-9, and hyphen (RFC-952 ASSUMPTIONS)
            //  - cannot start or end with a hyphen (RFC-1034, section 3.5)
            //  - must be between 1 and 63 chararacters (RFC-1034, section 3.5)
            //  - must contain the characters A-Z if it is the top-level demain (see above)

            if (viewValue.length > 255) {
                return false;
            }

            var labels = viewValue.split('.');

            var label_pattern = /^[A-Z0-9](([A-Z0-9\-]){0,61}[A-Z0-9])?$/i;
            for (var index = 0; index < labels.length; ++index) {
                // Verify that each label matches the above criteria
                if (! label_pattern.test(labels[index])) {
                    return false;
                }

            }

            // Verify that if a TLD is present (the last label when there are more than one), it
            // contains an alphabetic character
            if (labels.length > 1) {
                var tld = labels[labels.length - 1];
                var char_pattern = /[A-Z]/i;
                if (! char_pattern.test(tld)) {
                    return false;
                }
            }

            return true;
        },

        ardanaValidIpAddressOrHostname: function(modelValue, viewValue) {
            return validators.ardanaValidIpAddress.test(viewValue) || validators.ardanaValidHostname(modelValue, viewValue);
        },

        /**
         * Validate PCI Address
         *
         * samples:
         * 0000:08:00.1
         * 0000:00:1a.0
         * 0000:0f:0b.2
         * ffff:ff:1f.7
         * pci@0000:0f:0e.0
         *
         * @example
         ```html
         <input name="nicmap_eth0" class="control-input" type="text" ardana-pci-address />
         ```
         */
        ardanaPciAddress: /^((pci@)?[0-9a-f]{4}):([0-9a-f]{2}):[0-9a-f]{2}\.[0-7]+$/

    };

    var module = angular.module('dayzero');

    var validatorFunctions = {};
    _.each(validators, function(validatorRegExp, validatorName) {
        var tester = validatorRegExp;
        if (!angular.isFunction(tester)) {
            tester = function(modelValue, viewValue) {
                return validatorRegExp.test(viewValue);
            };
        }
        validatorFunctions[validatorName] = function(value) {
            return tester(null, value);
        };
    });

    /// Create a service to allow other UI Components to access the validators
    module.factory('ValidatorsService', validatorsService);
    function validatorsService() {
        return {
            getValidatorFunctions: function() {
                return validatorFunctions;
            }
        };
    };

    for (var validatorName in validators) {
        module.directive(validatorName, createDirecive(validatorName, validators[validatorName]));
    }

    function createDirecive(validatorName, validatorRegExp) {
        return directive;

        function directive() {
            return {
                link: link,
                require: 'ngModel',
                restrict: 'A'
            };

            function link(scope, element, attrs, ngModelController) {
                var tester = validatorRegExp;
                if (!angular.isFunction(tester)) {
                    tester = function(modelValue, viewValue) {
                        return validatorRegExp.test(viewValue);
                    };
                }

                ngModelController.$validators[validatorName] = validator;

                function validator(modelValue, viewValue) {
                    return ngModelController.$isEmpty(modelValue) || tester(modelValue, viewValue);
                }
            }
        }
    }

})();
