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
import { fetchJson } from '../utils/RestUtils.js';

class ServicesPerRole extends Component {

  constructor() {
    super();
    this.state = {
      model: undefined
    };
  }

  componentWillMount() {
    fetchJson('/api/v1/clm/model')
      .then(responseData => {
        this.setState({'model': responseData.inputModel});
      });
  }

  render() {
    let roles = [];
    if (this.state.model) {
      this.state.model['control-planes'].map(controlPlane => {
        const commonServices = controlPlane['common-service-components'];
        controlPlane.clusters.map(cluster => {
          const combinedServices = commonServices.concat(cluster['service-components']);
          roles.push({serverRole: cluster['server-role'], services: combinedServices.sort()});
        });
        controlPlane.resources.map(resource => {
          const combinedServices = commonServices.concat(resource['service-components']);
          roles.push({serverRole: resource['server-role'], services: combinedServices.sort()});
        });
      });
      this.state.model['servers'].map(server => {
        const foundIndex = roles.findIndex(s => s.serverRole === server.role);
        if (foundIndex !== -1) {
          if (roles[foundIndex].ids) {
            roles[foundIndex].ids.push(server.id);
          } else {
            roles[foundIndex].ids = [server.id];
          }
        }
      });
    }

    const rows = roles.map((role, idx) => {
      return (
        <tr key={idx}>
          <td>{role.serverRole}</td>
          <td className="line-break">{(role.ids) ? role.ids.join('\n') : '-'}</td>
          <td>{role.services.join(', ')}</td>
        </tr>
      );
    });

    return (
      <div className='menu-tab-content'>
        <div className='header'>{translate('services.services.per.role')}</div>
        <table className='table'>
          <thead>
            <tr>
              <th width="20%">{translate('services.role')}</th>
              <th width="35%">{translate('servers')}</th>
              <th width="50%">{translate('services')}</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    );
  }
}

export default ServicesPerRole;
