// (c) Copyright 2018-2019 SUSE LLC
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

import React, { Component } from 'react';
import { translate } from '../localization/localize.js';
import ServiceInfo from '../pages/ServiceInfo';
import ArdanaPackages from '../pages/ArdanaPackages';
import ServiceConfiguration from '../pages/ServiceConfiguration';
import ServicesPerRole from '../pages/ServicesPerRole';
import { SpeedometerTest } from '../pages/SpeedometerTest';
import { AlarmDonutTest } from '../pages/AlarmDonutTest';
import AddServers from '../pages/AddServers.js';
import { AddServersPages } from '../pages/AddServers/AddServersPages.js';
import UpdateServers from '../pages/UpdateServers.js';
import UpdateServerPages from '../pages/UpdateServerPages';
import UpdateWizard from '../UpdateWizard.js';
import ControlPlanes from '../pages/topology/ControlPlanes.js';
import Regions from '../pages/topology/Regions.js';
import Services from '../pages/topology/Services.js';
import Network from '../pages/topology/Networks.js';
import Servers from '../pages/topology/Servers.js';
import ServerRoles from '../pages/topology/ServerRoles.js';
/*
import ModelConfiguration from '../pages/ModelConfiguration';
*/
import { isProduction } from './ConfigHelper.js';

class ServerSummary extends  Component {
  render() {
    return(
      <UpdateWizard pageSet={UpdateServerPages} menuComponent={UpdateServers} menuName='/servers/server-summary'/>
    );
  }
}

class AddServersPage extends  Component {
  render() {
    return(
      <UpdateWizard pageSet={AddServersPages} menuComponent={AddServers} menuName='/servers/add-server'/>
    );
  }
}

/**
 * Define all fixed entries on the navigation menu
 */
export const routes = [
  { name: translate('services'), slug: '/services',
    items: [
      { name: translate('information'), slug: '/services/info', component: ServiceInfo },
      { name: translate('packages.ardana'), slug: '/services/packages', component: ArdanaPackages },
      { name: translate('configuration'), slug: '/services/configuration', component: ServiceConfiguration },
      /*
      { name: translate('model'), slug: '/services/model', component: ModelConfiguration },
      */
      { name: translate('roles'), slug: '/services/roles', component: ServicesPerRole },
    ]
  },
  { name: translate('topology'), slug: '/topology',
    items: [
      { name: translate('control_planes'), slug: '/topology/control_planes', component: ControlPlanes },
      { name: translate('regions'), slug: '/topology/regions', component: Regions },
      { name: translate('services'), slug: '/topology/services', component: Services },
      { name: translate('networks'), slug: '/topology/networks', component: Network },
      { name: translate('servers'), slug: '/topology/servers', component: Servers },
      { name: translate('roles'), slug: '/topology/roles', component: ServerRoles },
    ]
  },
  { name: translate('servers'), slug: '/servers',
    items: [
      { name: translate('common.summary'), slug: '/servers/server-summary', component: ServerSummary },
      { name: translate('add_server'), slug: '/servers/add-server', component: AddServersPage }
    ]
  }
];

if(!isProduction()) {
  routes.push(
    // Avoid the hassle of creating translations for this disposable code:
    { name: 'Example', slug: '/example',
      items: [
        { name: 'Speedometer', slug: '/example/speedometer', component: SpeedometerTest },
        { name: 'Alarm Donut', slug: '/example/alarmdonut', component: AlarmDonutTest },
      ]
    });
}
