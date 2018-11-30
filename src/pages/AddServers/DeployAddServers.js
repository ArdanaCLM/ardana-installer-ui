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
import { ErrorBanner, WarningMessage } from '../../components/Messages.js';
import { PlaybookProgress } from '../../components/PlaybookProgress.js';
import { translate } from '../../localization/localize.js';
import {
  STATUS, WIPE_DISKS_PLAYBOOK, ARDANA_GEN_HOSTS_FILE_PLAYBOOK,
  SITE_PLAYBOOK, MONASCA_DEPLOY_PLAYBOOK, ARDANA_START_PLAYBOOK
} from '../../utils/constants.js';
import { fetchJson } from '../../utils/RestUtils.js';

const PLAYBOOK_POSSIBLE_STEPS = [{
  name: WIPE_DISKS_PLAYBOOK,
  label: translate('server.deploy.progress.wipe-disks'),
  playbooks: [WIPE_DISKS_PLAYBOOK + '.yml'],
  payload: {limit: {}}
}, {
  name: ARDANA_GEN_HOSTS_FILE_PLAYBOOK,
  label: translate('server.deploy.progress.gen-hosts-file'),
  playbooks: [ARDANA_GEN_HOSTS_FILE_PLAYBOOK + '.yml']
}, {
  name: SITE_PLAYBOOK,
  label: translate('server.deploy.progress.addserver.deploy'),
  playbooks: [SITE_PLAYBOOK + '.yml'],
  payload: {limit: {}}
}, {
  name: MONASCA_DEPLOY_PLAYBOOK,
  label: translate('server.deploy.progress.update-monasca'),
  playbooks: [MONASCA_DEPLOY_PLAYBOOK + '.yml'],
  payload: {tags: 'active_ping_checks'}
}, {
  name: ARDANA_START_PLAYBOOK,
  label: translate('server.deploy.progress.activate'),
  playbooks: [ARDANA_START_PLAYBOOK + '.yml'],
  payload: {limit: {}}
}];

