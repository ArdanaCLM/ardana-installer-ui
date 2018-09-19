// (c) Copyright 2018 SUSE LLC
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
import OpenStackPackages from '../pages/OpenStackPackages';
import ArdanaPackages from '../pages/ArdanaPackages';
import ServiceConfiguration from '../pages/ServiceConfiguration';
import ServicesPerRole from '../pages/ServicesPerRole';
import { SpeedometerTest } from '../pages/SpeedometerTest';
import { AlarmDonutTest } from '../pages/AlarmDonutTest';
import AddServers from '../pages/AddServers.js';
import { AddServersPages } from '../pages/AddServers/AddServersPages.js';
import UpdateServers from '../pages/UpdateServers.js';
import { UpdateServerPages } from '../pages/ReplaceServer/UpdateServerPages.js';
import InstallWizard from '../InstallWizard.js';
import ControlPlanes from '../pages/topology/ControlPlanes.js';
import Regions from '../pages/topology/Regions.js';
import Services from '../pages/topology/Services.js';
import Network from '../pages/topology/Networks.js';
import ServerGroups from '../pages/topology/ServerGroups.js';
import ServerRoles from '../pages/topology/ServerRoles.js';
import { isProduction } from './ConfigHelper.js';

// TODO: Remove this after implementing the *real* content. (It is just a placeholder for now)
class Example extends Component {

  render() {
    const foo = this.props.match.path;
    // use an inline style to avoid polluting css with entries for this disposable Example
    const style = {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column'
    };

    return (
      <div style={style}>
        <h3>Content</h3>
        <div>Example: {foo}</div>
      </div>
    );
  }
}

class ServerSummary extends  Component {
  render() {
    return(
      <InstallWizard pageSet={UpdateServerPages} menuComponent={UpdateServers} menuName='/servers/server-summary'/>
    );
  }
}

class AddServersPage extends  Component {
  render() {
    return(
      <InstallWizard pageSet={AddServersPages} menuComponent={AddServers} menuName='/servers/add-server'/>
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
      { name: translate('packages.openstack'), slug: '/services/openstack-packages', component: OpenStackPackages },
      { name: translate('packages.ardana'), slug: '/services/openstack-ardana', component: ArdanaPackages },
      { name: translate('configuration'), slug: '/services/configuration', component: ServiceConfiguration },
      { name: translate('roles'), slug: '/services/roles', component: ServicesPerRole },
    ]
  },
  { name: translate('topology'), slug: '/topology',
    items: [
      { name: translate('control_planes'), slug: '/topology/control_planes', component: ControlPlanes },
      { name: translate('regions'), slug: '/topology/regions', component: Regions },
      { name: translate('services'), slug: '/topology/services', component: Services },
      { name: translate('networks'), slug: '/topology/networks', component: Network },
      { name: translate('server_groups'), slug: '/topology/server-groups', component: ServerGroups },
      { name: translate('roles'), slug: '/topology/roles', component: ServerRoles },
    ]
  },
  { name: translate('servers'), slug: '/servers',
    items: [
      { name: translate('common.summary'), slug: '/servers/server-summary', component: ServerSummary },
      { name: translate('add_server'), slug: '/servers/add-server', component: AddServersPage, unfinished: true}
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
