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
import { ErrorBanner, WarningMessage } from '../../components/Messages.js';
import { PlaybookProgress } from '../../components/PlaybookProgress.js';
import { translate } from '../../localization/localize.js';
import * as constants from '../../utils/constants.js';
import { getInternalModel } from '../topology/TopologyUtils.js';


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
      ...this.state,
      overallStatus: constants.STATUS.UNKNOWN, // overall status of entire playbook
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
      getInternalModel()
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

            opProps = this.getOldServerHost(cloudModel, opProps);
            this.props.updateGlobalState('operationProps', opProps);

            this.checkEncryptKeyAndProceed();
          }
          else { //no new hostnames, should not happen just in case
            this.setState({
              processErrorBanner: translate('server.addserver.emptyhostnames'),
              overallStatus: constants.STATUS.FAILED
            });
          }
        })
        .catch((error) => {
          this.setState({
            processErrorBanner: error.toString(), overallStatus: constants.STATUS.FAILED, loading: false
          });
        });
    }
    else {
      this.checkEncryptKeyAndProceed();
    }
  }

  getOldServerHost =  (cloudModel, opProps) => {
    return opProps; // do nothing for just add compute
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
        // generated display hostname , for example, ardana-cp1-comp0004-mgmt
        // this will be used for complete message
        hostname: host['hostname'],
        id: host['id'],
        ip: host['addr'],
        // generated hostname by ardana, this will be used
        // to set --limit during deployment
        // for example, ardana-cp1-comp0004
        ansible_hostname: host['ardana_ansible_host']
      };
    });

    return newServers;
  }

  setNextButtonDisabled = () => this.state.overallStatus != constants.STATUS.COMPLETE;

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
    if (status === constants.STATUS.FAILED) {
      this.setState({
        processErrorBanner: this.getDeployFailureMsg()});
    }
  }

  getPlaybooksAndSteps = () => {

    const PLAYBOOK_POSSIBLE_STEPS = [{
      name: constants.WIPE_DISKS_PLAYBOOK,
      label: translate('server.deploy.progress.wipe-disks'),
      playbooks: [constants.WIPE_DISKS_PLAYBOOK + '.yml'],
      payload: {limit: {}}
    }, {
      name: constants.ARDANA_GEN_HOSTS_FILE_PLAYBOOK,
      label: translate('server.deploy.progress.gen-hosts-file'),
      playbooks: [constants.ARDANA_GEN_HOSTS_FILE_PLAYBOOK + '.yml']
    }, {
      name: constants.SITE_PLAYBOOK,
      label: translate('server.deploy.progress.addserver.deploy'),
      playbooks: [constants.SITE_PLAYBOOK + '.yml'],
      payload: {limit: {}}
    }, {
      name: constants.MONASCA_DEPLOY_PLAYBOOK,
      label: translate('server.deploy.progress.update-monasca'),
      playbooks: [constants.MONASCA_DEPLOY_PLAYBOOK + '.yml'],
      payload: {tags: 'active_ping_checks'}
    }, {
      name: constants.ARDANA_START_PLAYBOOK,
      label: translate('server.deploy.progress.activate'),
      playbooks: [constants.ARDANA_START_PLAYBOOK + '.yml'],
      payload: {limit: {}}
    }];

    this.steps = PLAYBOOK_POSSIBLE_STEPS.filter((step) => {
      if(!this.props.operationProps.wipeDisk &&
        !this.props.operationProps.activate) {
        return step.name !== constants.WIPE_DISKS_PLAYBOOK && step.name !== constants.ARDANA_START_PLAYBOOK;
      }
      else if(!this.props.operationProps.wipeDisk) {
        return step.name !== constants.WIPE_DISKS_PLAYBOOK;
      }
      else if(!this.props.operationProps.activate) {
        return step.name !== constants.ARDANA_START_PLAYBOOK;
      }
      else {
        return true;
      }
    });

    let newHostNames =
      this.props.operationProps.newHosts.map(host => host['ansible_hostname']);
    this.playbooks = this.steps.map(step => {
      let retBook = {name: step.name};
      if (step.payload) {
        if(step.payload.limit) {
          step.payload.limit = newHostNames.join(',');
        }
        retBook.payload = step.payload;
      }
      // When this component is used in replace compute flow.
      // Have a old server and old server is not reachable
      // special case for ARDANA_GEN_HOSTS_FILE_PLAYBOOK to exclude
      // the old server
      else if(step.name === constants.ARDANA_GEN_HOSTS_FILE_PLAYBOOK) {
        retBook = this.excludeOldServerForGenHostFile(retBook);
      }
      return retBook;
    });
  }

  excludeOldServerForGenHostFile = (book) => {
    return book; //do nothing for add compute
  }

  toShowLoadingMask = () => {
    return this.props.wizardLoading || this.state.loading;
  }

  isValidToRenderPlaybookProgress = () => {
    return (
      this.state.showPlaybookProcess && !this.props.wizardLoading && !this.state.loading &&
      this.props.operationProps.newHosts && this.props.operationProps.newHosts.length > 0
    );
  }

  renderPlaybookProgress () {
    this.getPlaybooksAndSteps();
    // common_payload will be merged with individual playbook payload when luanch
    // playbook in PlaybookProgress
    let common_payload = {'extra-vars': {encrypt: this.props.encryptKey || ''}};
    return (
      <PlaybookProgress
        payload={common_payload}
        updatePageStatus = {this.updatePageStatus} updateGlobalState = {this.props.updateGlobalState}
        playbookStatus = {this.props.playbookStatus} steps = {this.steps}
        playbooks = {this.playbooks} isUpdateMode = {true}/>
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

  renderSkipWarning () {
    return (
      <div className='notification-message-container'>
        <WarningMessage
          message={this.state.warningMessage}
          closeAction={() => this.setState({warningMessage: undefined})}/>
      </div>
    );
  }

  renderFooterButtons (showCancel, showRetry) {
    // Will have a specific cancel confirmation message when user clicks
    // cancel button.
    let cancelMsg = translate('server.addserver.failure.cancel.confirm');
    return this.renderNavButtons(showCancel, showRetry, cancelMsg);
  }

  render() {
    // If error happens, will show cancel and retry buttons.
    let failed =  this.state.overallStatus === constants.STATUS.FAILED;
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.toShowLoadingMask()}/>
        <div className='content-header'>
          {this.renderHeading(this.getDeployServerTitle())}
        </div>
        <div className='wizard-content'>
          {this.isValidToRenderPlaybookProgress() && this.renderPlaybookProgress()}
          {failed && this.renderProcessError()}
          {this.state.warningMessage && this.renderSkipWarning()}
          {this.renderEncryptKeyModal()}
        </div>
        {this.renderFooterButtons(failed, failed)}
      </div>
    );
  }
}

export default DeployAddServers;