// This is the deployment page for adding compute servers
// process. If newHosts are not recorded in progress.json,
// it will first get newHosts and save it the progress.json.
// Once newHosts are available, it will launch the following
// playbooks to finish up deploying newly added compute servers.
// ansible-playbook -i hosts/verb_hosts wipe_disks.yml --limit <hostname,hostname,hostname>
// ansible-playbook -i hosts/verb_hosts ardana-gen-hosts-file.yml"
// ansible-playbook -i hosts/verb_hosts site.yml --limit <hostname, hostname, hostname>
// ansible-playbook -i hosts/verb_hosts monasca-deploy.yml --tags "active_ping_checks"
class DeployAddServers extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);

    this.playbooks = [];
    this.steps = [];

    this.state = {
      overallStatus: STATUS.UNKNOWN, // overall status of entire playbook
      showPlabybookProcess: false,
      processErrorBanner: '',
      // this loading indicator
      loading: false,
      // warning message
      warningMessage: undefined
    };
  }

  componentDidMount() {
    // go get hostnames, if there are no recorded found
    // this will take some time
    // will request with no-cache
    if(!this.props.operationProps.newHosts) {
      this.setState({loading: true});
      fetchJson(
        '/api/v1/clm/model/cp_internal/CloudModel.yaml', undefined, true, true
      )
        .then((cloudModel) => {
          let newHosts = this.getAddedComputeHosts(cloudModel);
          let cleanedHosts = newHosts.filter(host => host['hostname'] !== undefined);
          this.setState({loading: false});
          if(cleanedHosts.length > 0) {
            // https://bugzilla.novell.com/show_bug.cgi?id=1109043
            // If added hosts are all in the same nic-mapping, validation passes,
            // but could generate some servers without hostname or ardana-ansible_host
            // need filter the one without hostname to continue processing
            if (cleanedHosts.length < newHosts.length) {
              let allIds = newHosts.map(host => host.id);
              let cleanedIds = cleanedHosts.map(host => host.id);
              let skipIds = allIds.filter(id => !cleanedIds.includes(id));
              this.setState({
                warningMessage: translate('server.addserver.skip.emptyhostnames', skipIds.join(','))
              });
            }
            // at this point we should have some operationProps
            let opProps = Object.assign({}, this.props.operationProps);
            opProps.newHosts = cleanedHosts; // need for complete message
            this.props.updateGlobalState('operationProps', opProps);
            this.setState({showPlabybookProcess: true});
          }
          else { //no new hostnames, show not happen just in case
            this.setState({
              processErrorBanner: translate('server.addserver.emptyhostnames'),
              overallStatus: STATUS.FAILED
            });
          }
        })
        .catch((error) => {
          this.setState({
            processErrorBanner: error.toString(), overallStatus: STATUS.FAILED, loading: false
          });
        });
    }
    else {
      this.setState({showPlabybookProcess: true});
    }
  }

  getDeployServerTitle = () => {
    return translate('server.addserver.compute.deploy');
  }

  getDeployFailureMsg = () => {
    return translate('server.addserver.deploy.failure');
  }

  getAddedComputeHosts = (cloudModel) => {
    let deployedServerIds = this.props.operationProps?.deployedServers.map(server => server.id) || [];

    // get new hostnames for compute nodes
    let hosts = cloudModel['internal']['servers'];
    hosts = hosts.filter(host => {
      return !deployedServerIds.includes(host.id) && host['role'].includes('COMPUTE');
    });

    let  newServers = hosts.map(host => {
      return {
        // generated hostname by ardana, this will be used
        // to set --limit during deployment
        // for example, ardana-cp1-comp0004
        hostname: host['ardana_ansible_host'],
        id: host['id'],
        ip: host['addr'],
        // generated display hostname , for example, ardana-cp1-comp0004-mgmt
        // this will be used for complete message
        display_hostname: host['hostname']
      };
    });

    return newServers;
  }

  setNextButtonDisabled = () => this.state.overallStatus != STATUS.COMPLETE;

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
    if (status === STATUS.FAILED) {
      this.setState({
        processErrorBanner: this.getDeployFailureMsg()});
    }
  }

  getPlaybooksAndSteps = () => {
    this.steps = PLAYBOOK_POSSIBLE_STEPS.filter((step) => {
      if(!this.props.operationProps.wipeDisk &&
        !this.props.operationProps.activate) {
        return step.name !== WIPE_DISKS_PLAYBOOK && step.name !== ARDANA_START_PLAYBOOK;
      }
      else if(!this.props.operationProps.wipeDisk) {
        return step.name !== WIPE_DISKS_PLAYBOOK;
      }
      else if(!this.props.operationProps.activate) {
        return step.name !== ARDANA_START_PLAYBOOK;
      }
      else {
        return true;
      }
    });

    let newHostNames = this.props.operationProps.newHosts.map(host => host['hostname']);
    this.playbooks = this.steps.map(step => {
      let retBook = {name: step.name};
      if (step.payload) {
        if(step.payload.limit) {
          step.payload.limit = newHostNames.join(',');
        }
        retBook.payload = step.payload;
      }
      return retBook;
    });
  }

  toShowLoadingMask = () => {
    return this.props.wizardLoading || this.state.loading;
  }

  isValidToRenderPlaybookProgress = () => {
    return (
      this.state.showPlabybookProcess && !this.props.wizardLoading && !this.state.loading &&
      this.props.operationProps.newHosts && this.props.operationProps.newHosts.length > 0
    );
  }

  renderPlaybookProgress () {
    this.getPlaybooksAndSteps();
    return (
      <PlaybookProgress
        updatePageStatus = {this.updatePageStatus} updateGlobalState = {this.props.updateGlobalState}
        playbookStatus = {this.props.playbookStatus} steps = {this.steps}
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

  renderSkipWarning () {
    return (
      <div className='notification-message-container'>
        <WarningMessage
          message={this.state.warningMessage}
          closeAction={() => this.setState({warningMessage: undefined})}/>
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
          {this.renderHeading(this.getDeployServerTitle())}
        </div>
        <div className='wizard-content'>
          {this.isValidToRenderPlaybookProgress() && this.renderPlaybookProgress()}
          {cancel && this.renderProcessError()}
          {this.state.warningMessage && this.renderSkipWarning()}
        </div>
        {this.renderNavButtons(cancel)}
      </div>
    );
  }
}

export default DeployAddServers;
