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
import { fromJS } from 'immutable';
import { fetchJson } from '../utils/RestUtils.js';

class ServicesPerRole extends Component {

  constructor(props) {
    super(props);
    this.state = {
      model: undefined
    };
  }

  componentWillMount() {
    fetchJson('/api/v1/clm/model')
      .then(responseData => {
        this.setState({'model': fromJS(responseData)});
      });
  }

  render() {
    let roles = [];
    if (this.state.model) {
      this.state.model.getIn(['inputModel', 'control-planes'])
        .map(controlPlane => {
          const commonServices = controlPlane.get('common-service-components');
          controlPlane.get('clusters')
            .map(cluster => {
              const combinedServices = commonServices.concat(cluster.get('service-components'));
              roles.push({serverRole: cluster.get('server-role'), services: combinedServices.sort().toJS()});
            });
          controlPlane.get('resources')
            .map(resource => {
              const combinedServices = commonServices.concat(resource.get('service-components'));
              roles.push({serverRole: resource.get('server-role'), services: combinedServices.sort().toJS()});
            });
        });
      this.state.model.getIn(['inputModel', 'servers'])
        .map(server => {
          const role = server.get('role');
          const foundIndex = roles.findIndex(s => s.serverRole === role);
          if (foundIndex !== -1) {
            if (roles[foundIndex].ids) {
              roles[foundIndex].ids.push(server.get('id'));
            } else {
              roles[foundIndex].ids = [server.get('id')];
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
      <div className='tab-content'>
        <div className='header'>{translate('services.services.per.role')}</div>
        <table className='table'>
          <thead>
            <tr>
              <th width="20%">{translate('roles')}</th>
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
