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
import { isEmpty } from 'lodash';

import { translate } from '../localization/localize.js';
import * as constants from '../utils/constants.js';
import BaseWizardPage from './BaseWizardPage.js';
import { PlaybookProgress } from '../components/PlaybookProgress.js';
import { ErrorBanner } from '../components/Messages.js';
import { getInternalModel } from './topology/TopologyUtils.js';

const GET_CLOUD_INTERNAL_MODEL = 'get_cloud_internal_model';


/*
  Navigation rules:
  - while the playbook is running (or unknown), Back and Next are disallowed
  - if the playbook ended successfully, only Next is allowed
  - if the playbook failed, only Back is allowed

  The play id is kept in the global state, and its absence indicates
  that the playbook should be launched.
*/

class CloudDeployProgress extends BaseWizardPage {

  constructor(props) {
    super(props);

    this.playbooks = [];
    this.internalModel = undefined;

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
  // WIPE_DISKS_PLAYBOOK or SITE_PLAYBOOK
  // which permits running the deploy multiple times when have errors and
  // need to go back
  resetPlaybookStatus = () => {
    if (this.props.playbookStatus) {
      // remove playbook status for any playbook in this.playbooks
      let playStatus = this.props.playbookStatus.filter(status =>
        !this.playbooks.map(play => play.name).includes(status.name));
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
      newDeployConfig.nodeListForWipeDisk = undefined;
      newDeployConfig.nodeListNotForWipeDisk = undefined;
      this.props.updateGlobalState('deployConfig', newDeployConfig);
    }
    super.goBack(e);
  }

  getSteps = () => {
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

    if (this.props.deployConfig && this.props.deployConfig.wipeDisks) {
      // If wipeDisks checked and nodeListNotForWipeDisk is not empty, need to limit
      // nodes for wipeDisks. Get the internal model so can get ansible host names
      if(!isEmpty(this.props.deployConfig.nodeListNotForWipeDisk)) {
        steps.push({
          label: translate('server.deploy.progress.get_internalmodel'),
          playbooks: [GET_CLOUD_INTERNAL_MODEL],
        });
      }

      // If wipeDisks checked and nodeListNotForWipeDisk is not empty, need to limit
      // nodes for wipeDisks
      // If wipeDisks checked and nodeListNotForWipeDisk is empty, will wipeDisks for
      // all the nodes
      steps.push({
        label: translate('server.deploy.progress.wipe-disks'),
        playbooks: [constants.WIPE_DISKS_PLAYBOOK + '.yml'],
      });
    }

    steps = steps.concat([{
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
    }]);

    steps.push({
      label: translate('deploy.progress.step6'),
      playbooks: [constants.SITE_PLAYBOOK + '.yml'],
    });

    return steps;
  }

  getCloudInternalModel = (logger) => {
    logger('Getting cloud internal model...');
    return getInternalModel()
      .then(cloudModel => {
        this.internalModel = cloudModel;
        logger('Successfully got cloud internal model.');
      })
      .catch(error => {
        const logMsg =
          'Error: Failed to get cloud internal model. ' + error.toString();
        logger(logMsg);
        const msg =
          translate('server.deploy.progress.get_internalmodel.failure',
            error.toString());
        throw new Error(msg);
      });
  }

  getPlaybooks = () => {
    let playbooks = [{name: constants.PRE_DEPLOYMENT_PLAYBOOK}];

    if (this.props.deployConfig && this.props.deployConfig.wipeDisks &&
        !isEmpty(this.props.deployConfig.nodeListNotForWipeDisk)) {
      playbooks.push({
        name: GET_CLOUD_INTERNAL_MODEL,
        action: ((logger) => {
          return this.getCloudInternalModel(logger);
        })
      });
    }

    if (this.props.deployConfig && this.props.deployConfig.wipeDisks) {
      let book = { name: constants.WIPE_DISKS_PLAYBOOK };
      // If user unselected nodes from wipeDisks, will have limit payload
      // If user didn't unselected wipeDisks nodes, will wipe disk for all the nodes.
      if(this.internalModel && !isEmpty(this.props.deployConfig.nodeListNotForWipeDisk)) {
        let hosts = this.internalModel['internal']['servers'];
        // find the ansible host names for the nodes need to be wiped disks
        hosts = hosts.filter(host=> {
          return this.props.deployConfig.nodeListForWipeDisk.includes(host.id);
        });
        let  ansibleHosts = hosts.map(host => host['ardana_ansible_host']);
        book.payload =  {limit: ansibleHosts.join(',')};
      }

      playbooks.push(book);
    }
    playbooks.push({name: constants.SITE_PLAYBOOK});

    return playbooks;
  }

  render() {
    let steps = this.getSteps();
    this.playbooks = this.getPlaybooks();

    // Build the payload from the deployment configuration page options
    let common_payload = {};
    if (this.props.deployConfig) {
      common_payload['verbose'] = this.props.deployConfig['verbosity'];
      common_payload['extra-vars'] = {};
      // don't prompt "Are you sure?" questions for wipedisks
      common_payload['extra-vars']['automate'] = 'true';
      if (this.props.deployConfig['encryptKey']) {
        common_payload['extra-vars']['encrypt'] = this.props.deployConfig['encryptKey'];
        common_payload['extra-vars']['rekey'] = '';
      } else {
        common_payload['extra-vars']['encrypt'] = '';
        common_payload['extra-vars']['rekey'] = '';
      }
      if (this.props.deployConfig['clearServers']) {
        common_payload['extra-vars']['remove_deleted_servers'] = 'y';
        common_payload['extra-vars']['free_unused_addresses'] = 'y';
      }
    }

    return (
      <div className='wizard-page'>
        <div className='content-header'>
          {this.renderHeading(translate('deploy.progress.heading'))}
        </div>
        <div className='wizard-content'>
          <PlaybookProgress
            updatePageStatus = {this.updatePageStatus} updateGlobalState = {this.props.updateGlobalState}
            playbookStatus = {this.props.playbookStatus}
            steps = {steps}
            playbooks = {this.playbooks} payload = {common_payload}/>
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
