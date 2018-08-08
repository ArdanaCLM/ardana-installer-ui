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
import { alphabetically } from '../utils/Sort.js';

class ServiceInfo extends Component {

  constructor() {
    super();
    this.state = {
      services: undefined
    };
  }

  componentWillMount() {
    fetchJson('/api/v1/clm/endpoints')
      .then(responseData => {
        this.setState({services: responseData});
      });
  }

  render() {
    let rows = [];
    if (this.state.services) {
      rows = this.state.services
        .sort((a,b) => alphabetically(a.name, b.name))
        .map((srv, idx) => {
          const regions = srv.endpoints.map(ep => {return ep.region;}).join('\n');
          const endpoints = srv.endpoints.map(ep => {
            // capitalize the interface before concat with the url
            const types = ep.interface.charAt(0).toUpperCase() + ep.interface.substr(1);
            return types + ' ' + ep.url;
          }).join('\n');

          return (
            <tr key={idx}>
              <td className='capitalize'>{srv.name}</td>
              <td>{srv.description}</td>
              <td className='line-break'>{endpoints}</td>
              <td className='line-break'>{regions}</td>
            </tr>
          );
        });
    }

    return (
      <div className='tab-content'>
        <div className='header'>{translate('services.info')}</div>
        <table className='table'>
          <thead>
            <tr>
              <th>{translate('services.name')}</th>
              <th>{translate('services.description')}</th>
              <th>{translate('services.endpoints')}</th>
              <th>{translate('services.regions')}</th>
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

export default ServiceInfo;
