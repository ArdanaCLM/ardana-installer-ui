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
import { alphabetically } from '../utils/Sort.js';
import { fetchJson } from '../utils/RestUtils.js';
import { LoadingMask } from '../components/LoadingMask.js';
import { ErrorMessage } from '../components/Messages.js';

class OpenStackPackages extends Component {

  constructor() {
    super();
    this.state = {
      packages: undefined,
      error: undefined,
      showLoadingMask: false
    };
  }

  componentWillMount() {
    this.setState({showLoadingMask: true});
    fetchJson('/api/v1/clm/packages/openstack')
      .then(responseData => {
        this.setState({packages: responseData, showLoadingMask: false});
      })
      .catch((error) => {
        this.setState({
          error: {
            title: translate('default.error'),
            messages: [translate('services.package.unavailable')]
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
    let rows = [];
    if (this.state.packages) {
      rows = this.state.packages
        .sort((a,b) => alphabetically(a.name, b.name))
        .map((pkg) => {
          return (
            <tr key={pkg.name}>
              <td className='capitalize'>{pkg.name}</td>
              <td>{pkg.installed.join(', ')}</td>
              <td>{pkg.available}</td>
            </tr>
          );
        });
    }

    return (
      <div>
        {this.renderErrorMessage()}
        <LoadingMask show={this.state.showLoadingMask}></LoadingMask>
        <div className='menu-tab-content'>
          <div className='header'>{translate('packages.openstack')}</div>
          <table className='table'>
            <thead>
              <tr>
                <th>{translate('name')}</th>
                <th>{translate('services.installed.version')}</th>
                <th>{translate('services.available.version')}</th>
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

export default OpenStackPackages;
