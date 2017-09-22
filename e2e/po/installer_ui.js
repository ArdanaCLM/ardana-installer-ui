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


var config = require('../e2e.conf');

var InstallerUI = function() {};

function nextButton() {
    return element(by.id('nextButton'));
}

function previousButton() {
    return element(by.id('prevButton'));
}

function installOSButton() {
    return element(by.id('installOsButton'));
}

InstallerUI.prototype.load = function() {
    browser.get(config.UI_HOST);
};

InstallerUI.prototype.next = function() {
    this.nextButton().click();
};

InstallerUI.prototype.previous = function() {
    this.previousButton().click();
};

InstallerUI.prototype.nextEnabled = function() {
    return this.nextButton().isEnabled();
};

InstallerUI.prototype.previousEnabled = function() {
    return this.previousButton().isEnabled();
};

InstallerUI.prototype.installOS = function() {
    this.installOSButton().click();
};

InstallerUI.prototype.installOSEnabled = function() {
    return this.installOSButton().isEnabled();
};

InstallerUI.prototype.getSectionTitle = function() {
    var sections = element.all(by.css('.section-header')).filter(function(e) {
        return e.isDisplayed();
    });
    return sections.get(0).getText();
};

module.exports = InstallerUI;
