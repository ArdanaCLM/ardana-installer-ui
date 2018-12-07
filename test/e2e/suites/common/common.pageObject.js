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
var commonObjects = function() {

  this.username     = element(by.css('input[type="text"]'));
  this.password     = element(by.css('input[type="password"]'));
  this.login        = element(by.css('button[type="submit"]'));
  this.logout       = element(by.css('i.logout-btn'));
  this.nextButton   = element(by.xpath('.//Button[.="Next"]'));
  this.backButton   = element(by.xpath('.//Button[.="Back"]'));

  this.stateLineWrapperContainer = element(by.css('.wizard-progress-container'));
  this.firstIndicator   = this.stateLineWrapperContainer.all(by.css('.progress')).first();
  this.lastIndicator    = this.stateLineWrapperContainer.all(by.css('.progress')).last();

  this.headerTitle = element(by.css('aside > header'));
  this.spinner = $('.spinners-container');
  this.loading = $('.spinners-container details-modal-mask');
  this.errorModal = $('Error');

  this.toggle = $('.btn-toggle');
  this.adminConsoleSideBar = $('.main-menu');
  this.pageHeader = $('.heading');

  this.pickerContainer = $('.picker-container');
  this.detailsContainer = $('.details-container');
  this.footerContainer = $('.btn-row.footer-container');
  this.buttonsAll = $$('.btn-row.footer-container');

  this.pickerContainerElements = function() {
   $$('.picker-container').each(function(element, index) {
   // Will print 0 First, 1 Second, 2 Third.
     element.getText().then(function (text) {
     console.log(text);
    });
   });
  };

  //Services page common web elements
  this.information                  = element(by.xpath('//a[text()= "Information"]'));
  this.openStackPackages            = element(by.xpath('//a[text()= "OpenStack Packages"]'));
  this.suseOpenStackCloudPackages   = element(by.xpath('//a[text()= "SUSE OpenStack Cloud Packages"]'));
  this.configuration                = element(by.xpath('//a[text()= "Configuration"]'));
  this.roles                        = element(by.xpath('//a[text()= "Roles"]'));

 };

module.exports = commonObjects;