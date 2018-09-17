// (c) Copyright 2017-2018 SUSE LLC
/**
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
**/
/* eslint no-undef: 0 */
describe('basic sanity tests', function() {

  beforeAll(function() {
    browser.get('localhost:2209?installreset=true');
    browser.sleep(1000);
  });

  it('loads the app', function() {
    expect(browser.getTitle()).toEqual('SUSE OpenStack Cloud Deployer');
  });

  it('has the first step selected by default', function() {
    var stateLineWrapperContainer = element(by.css('.wizard-progress-container'));
    var firstIndicator = stateLineWrapperContainer.all(by.css('.progress')).first();

    expect(firstIndicator.getCssValue('background-color')).toEqual('rgba(0, 192, 129, 1)');//the rgba value of #00C081
  });

  it('advances to the next page and updates the indicator', function() {
    var stateLineWrapperContainer = element(by.css('.wizard-progress-container'));
    var firstIndicator = stateLineWrapperContainer.all(by.css('.progress')).first();
    var lastIndicator = stateLineWrapperContainer.all(by.css('.progress')).last();

    //the first indicator is the correct "in-progress" color
    expect(firstIndicator.getCssValue('background-color')).toEqual('rgba(0, 192, 129, 1)');//the rgba value of #00C081

    var nextButton = element(by.xpath('.//Button[.="Next"]'));
    nextButton.click();
    //the first indicator has updated to the "complete" color
    expect(firstIndicator.getCssValue('background-color')).toEqual('rgba(0, 192, 129, 1)');//the rgba value of #00C081
    //the last indicator has a "notdone" color
    expect(lastIndicator.getCssValue('background-color')).toEqual('rgba(106, 114, 118, 1)');//the rgba value of #6a7276
  });
});
