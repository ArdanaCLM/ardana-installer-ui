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
import { getInternalModel } from './topology/TopologyUtils.js';
import { alphabetically } from '../utils/Sort.js';
import { LoadingMask } from '../components/LoadingMask.js';
import { ErrorMessage } from '../components/Messages.js';

class ServicesPerRole extends Component {

  constructor() {
    super();
    this.state = {
      model: undefined,
      error: undefined,
      showLoadingMask: false
    };
  }

  componentWillMount() {
    this.setState({showLoadingMask: true});
    getInternalModel()
      .then((yml) => {
        // Force a re-render if the page is still shown (user may navigate away while waiting)
        if (this.refs.services_per_role) {
          this.setState({model: yml, showLoadingMask: false});
        }
      })
      .catch((error) => {
        this.setState({
          error: {
            title: translate('default.error'),
            messages: [translate('services.services.per.role.unavailable')]
          },
          showLoadingMask: false
        });
      });
  }

  renderErrorMessage() {
    if (this.state.error) {
      return (
        <div className='notification-message-container'>
          <ErrorMessage
            closeAction={() => this.setState({error: undefined})}
            title={this.state.error.title}
            message={this.state.error.messages}>
          </ErrorMessage>
        </div>
      );
    }
  }

  render() {
    let sortedRoles =[];
    if (this.state.model) {
      let roles = [];
      this.state.model['internal']['servers'].map(server => {
        let serverServices = [];
        Object.keys(server.services).map(serviceName => {
          serverServices = serverServices.concat(server.services[serviceName]);
        });

        roles.push({
          serverRole: server.role,
          serverName: server.name,
          serverId: server.id,
          services: serverServices.sort().join(', ')
        });
      });
      roles.sort((a,b) => alphabetically(a.serverRole, b.serverRole)).map(role => {
        const foundIndex = sortedRoles.findIndex(r => r.serverRole === role.serverRole);
        if (foundIndex !== -1) {
          sortedRoles[foundIndex].serverName.push(role.serverName + ' (' + role.serverId + ')');
          sortedRoles[foundIndex].serverName.sort();
        } else {
          sortedRoles.push({
            serverRole: role.serverRole,
            serverName:[role.serverName + ' (' + role.serverId + ')'],
            services: role.services
          });
        }
      });
    }

    const rows = sortedRoles.map((role) => {
      return (
        <tr key={role.serverName}>
          <td>{role.serverRole}</td>
          <td className="line-break">{role.serverName.join('\n')}</td>
          <td>{role.services}</td>
        </tr>
      );
    });

    return (
      <div ref='services_per_role'>
        {this.renderErrorMessage()}
        <LoadingMask show={this.state.showLoadingMask}></LoadingMask>
        <div className='menu-tab-content'>
          <div className='header'>{translate('services.services.per.role')}</div>
          <table className='table'>
            <thead>
              <tr>
                <th width="20%">{translate('role')}</th>
                <th width="35%">{translate('servers')}</th>
                <th width="50%">{translate('services')}</th>
              </tr>
            </thead>
            <tbody>
              {rows}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default ServicesPerRole;
