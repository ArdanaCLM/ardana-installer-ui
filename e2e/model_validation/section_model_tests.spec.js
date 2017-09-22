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

var _ = require('lodash');
var wrench = require('wrench');
var path = require('path');
var needle = require('needle');
var Q = require('q');
var fs = require('fs');

var config = require('ardana-service/config');
var installer = require('./../po/index');

// patch config
var modelDir = path.join(__dirname, '..', 'testdata', 'openstack', 'my_cloud', 'definition');
config.set('paths:cloudDir', modelDir);
config.set('paths:servicesPath', path.join(__dirname, '..', 'testdata', 'services'));

var WebSocketServer = require('ardana-service/lib/websocket-server');
var CurrentInputModel = require('ardana-service/lib/current-input-model');
var processManager = require('ardana-service/lib/process-manager');
processManager.init(config, WebSocketServer);

var thisSection = installer.sections['Cloud needs'];
var templatesNames = _.pull(fs.readdirSync(path.join(__dirname, '..', 'testdata', 'examples')),
    '.gitignore', 'examples');

var needlePostQ = Q.denodeify(needle.post);
var options = {
    open_timeout: 120000
};

describe('Ardana installer', function() {

    beforeEach(function() {
        wrench.rmdirSyncRecursive(config.get('paths:cloudDir'));
        fs.mkdirSync(config.get('paths:cloudDir'));
        installer.load();
        installer.next();
    });

    describe('Section: Cloud needs', function() {

        var handleTemplate = function(templateName) {
            // For each template run through to the "Deploy screen"
            thisSection.getOption(templateName).click();
            installer.next(); // At OS Install
            installer.sections['Install OS'].getOptions().get(1).click(); // Select option 2
            installer.next(); // Identify Servers
            installer.next();  // Configure networks
            installer.next();  // Review server roles
            installer.next();// Ready to Deploy

            var sections = element.all(by.css('.section-header')).filter(function(e) {
                return e.isDisplayed();
            });
            expect(sections.get(0).getText()).toBe('Ready to deploy!');

            var deployBtn = element(by.buttonText('Deploy'));
            expect(deployBtn.isPresent()).toBe(true);
            expect(deployBtn.isEnabled()).toBe(true);
            deployBtn.click();
            browser.driver.sleep(1000);
            CurrentInputModel.init(config, WebSocketServer);

        };

        templatesNames.forEach(function(templateName) {
            it('should validate ' + templateName, function(done) {
                browser.controlFlow().execute(_.partial(handleTemplate, templateName))
                    .then(function() {
                        return needlePostQ('localhost:3000/dayzeroapi/config_processor', '', options);
                    })
                    // .then(configProcessor.get)
                    .then(function(response) {
                        expect(response[0].statusCode).toEqual(201);
                        done();
                    }, function(err) {
                        expect(err).not.toBeDefined();
                        done(err);
                    });
            });
        });
    });
});
