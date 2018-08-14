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
import { PlaybookProgress } from '../components/PlaybookProcess.js';

class ServiceInfo extends Component {

  constructor() {
    super();
    this.state = {
      services: undefined,
      showModal: false,
      playbooks: [],
      steps: [],
      selectedService: ''
    };
  }

  componentWillMount() {
    fetchJson('/api/v1/clm/endpoints')
      .then(responseData => {
        this.setState({services: responseData});
      });
  }

  renderActionMenuIcon = (service) => {
    return (
      <span onClick={(event) => this.runStatusPlaybook(event, service)}>
        <i className='material-icons'>more_horiz</i>
      </span>
    );
  }

  runStatusPlaybook = (event, service) => {
    const playbookName = service + '-status';
    this.setState({
      showModal: true,
      playbooks: [playbookName],
      steps: [{label: 'status', playbooks: [playbookName + '.yml']}],
      selectedService: service[0].toUpperCase() + service.substr(1)
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
            const types = ep.interface[0].toUpperCase() + ep.interface.substr(1);
            return types + ' ' + ep.url;
          }).join('\n');

          return (
            <tr key={idx}>
              <td className='capitalize'>{srv.name}</td>
              <td>{srv.description}</td>
              <td className='line-break'>{endpoints}</td>
              <td className='line-break'>{regions}</td>
              <td>{this.renderActionMenuIcon(srv.name)}</td>
            </tr>
          );
        });
    }

    let statusModal;
    if (this.state.showModal) {
      statusModal = (
        <PlaybookProgress steps={this.state.steps} playbooks={this.state.playbooks}
          updatePageStatus={() => {}} modalMode={true} showModal={this.state.showModal}
          onHide={() => this.setState({showModal: false})}
          selectedService={this.state.selectedService}/>
      );
    }

    return (
      <div>
        {statusModal}
        <div className='menu-tab-content'>
          <div className='header'>{translate('services.info')}</div>
          <table className='table'>
            <thead>
              <tr>
                <th>{translate('services.name')}</th>
                <th>{translate('services.description')}</th>
                <th>{translate('services.endpoints')}</th>
                <th>{translate('services.regions')}</th>
                <th width="3em"></th>
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

export default ServiceInfo;
