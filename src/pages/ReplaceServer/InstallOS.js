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
import { translate } from '../../localization/localize.js';
import { INSTALL_PLAYBOOK, STATUS } from '../../utils/constants.js';
import BaseUpdateWizardPage from '../BaseUpdateWizardPage.js';
import { PlaybookProgress } from '../../components/PlaybookProgress.js';
import { ErrorBanner } from '../../components/Messages.js';

const OS_INSTALL_STEPS = [
  {
    label: translate('install.progress.step1'),
    playbooks: ['bm-power-status.yml']
  },
  {
    label: translate('install.progress.step2'),
    playbooks: ['cobbler-deploy.yml']
  },
  {
    label: translate('install.progress.step3'),
    playbooks: ['bm-reimage.yml']
  },
  {
    label: translate('install.progress.step4'),
    playbooks: [INSTALL_PLAYBOOK + '.yml']
  }
];

// TODO this is a placeholder to illustrate
// how the replace framework can function with multiple
// pages assembled dynamically. Later when real replace
// node stories are implemented, either update this
// page or remove it if it is not used eventually.
class InstallOS extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);

    this.playbooks = [];

    this.state = {
      overallStatus: STATUS.UNKNOWN // overall status of entire playbook
    };
  }
  setNextButtonDisabled = () => this.state.overallStatus != STATUS.COMPLETE;

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
  }

  renderPlaybookProgress(serverId) {
    this.playbooks = [INSTALL_PLAYBOOK];
    let installPass = this.props.operationProps ? this.props.operationProps.osInstallPassword : '';
    const payload = {
      'extra-vars': {
        'nodelist': [serverId],
        'ardanauser_password': installPass
      }
    };
    return (
      <PlaybookProgress
        updatePageStatus = {this.updatePageStatus} updateGlobalState = {this.props.updateGlobalState}
        playbookStatus = {this.props.playbookStatus}
        steps = {OS_INSTALL_STEPS}
        playbooks = {this.playbooks} payload = {payload}/>
    );
  }

  render() {

    //assume for replace , we do one server at a time
    let serverId = this.props.operationProps ? this.props.operationProps.server.id : '';
    //if error happens, cancel button shows up as well
    //TODO put some messages for the errors
    let cancel =  this.state.overallStatus === STATUS.FAILED;
    return (
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading(translate('install.progress.heading'))}
        </div>
        <div className='wizard-content'>
          {serverId && this.renderPlaybookProgress(serverId)}
          <div className='banner-container'>
            <ErrorBanner message={translate('install.progress.failure')}
              show={this.state.overallStatus === STATUS.FAILED}/>
          </div>
        </div>
        {this.renderNavButtons(false, cancel)}
      </div>
    );
  }
}

export default InstallOS;
