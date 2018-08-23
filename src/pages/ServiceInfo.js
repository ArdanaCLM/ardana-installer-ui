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
import { LoadingMask } from '../components/LoadingMask.js';
import ContextMenu from '../components/ContextMenu.js';

class ServiceInfo extends Component {

  constructor() {
    super();
    this.state = {
      services: undefined,
      showActionMenu: false,
      showDetailsModal: false,
      showRunStatusPlaybookModal: false,
      playbooks: [],
      steps: [],
      selectedService: '',
      showLoadingMask: false,
      menuLocation: undefined
    };
  }

  componentWillMount() {
    this.setState({showLoadingMask: true});
    fetchJson('/api/v1/clm/endpoints')
      .then(responseData => {
        this.setState({services: responseData, showLoadingMask: false});
      });
  }

  renderActionMenuIcon = (service) => {
    return (
      <span onClick={(event) => this.handleActionMenu(event, service)}>
        <i className='material-icons'>more_horiz</i>
      </span>
    );
  }

  handleActionMenu = (event, service) => {
    this.setState({
      showActionMenu: true,
      selectedService: service,
      menuLocation: {x: event.pageX, y: event.pageY}
    });
  }

  showDetailsModal = () => {
    this.setState({showActionMenu: false});
  }

  showRunStatusPlaybookModal = () => {
    const playbookName = this.state.selectedService + '-status';
    this.setState({
      showActionMenu: false,
      showRunStatusPlaybookModal: true,
      playbooks: [playbookName],
      steps: [{label: 'status', playbooks: [playbookName + '.yml']}],
    });
  }

  renderMenuItems = () => {
    const menuItems = [
      {show: true, key: 'common.details', handleShowModal: this.showDetailsModal},
      {show: true, key: 'services.run.status', handleShowModal: this.showRunStatusPlaybookModal},
    ];
    return (
      <ContextMenu show={this.state.showActionMenu} items={menuItems} location={this.state.menuLocation}
        close={() => this.setState({showActionMenu: false})}/>
    );
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
    if (this.state.showRunStatusPlaybookModal) {
      const serviceName = this.state.selectedService[0].toUpperCase() + this.state.selectedService.substr(1);
      statusModal = (
        <PlaybookProgress steps={this.state.steps} playbooks={this.state.playbooks}
          updatePageStatus={() => {}} modalMode showModal={this.state.showRunStatusPlaybookModal}
          onHide={() => this.setState({showRunStatusPlaybookModal: false})} serviceName={serviceName}/>
      );
    }

    return (
      <div>
        {statusModal}
        <LoadingMask show={this.state.showLoadingMask}></LoadingMask>
        <div className='menu-tab-content'>
          <div className='header'>{translate('services.info')}</div>
          <table className='table'>
            <thead>
              <tr>
                <th>{translate('name')}</th>
                <th>{translate('description')}</th>
                <th>{translate('endpoints')}</th>
                <th>{translate('regions')}</th>
                <th width="3em"></th>
              </tr>
            </thead>
            <tbody>
              {rows}
            </tbody>
          </table>
          {this.state.showActionMenu && this.renderMenuItems()}
        </div>
      </div>
    );
  }

}

export default ServiceInfo;
