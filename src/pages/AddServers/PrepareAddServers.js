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
import { PlaybookProgress } from '../../components/PlaybookProcess.js';
import { translate } from '../../localization/localize.js';
import { STATUS, PRE_DEPLOYMENT_PLAYBOOK } from '../../utils/constants.js';
import { postJson } from '../../utils/RestUtils.js';


const PLAYBOOK_STEPS = [
  {
    label: translate('deploy.progress.config-processor-run'),
    playbooks: ['config-processor-run.yml']
  },
  {
    label: translate('deploy.progress.ready-deployment'),
    playbooks: ['ready-deployment.yml']
  },
  {
    label: translate('deploy.progress.predeployment'),
    playbooks: [PRE_DEPLOYMENT_PLAYBOOK + '.yml', ]
  }
];

// This is the prepare page for adding compute servers
// process. It will first commit the model changes and start
// the playbook to do pre-deployment.
class PrepareAddServers extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);

    this.playbooks = [];

    this.state = {
      overallStatus: STATUS.UNKNOWN, // overall status of entire playbook and commit
      showPlabybookProcess: false,
      processErrorBanner: '',
      // this loading indicator
      loading: false
    };
  }

  setNextButtonDisabled = () => this.state.overallStatus != STATUS.COMPLETE;

  componentDidMount() {
    //go commit model changes if playbook has not been run
    if(!this.props.playbookStatus) {
      this.setState({loading: true});
      const commitMessage = {'message': 'Committed via Ardana DayTwo Installer'};
      postJson('/api/v1/clm/model/commit', commitMessage)
        .then((response) => {
          if (this.props.enableNextButton) {
            this.props.enableNextButton(true);
          }
          this.setState({showPlabybookProcess: true, loading: false});
        })
        .catch((error) => {
          this.setState({
            overallStatus: STATUS.FAILED,
            processErrorBanner: translate('update.commit.failure', error.toString()),
            loading: false
          });
          if (this.props.enableNextButton) {
            this.props.enableNextButton(false);
          }
        });
    }
    else { // playbook has been started
      this.setState({showPlabybookProcess: true});
    }
  }

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
    if (status === STATUS.FAILED) {
      this.setState({processErrorBanner: translate('server.addserver.prepare.failure')});
    }
  }

  toShowLoadingMask = () => {
    return this.props.wizardLoading || this.state.loading;
  }

  isValidToRenderPlaybookProgress = () => {
    return (
      this.state.showPlabybookProcess && !this.props.wizardLoading && !this.state.loading
    );
  }

  renderPlaybookProgress () {
    this.playbooks = [{name: PRE_DEPLOYMENT_PLAYBOOK}];
    return (
      <PlaybookProgress
        updatePageStatus = {this.updatePageStatus} updateGlobalState = {this.props.updateGlobalState}
        playbookStatus = {this.props.playbookStatus} steps = {PLAYBOOK_STEPS}
        playbooks = {this.playbooks} isUpdateMode = {true}/>
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
        <LoadingMask show={this.toShowLoadingMask()}/>
        <div className='content-header'>
          {this.renderHeading(translate('server.addserver.prepare'))}
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

export default PrepareAddServers;
