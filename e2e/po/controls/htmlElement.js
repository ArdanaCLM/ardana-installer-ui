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

'use strict';

var HTMLElement = function(name_or_by_or_element) {
    if (typeof(name_or_by_or_element) === 'string') {
        this.by = by.name(this.name);
    } else {
        if (name_or_by_or_element && name_or_by_or_element.getWebElement) {
            this.element = name_or_by_or_element;
        } else {
            this.by = name_or_by_or_element;
        }
    }
};

HTMLElement.prototype.getElement = function() {
    return this.element ? this.element : element(this.by);
};

HTMLElement.prototype.hasClass = function(clsName) {
    return this.getElement().getAttribute('class').then(function(classes) {
        return classes.split(' ').indexOf(clsName) !== -1;
    });
};

module.exports = HTMLElement;
