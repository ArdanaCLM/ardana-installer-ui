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
import { postJson } from '../../utils/RestUtils.js';
import { getCachedEncryptKey } from '../../utils/MiscUtils.js';


// This is the prepare page for adding compute servers
// process. It will first commit the model changes and start
// the playbook to do pre-deployment.
class PrepareAddServers extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      overallStatus: constants.STATUS.UNKNOWN, // overall status of entire playbook and commit
      processErrorBanner: '',
    };
  }

  componentDidMount() {
    this.checkEncryptKeyAndProceed();
  }

  setNextButtonDisabled = () => this.state.overallStatus != constants.STATUS.COMPLETE;

  getPrepareServerFailureMsg = () => {
    return translate('server.addserver.prepare.failure');
  }

  getPrepareServerTitle = () => {
    return translate('server.addserver.prepare');
  }

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
    if (status === constants.STATUS.FAILED) {
      this.setState({processErrorBanner: this.getPrepareServerFailureMsg()});
    }
  }

  renderPlaybookProgress () {
    const PLAYBOOK_STEPS = [{
      label: translate('deploy.progress.commit'),
      playbooks: [constants.COMMIT_MODEL_CHANGE_ACTION]
    }, {
      label: translate('deploy.progress.config-processor-run'),
      playbooks: [constants.CONFIG_PROCESSOR_RUN_PLAYBOOK + '.yml']
    }, {
      label: translate('deploy.progress.ready-deployment'),
      playbooks: [constants.READY_DEPLOYMENT_PLAYBOOK + '.yml']
    }, {
      label: translate('deploy.progress.predeployment'),
      playbooks: [constants.PRE_DEPLOYMENT_PLAYBOOK + '.yml']
    }];

    let playbooks = [{
      name: constants.COMMIT_MODEL_CHANGE_ACTION,
      action: ((logger) => {
        const commitMessage = {'message': 'Committed via Ardana Installer'};
        return postJson('/api/v2/model/commit', commitMessage)
          .then((response) => {
            logger('Successfully committed model changes');
          })
          .catch((error) => {
            const logMsg = 'Failed to commit update changes. ' + error.toString();
            logger(logMsg);
            const message = translate('update.commit.failure', error.toString());
            throw new Error(message);
          });
      }),
    }, {
      name: constants.PRE_DEPLOYMENT_PLAYBOOK,
      payload:  {'extra-vars': {encrypt: getCachedEncryptKey() || ''}}
    }];
    return (
      <PlaybookProgress
        updatePageStatus = {this.updatePageStatus} updateGlobalState = {this.props.updateGlobalState}
        playbookStatus = {this.props.playbookStatus} steps = {PLAYBOOK_STEPS} playbooks = {playbooks}/>
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

  renderFooterButtons (showCancel, showRetry) {
    // Will have a specific cancel confirmation message when user clicks
    // cancel button.
    let cancelMsg = translate('server.addserver.failure.prep.cancel.confirm');
    return this.renderNavButtons(showCancel, showRetry, cancelMsg);
  }

  render() {
    // If error happens, will show cancel and retry buttons.
    let failed =  this.state.overallStatus === constants.STATUS.FAILED;
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.props.wizardLoading}/>
        <div className='content-header'>
          {this.renderHeading(this.getPrepareServerTitle())}
        </div>
        <div className='wizard-content'>
          <If condition={!this.props.wizardLoading && this.state.showPlaybookProcess}>
            {this.renderPlaybookProgress()}
          </If>
          <If condition={failed}>{this.renderProcessError()}</If>
          {this.renderEncryptKeyModal()}
        </div>
        {this.renderFooterButtons(failed, failed)}
      </div>
    );
  }
}

export default PrepareAddServers;
