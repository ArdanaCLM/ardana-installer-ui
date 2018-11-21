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
import { ErrorBanner } from '../../components/Messages.js';
import { PlaybookProgress } from '../../components/PlaybookProgress.js';
import { translate } from '../../localization/localize.js';
import { STATUS, INSTALL_PLAYBOOK } from '../../utils/constants.js';

let PLAYBOOK_STEPS = [
  {
    label: 'install.progress.step1',
    playbooks: ['bm-power-status.yml']
  },
  {
    label: 'install.progress.step2',
    playbooks: ['cobbler-deploy.yml']
  },
  {
    label: 'install.progress.step3',
    playbooks: ['bm-reimage.yml']
  },
  {
    label: 'install.progress.step4',
    playbooks: [INSTALL_PLAYBOOK + '.yml']
  }
];

// This is the process page of installing SLES OS on added compute servers.
// It will launch the following playbooks to finish up installing os on
// the selected newly added compute servers.
// ansible-playbook -i hosts/localhost installui-os-provision.yml -e
// nodelist=nodeId1,nodeId2
class ProcessInstallOS extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);

    this.state = {
      overallStatus: STATUS.UNKNOWN, // overall status of entire playbook
      processErrorBanner: ''
    };
  }

  setNextButtonDisabled = () => this.state.overallStatus != STATUS.COMPLETE;

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
    if (status === STATUS.FAILED) {
      this.setState({
        processErrorBanner: translate('server.addserver.deploy.failure')});
    }
  }

  isValidToRenderPlaybookProgress = () => {
    return (
      !this.props.wizardLoading &&
      this.props.operationProps.selectedToInstallOS &&
      this.props.operationProps.selectedToInstallOS.length > 0 &&
      this.props.operationProps.osInstallPassword &&
      this.props.operationProps.osInstallPassword.length > 0
    );
  }

  renderPlaybookProgress () {
    let playbooks = [{
      name: INSTALL_PLAYBOOK,
      payload: {
        'extra-vars': {
          'nodelist': this.props.operationProps.selectedToInstallOS.map(e => e.id).join(','),
          'ardanauser_password': this.props.operationProps.osInstallPassword
        }
      }
    }];
    return (
      <PlaybookProgress
        updatePageStatus = {this.updatePageStatus} updateGlobalState = {this.props.updateGlobalState}
        playbookStatus = {this.props.playbookStatus} steps = {PLAYBOOK_STEPS}
        playbooks = {playbooks} isUpdateMode = {true}/>
    );
  }

  renderProcessError () {
    return (
      <div className='banner-container'>
        <ErrorBanner message={this.state.processErrorBanner}
          show={this.state.overallStatus === STATUS.FAILED}/>
      </div>
    );
  }

  render() {
    //if error happens, cancel button shows up
    let cancel =  this.state.overallStatus === STATUS.FAILED;
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.props.wizardLoading}/>
        <div className='content-header'>
          {this.renderHeading(translate('server.addserver.compute.installos'))}
        </div>
        <div className='wizard-content'>
          {this.isValidToRenderPlaybookProgress() && this.renderPlaybookProgress()}
          {cancel && this.renderProcessError()}
        </div>
        {this.renderNavButtons(cancel)}
      </div>
    );
  }
}

export default ProcessInstallOS;
