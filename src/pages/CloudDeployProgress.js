// (c) Copyright 2017-2019 SUSE LLC
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

import { translate } from '../localization/localize.js';
import * as constants from '../utils/constants.js';
import BaseWizardPage from './BaseWizardPage.js';
import { PlaybookProgress } from '../components/PlaybookProgress.js';
import { ErrorBanner } from '../components/Messages.js';

/*
  Navigation rules:
  - while the playbook is running (or unknown), Back and Next are disallowed
  - if the playbook ended successfully, only Next is allowed
  - if the playbook failed, only Back is allowed

  The play id is kept in the global state, and its absence indicates
  that the playbook should be launched.
*/

const PLAYBOOK_STEPS = [
  {
    label: translate('deploy.progress.config-processor-run'),
    playbooks: [constants.CONFIG_PROCESSOR_RUN_PLAYBOOK + '.yml']
  },
  {
    label: translate('deploy.progress.ready-deployment'),
    playbooks: [constants.READY_DEPLOYMENT_PLAYBOOK + '.yml']
  },
  {
    label: translate('deploy.progress.predeployment'),
    playbooks: [constants.PRE_DEPLOYMENT_PLAYBOOK + '.yml']
  },
  {
    label: translate('deploy.progress.step1'),
    playbooks: [constants.NETWORK_INTERFACE_DEPLOY_PLAYBOOK + '.yml']
  },
  {
    label: translate('deploy.progress.step2'),
    playbooks: [
      constants.NOVA_DEPLOY_PLAYBOOK + '.yml', constants.IRONIC_DEPLOY_PLAYBOOK + '.yml',
      constants.MAGNUM_DEPLOY_PLAYBOOK + '.yml']
  },
  {
    label: translate('deploy.progress.step3'),
    playbooks: [
      constants.MONASCA_AGENT_DEPLOY_PLAYBOOK + '.yml', constants.MONASCA_DEPLOY_PLAYBOOK + '.yml',
      constants.MONASCA_TRANSFORM_DEPLOY_PLAYBOOK + '.yml']
  },
  {
    label: translate('deploy.progress.step4'),
    playbooks: [
      constants.CEPH_DEPLOY_PLAYBOOK + '.yml', constants.CINDER_DEPLOY_PLAYBOOK + '.yml',
      constants.SWIFT_DEPLOY_PLAYBOOK + '.yml']
  },
  {
    label: translate('deploy.progress.step5'),
    playbooks: [constants.ARDANA_STATUS_PLAYBOOK + '.yml']
  },
  {
    label: translate('deploy.progress.step6'),
    playbooks: [
      //either site.yml or installui-wipe-and-site.yml
      constants.SITE_PLAYBOOK + '.yml', constants.DAYZERO_SITE_PLAYBOOK + '.yml'],
    orCondition: true
  }
];

class CloudDeployProgress extends BaseWizardPage {

  constructor(props) {
    super(props);

    this.playbooks = [];

    this.state = {
      overallStatus: constants.STATUS.UNKNOWN // overall status of entire playbook
    };
  }
  setNextButtonDisabled = () => this.state.overallStatus != constants.STATUS.COMPLETE;
  setBackButtonDisabled = () => this.state.overallStatus != constants.STATUS.FAILED;

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
  }

  // Clear out the global playbookStatus entry for PRE_DEPLOYMENT_PLAYBOOK,
  // DAYZERO_SITE_PLAYBOOK or SITE_PLAYBOOK
  // which permits running the deploy multiple times when have errors and
  // need to go back
  resetPlaybookStatus = () => {
    if (this.props.playbookStatus) {
      // remove playbook status for any playbook in this.playbooks
      let playStatus = this.props.playbookStatus.filter(status =>
        !this.playbooks.includes(status.name));
      this.props.updateGlobalState('playbookStatus', playStatus);
    }
  }

  goForward(e) {
    e.preventDefault();
    this.props.updateGlobalState('deployConfig', undefined);
    super.goForward(e);
  }

  goBack(e) {
    e.preventDefault();
    // reset so can rerun deploy if failed
    this.resetPlaybookStatus();

    // reset wipeDisks to false
    if (this.props.deployConfig.wipeDisks) {
      let newDeployConfig = JSON.parse(JSON.stringify(this.props.deployConfig));
      newDeployConfig.wipeDisks = false;
      this.props.updateGlobalState('deployConfig', newDeployConfig);
    }
    super.goBack(e);
  }

  render() {
    // choose between site or site with wipedisks (installui-wipe-and-site)
    let sitePlaybook = constants.SITE_PLAYBOOK;

    // Build the payload from the deployment configuration page options
    let payload = {};
    if (this.props.deployConfig) {
      if (this.props.deployConfig['wipeDisks']) {
        sitePlaybook = constants.DAYZERO_SITE_PLAYBOOK;
      }
      payload['verbose'] = this.props.deployConfig['verbosity'];
      payload['extra-vars'] = {};
      // don't prompt "Are you sure?" questions for wipedisks
      payload['extra-vars']['automate'] = 'true';
      if (this.props.deployConfig['encryptKey']) {
        payload['extra-vars']['encrypt'] = this.props.deployConfig['encryptKey'];
        payload['extra-vars']['rekey'] = '';
      } else {
        payload['extra-vars']['encrypt'] = '';
        payload['extra-vars']['rekey'] = '';
      }
      if (this.props.deployConfig['clearServers']) {
        payload['extra-vars']['remove_deleted_servers'] = 'y';
        payload['extra-vars']['free_unused_addresses'] = 'y';
      }
    }

    this.playbooks = [constants.PRE_DEPLOYMENT_PLAYBOOK, sitePlaybook];

    return (
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading(translate('deploy.progress.heading'))}
        </div>
        <div className='wizard-content'>
          <PlaybookProgress
            updatePageStatus = {this.updatePageStatus} updateGlobalState = {this.props.updateGlobalState}
            playbookStatus = {this.props.playbookStatus}
            steps = {PLAYBOOK_STEPS}
            playbooks = {this.playbooks} payload = {payload}/>
          <div className='banner-container'>
            <ErrorBanner message={translate('deploy.progress.failure')}
              show={this.state.overallStatus === constants.STATUS.FAILED}/>
          </div>
        </div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default CloudDeployProgress;
