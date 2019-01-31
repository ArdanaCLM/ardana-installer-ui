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
import {
  INSTALL_PLAYBOOK, STATUS, BM_POWER_STATUS_PLAYBOOK, BM_REIMAGE,
  COBBLER_DEPLOY_PLAYBOOK
} from '../../utils/constants.js';
import BaseUpdateWizardPage from '../BaseUpdateWizardPage.js';
import { PlaybookProgress } from '../../components/PlaybookProgress.js';
import { ErrorBanner } from '../../components/Messages.js';
import { LoadingMask } from '../../components/LoadingMask.js';

class InstallOS extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      overallStatus: STATUS.UNKNOWN, // overall status of entire playbook
      processErrorBanner: ''
    };
  }

  componentDidMount() {
    this.checkEncryptKeyAndProceed();
  }

  setNextButtonDisabled = () => this.state.overallStatus != STATUS.COMPLETE;

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
    if (status === STATUS.FAILED) {
      this.setState({
        processErrorBanner:
          translate('server.deploy.installos.failure', this.props.operationProps.server.id)});
    }
  }

  renderProcessError() {
    return (
      <div className='banner-container'>
        <ErrorBanner message={this.state.processErrorBanner}
          show={this.state.overallStatus === STATUS.FAILED}/>
      </div>
    );
  }

  renderPlaybookProgress(serverId) {
    const steps  = [{
      label: translate('install.progress.step1'),
      playbooks: [BM_POWER_STATUS_PLAYBOOK + '.yml']
    }, {
      label: translate('install.progress.step2'),
      playbooks: [COBBLER_DEPLOY_PLAYBOOK + '.yml']
    }, {
      label: translate('install.progress.step3'),
      playbooks: [BM_REIMAGE + '.yml']
    }, {
      label: translate('install.progress.step4'),
      playbooks: [INSTALL_PLAYBOOK + '.yml']
    }];

    let installPass = this.props.operationProps.osPassword || '';
    let playbooks = [{
      name: INSTALL_PLAYBOOK,
      payload: {
        'extra-vars': {
          'nodelist': this.props.operationProps.server.id,
          'ardanauser_password': installPass,
          'encrypt': this.props.encryptKey || ''
        }
      }
    }];

    return (
      <PlaybookProgress
        updatePageStatus = {this.updatePageStatus} updateGlobalState = {this.props.updateGlobalState}
        playbookStatus = {this.props.playbookStatus}
        steps = {steps} playbooks = {playbooks}/>
    );
  }

  render() {

    //assume for replace , we do one server at a time
    let cancel =  this.state.overallStatus === STATUS.FAILED;
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.props.wizardLoading} />
        <div className='content-header'>
          {this.renderHeading(translate('install.progress.heading'))}
        </div>
        <div className='wizard-content'>
          <If condition={!this.props.wizardLoading && this.state.showPlaybookProcess}>
            {this.renderPlaybookProgress()}
          </If>
          {this.renderEncryptKeyModal()}
          <If condition={cancel}>{this.renderProcessError()}</If>
        </div>
        {this.renderNavButtons(cancel)}
      </div>
    );
  }
}

export default InstallOS;
