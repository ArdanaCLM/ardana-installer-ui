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
import { STATUS, PRE_DEPLOYMENT_PLAYBOOK } from '../../utils/constants.js';
import { postJson } from '../../utils/RestUtils.js';


const PLAYBOOK_STEPS = [{
  label: translate('deploy.progress.commit'),
  playbooks: ['commit']
}, {
  label: translate('deploy.progress.config-processor-run'),
  playbooks: ['config-processor-run.yml']
}, {
  label: translate('deploy.progress.ready-deployment'),
  playbooks: ['ready-deployment.yml']
}, {
  label: translate('deploy.progress.predeployment'),
  playbooks: [PRE_DEPLOYMENT_PLAYBOOK + '.yml', ]
}];

// This is the prepare page for adding compute servers
// process. It will first commit the model changes and start
// the playbook to do pre-deployment.
class PrepareAddServers extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);

    this.state = {
      overallStatus: STATUS.UNKNOWN, // overall status of entire playbook and commit
      processErrorBanner: '',
    };
  }

  setNextButtonDisabled = () => this.state.overallStatus != STATUS.COMPLETE;

  getPrepareServerFailureMsg = () => {
    return translate('server.addserver.prepare.failure');
  }

  getPrepareServerTitle = () => {
    return translate('server.addserver.prepare');
  }

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
    if (status === STATUS.FAILED) {
      this.setState({processErrorBanner: this.getPrepareServerFailureMsg()});
    }
  }

  renderPlaybookProgress () {
    let playbooks = [{
      name: 'commit',
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
      name: PRE_DEPLOYMENT_PLAYBOOK
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
          {this.renderHeading(this.getPrepareServerTitle())}
        </div>
        <div className='wizard-content'>
          {!this.props.wizardLoading && this.renderPlaybookProgress()}
          {cancel && this.renderProcessError()}
        </div>
        {this.renderNavButtons(cancel)}
      </div>
    );
  }
}

export default PrepareAddServers;
