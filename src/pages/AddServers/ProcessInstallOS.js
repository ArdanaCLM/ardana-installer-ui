// (c) Copyright 2018-2019 SUSE LLC
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
import * as constants from '../../utils/constants.js';

let PLAYBOOK_STEPS = [
  {
    label: translate('install.progress.step1'),
    playbooks: [constants.BM_POWER_STATUS_PLAYBOOK + '.yml']
  },
  {
    label: translate('install.progress.step2'),
    playbooks: [constants.COBBLER_DEPLOY_PLAYBOOK + '.yml']
  },
  {
    label: translate('install.progress.step3'),
    playbooks: [constants.BM_REIMAGE_PLAYBOOK + '.yml']
  },
  {
    label: translate('install.progress.step4'),
    playbooks: [constants.INSTALL_PLAYBOOK + '.yml']
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
      overallStatus: constants.STATUS.UNKNOWN, // overall status of entire playbook
      processErrorBanner: ''
    };
  }

  setNextButtonDisabled = () => this.state.overallStatus != constants.STATUS.COMPLETE;

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
    if (status === constants.STATUS.FAILED) {
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
      name: constants.INSTALL_PLAYBOOK,
      payload: {
        'extra-vars': {
          'nodelist': this.props.operationProps.selectedToInstallOS.map(e => e.id).join(','),
          'ardanauser_password': this.props.operationProps.osInstallPassword,
          'encrypt': this.props.encryptKey || ''
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
          show={this.state.overallStatus === constants.STATUS.FAILED}/>
      </div>
    );
  }

  render() {
    // If error happens, will show cancel and retry buttons.
    let failed =  this.state.overallStatus === constants.STATUS.FAILED;
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.props.wizardLoading}/>
        <div className='content-header'>
          {this.renderHeading(translate('server.addserver.compute.installos'))}
        </div>
        <div className='wizard-content'>
          {this.isValidToRenderPlaybookProgress() && this.renderPlaybookProgress()}
          {failed && this.renderProcessError()}
        </div>
        {this.renderNavButtons(failed, failed)}
      </div>
    );
  }
}

export default ProcessInstallOS;
