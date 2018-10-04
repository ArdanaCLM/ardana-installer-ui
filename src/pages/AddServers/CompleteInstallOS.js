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
import { alphabetically } from '../../utils/Sort.js';

// This is the complete page for installing SLES OS on compute servers
// It will display server ID, IP, mac-addr and ilo-ip
class CompleteInstallOS extends BaseUpdateWizardPage {
  constructor(props) {
    super(props);
  }

  renderServerList() {
    let serverList = this.props.operationProps.selectedToInstallOS.sort((a, b) => {
      return alphabetically(a['id'], b['id']);
    }).map((host, idx) => {
      return (
        <li key={idx}>{host['id']}
          <ul className='complete-serverdetails'>
            <li key={1}> {translate('server.details.ip') + ' ' + host['ip-addr']} </li>
            <li key={2}> {translate('server.mac.prompt') + ' ' + host['mac-addr']} </li>
            <li key={3}> {translate('server.ipmi.ip.prompt') + ' ' + host['ilo-ip']} </li>
          </ul>
        </li>
      );
    });

    return (
      <div className='col-xs-8 addservers-page'>
        <ul className='complete-servernames-list'>{serverList}</ul>
      </div>
    );
  }

  render() {
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.props.wizardLoading}/>
        <div className='content-header'>
          {this.renderHeading(translate('server.addserver.compute.installos.complete'))}
        </div>
        <div className='wizard-content'>
          {this.renderServerList()}
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default CompleteInstallOS;
