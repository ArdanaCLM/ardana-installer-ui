// (c) Copyright 2019 SUSE LLC
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
import { getCachedEncryptKey } from '../../utils/MiscUtils.js';


// This is the process for update model configuration when
// user clicks Deploy button
class UpdateModelProcess extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      overallStatus: constants.STATUS.UNKNOWN, // overall status of entire playbook
      processErrorBanner: '',
    };
  }

  componentDidMount() {
    this.checkEncryptKeyAndProceed();
  }

  getFailureMsg = () => {
    return translate('update.progress.failure');
  }

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
    if (status === constants.STATUS.FAILED) {
      this.setState({processErrorBanner: this.getFailureMsg()});
    }
  }

  getDeploySteps() {
    return [{
      label: translate('deploy.progress.step1'),
      playbooks: [constants.NETWORK_INTERFACE_DEPLOY_PLAYBOOK + '.yml']
    }, {
      label: translate('deploy.progress.step2'),
      playbooks: [
        constants.NOVA_DEPLOY_PLAYBOOK + '.yml', constants.IRONIC_DEPLOY_PLAYBOOK + '.yml',
        constants.MAGNUM_DEPLOY_PLAYBOOK + '.yml']
    }, {
      label: translate('deploy.progress.step3'),
      playbooks: [
        constants.MONASCA_AGENT_DEPLOY_PLAYBOOK + '.yml', constants.MONASCA_DEPLOY_PLAYBOOK + '.yml',
        constants.MONASCA_TRANSFORM_DEPLOY_PLAYBOOK + '.yml']
    }, {
      label: translate('deploy.progress.step4'),
      playbooks: [
        constants.CEPH_DEPLOY_PLAYBOOK + '.yml', constants.CINDER_DEPLOY_PLAYBOOK + '.yml',
        constants.SWIFT_DEPLOY_PLAYBOOK + '.yml']
    }, {
      label: translate('deploy.progress.step5'),
      playbooks: [constants.ARDANA_STATUS_PLAYBOOK + '.yml']
    }, {
      label: translate('deploy.progress.step6'),
      playbooks: [constants.SITE_PLAYBOOK + '.yml'],
    }];
  }

  getDeployPlaybooks() {
    return [{
      name: constants.SITE_PLAYBOOK,
      payload:  {'extra-vars': {encrypt: getCachedEncryptKey() || ''}}
    }];
  }

  setCloseButtonDisabled = () => {
    // Disable the close button when playbooks/actions haven't started at all or
    // one of the playbooks or actions is still in progress
    return this.state.overallStatus === constants.STATUS.IN_PROGRESS ||
      this.state.overallStatus === constants.STATUS.UNKNOWN;
  }


  renderPlaybookProgress () {
    let steps = [{
      label: translate('deploy.progress.config-processor-run'),
      playbooks: [constants.CONFIG_PROCESSOR_RUN_PLAYBOOK + '.yml']
    }, {
      label: translate('deploy.progress.ready-deployment'),
      playbooks: [constants.READY_DEPLOYMENT_PLAYBOOK + '.yml']
    }, {
      label: translate('deploy.progress.predeployment'),
      playbooks: [constants.PRE_DEPLOYMENT_PLAYBOOK + '.yml']
    }];
    if(this.props.operationProps.isDeploy) {
      steps = steps.concat(this.getDeploySteps());
    }

    let playbooks = [{
      name: constants.PRE_DEPLOYMENT_PLAYBOOK,
      payload:  {'extra-vars': {encrypt: getCachedEncryptKey() || ''}}
    }];

    if(this.props.operationProps.isDeploy) {
      playbooks = playbooks.concat(this.getDeployPlaybooks());
    }

    return (
      <PlaybookProgress
        updatePageStatus = {this.updatePageStatus} updateGlobalState = {this.props.updateGlobalState}
        playbookStatus = {this.props.playbookStatus} steps = {steps} playbooks = {playbooks}/>
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
    // If error happens, will show retry buttons.
    let failed =  this.state.overallStatus === constants.STATUS.FAILED;
    let headingKey =
      this.props.operationProps.isDeploy ? 'update.progress.heading' : 'update.prepare.progress.heading';
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.props.wizardLoading}/>
        <div className='content-header'>
          {this.renderHeading(translate(headingKey))}
        </div>
        <div className='wizard-content'>
          <If condition={!this.props.wizardLoading && this.state.showPlaybookProcess}>
            {this.renderPlaybookProgress()}
          </If>
          <If condition={failed}>{this.renderProcessError()}</If>
          {this.renderEncryptKeyModal()}
        </div>
        {this.renderNavButtons(false, failed)}
      </div>
    );
  }
}

export default UpdateModelProcess;
