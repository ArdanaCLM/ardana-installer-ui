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
import ServicesPerRole from '../pages/ServicesPerRole';
import { SpeedometerTest } from '../pages/SpeedometerTest';

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

/**
 * Define all fixed entries on the navigation menu
 */
export const routes = [
  { name: translate('services'), slug: '/services', component: Example,
    items: [
      { name: translate('packages'), slug: '/services/packages', component: Example },
      { name: translate('configure'), slug: '/services/configure', component: Example },
      { name: translate('roles'), slug: '/services/roles', component: ServicesPerRole },
    ]
  },
  { name: translate('topology'), slug: '/topology', component: Example,
    items: [
      { name: translate('services'), slug: '/topology/services', component: Example },
      { name: translate('regions'), slug: '/topology/regions', component: Example },
      { name: translate('networks'), slug: '/topology/networks', component: Example },
      { name: translate('servers'), slug: '/topology/servers', component: Example },
      { name: translate('server_groups'), slug: '/topology/server-groups', component: Example },
    ]
  },
  { name: translate('servers'), slug: '/servers', component: Example,
    items: [
      { name: translate('add_server'), slug: '/servers/add-server', component: Example },
    ]
  },
  // Avoid the hassle of creating translations for this disposable code:
  { name: 'Example', slug: '/example', component: Example,
    items: [
      { name: 'Speedometer', slug: '/example/speedometer', component: SpeedometerTest },
    ]
  }
];
