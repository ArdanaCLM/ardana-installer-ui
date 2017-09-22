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

var HTMLElement = require('./htmlElement');

// TODO: Move into a base Element PO
function hasClass(element, clsName) {
    return element.getAttribute('class').then(function(classes) {
        return classes.split(' ').indexOf(clsName) !== -1;
    });
}

var NumericField = function(id) {
    this.id = id;
};

// Inherit from HTMLElement
NumericField.prototype = new HTMLElement();


NumericField.prototype.getElement = function() {
    if (typeof(this.id) === 'string') {
        return element(by.name(this.id));
    } else {
        return element(this.id);
    }
};


NumericField.prototype.getValue = function() {
    expect(this.getElement().getAttribute('type')).toBe('number');
    return this.getElement().getAttribute('value').then(function(v) {
        return parseInt(v);
    });
};

NumericField.prototype.increment = function() {
    var incBtn = element(by.css('[for="' + this.id + '"] .numeric-input-plus'));
    incBtn.click();
};

NumericField.prototype.decrement = function() {
    var decBtn = element(by.css('[for="' + this.id + '"] .numeric-input-minus'));
    decBtn.click();
};

NumericField.prototype.isValid = function() {
    return hasClass(this.getElement(), 'ng-valid');
};

module.exports = NumericField;
