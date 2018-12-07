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
var CommonObjects = require('../../common/common.pageObject.js');

var AdminConsoleServices = function() {
  var commonObjects = new CommonObjects();

  //services side menu item
  var services = element(by.xpath('//a[text()= "Services"]'));

  //various tabs on services page
  this.information                  = element(by.xpath('//a[text()= "Information"]'));
  this.openStackPackages            = element(by.xpath('//a[text()= "OpenStack Packages"]'));
  this.suseOpenStackCloudPackages   = element(by.xpath('//a[text()= "SUSE OpenStack Cloud Packages"]'));
  this.configuration                = element(by.xpath('//a[text()= "Configuration"]'));
  this.roles                        = element(by.xpath('//a[text()= "Roles"]'));

  //details from Service Information
  //var moreDetails = use $$ for tbody tr .material-icons
  var contextMenu = element(by.css('.context-menu-container .menu-item'));

  this.getAllSideBarMenuItems = function() {
     var allSideBarMenuItems = element.all(commonObjects.adminConsoleSideBar).count();
     console.log(allSideBarMenuItems);
     //return this.allSideBarMenuItems;
  };

  this.getColor = function(){
    return this.firstIndicator.getCssValue('background-color');
  };

 };

module.exports = AdminConsoleServices;