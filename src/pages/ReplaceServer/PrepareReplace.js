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
import { STATUS } from '../../utils/constants.js';
import BaseWizardPage from '../BaseWizardPage.js';
import { PlaybookProgress } from '../../components/PlaybookProcess.js';
import { ErrorBanner } from '../../components/Messages.js';
import {postJson} from "../../utils/RestUtils";

const PRE_DEPLOYMENT_PLAYBOOK = 'dayzero-pre-deployment';

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
    playbooks: ['dayzero-pre-deployment.yml', ]
  }
];

// TODO this is a placeholder for now
class PrepareReplace extends BaseWizardPage {

  constructor(props) {
    super(props);

    this.playbooks = [];

    this.state = {
      overallStatus: STATUS.UNKNOWN, // overall status of entire playbook and commit
      invalidMsg: '',
    };
  }
  setNextButtonDisabled = () => this.state.overallStatus != STATUS.COMPLETE;

  componentWillMount() {
    //go commit model changes
    const commitMessage = {'message': 'Committed via Ardana DayTwo Installer'};
    postJson('/api/v1/clm/model/commit', commitMessage)
      .then((response) => {
        if(this.props.enableNextButton) {
          this.props.enableNextButton(true);
        }
      })
      .catch((error) => {
        this.setState({
          overallStatus: STATUS.FAILED,
          invalidMsg: translate('update.commit.failure', error.toString())
        });
        if(this.props.enableNextButton) {
          this.props.enableNextButton(false);
        }
      });
  }

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
    if (status === STATUS.FAILED) {
      this.setState({invalidMsg: translate('server.replace.prepare.failure')});
    }
  }

  renderPlaybookProgress () {
    this.playbooks = [PRE_DEPLOYMENT_PLAYBOOK];
    return (
      <PlaybookProgress
        updatePageStatus = {this.updatePageStatus} updateGlobalState = {this.props.updateGlobalState}
        playbookStatus = {this.props.playbookStatus} noStart={this.state.commit === STATUS.FAILED}
        steps = {PLAYBOOK_STEPS}  playbooks = {this.playbooks}/>
    );
  }

  renderError () {
    return (
      <div className='banner-container'>
        <ErrorBanner message={this.state.invalidMsg}
          show={this.state.overallStatus === STATUS.FAILED}/>
      </div>
    );
  }

  render() {
    //if error happens, cancel button shows up as well
    let cancel =  this.state.overallStatus === STATUS.FAILED;
    return (
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading(translate('server.replace.prepare'))}
        </div>
        <div className='wizard-content'>
          {!cancel && this.renderPlaybookProgress()}
          {this.renderError()}
        </div>
        {this.renderNavButtons(false, cancel)}
      </div>
    );
  }
}

export default PrepareReplace;
