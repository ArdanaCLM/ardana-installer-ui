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

import React from 'react';
import BaseUpdateWizardPage from '../BaseUpdateWizardPage.js';
import { LoadingMask } from '../../components/LoadingMask.js';
import { translate } from '../../localization/localize.js';

// This is the complete page for replace a compute server
// process. It will display old and new compute server's hostname,
// server ID and IP.
class CompleteReplaceCompute extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);
  }

  renderServerInfo() {
    let servers = [
      (<li key={1}>{translate('server.deploy.compute.oldserver', this.props.operationProps.oldServer['hostname'])}
        <ul className='complete-serverdetails'>
          <li key={1}> {translate('id.with_colon') + ' ' + this.props.operationProps.oldServer['id']} </li>
          <li key={2}> {translate('server.details.ip') + ' ' + this.props.operationProps.oldServer['ip']} </li>
        </ul>
      </li>),
      (<li key={2}>{translate('server.deploy.compute.newserver', this.props.operationProps.server['hostname'])}
        <ul className='complete-serverdetails'>
          <li key={1}> {translate('id.with_colon') + ' ' + this.props.operationProps.server['id']} </li>
          <li key={2}> {translate('server.details.ip') + ' ' + this.props.operationProps.server['ip']} </li>
        </ul>
      </li>),
    ];

    return (
      <div className='col-8 addservers-page'>
        <ul className='complete-servernames-list'>{servers}</ul>
      </div>
    );
  }

  render() {
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.props.wizardLoading}/>
        <div className='content-header'>
          {this.renderHeading(translate('server.deploy.replace_compute.complete'))}</div>
        <div className='wizard-content'>
          {this.renderServerInfo()}
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default CompleteReplaceCompute;
