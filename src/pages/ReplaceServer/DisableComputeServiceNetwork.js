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

import { translate } from '../../localization/localize.js';
import BaseUpdateWizardPage from '../BaseUpdateWizardPage.js';
import * as constants from '../../utils/constants.js';
import { LoadingMask } from '../../components/LoadingMask.js';
import { getHostFromCloudModel } from '../../utils/ModelUtils.js';
import { PlaybookProgress } from '../../components/PlaybookProgress.js';
import { ErrorBanner } from '../../components/Messages.js';
import { putJson, deleteJson } from '../../utils/RestUtils.js';
import { ActionButton } from '../../components/Buttons.js';
import { ConfirmModal } from '../../components/Modals.js';
import InstanceMigrationMonitor from './InstanceMigrationMonitor.js';
import { logProgressResponse, logProgressError } from '../../utils/MiscUtils.js';
import { getInternalModel } from '../topology/TopologyUtils.js';

const DISABLE_COMPUTE_SERVICE = 'disable_compute_service';
const REMOVE_FROM_AGGREGATES = 'remove_from_aggregates';
const MIGRATE_INSTANCES = 'migrate_instances';
const DISABLE_NETWORK_AGENTS = 'disable_network_agents';

// This is the page to disable compute service, delete aggregates
// migrate instances to the new compute host and disable network
// agents for the old compute host
class DisableComputeServiceNetwork extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      overallStatus: constants.STATUS.UNKNOWN, // overall status of entire playbook
      processErrorBanner: '',
      loading: false,
      // confirmation dialog when results contain failed
      partialFailedConfirmation: undefined,
      partialFailedConfirmMsg: undefined,
      // monitor instances migration polling
      migrationMonitorModal: undefined,
      migrationData: undefined,
      heading: translate('server.deploy.progress.disable_compute_service_network')
    };
  }

  componentDidMount() {
    if (this.needGetHostName()) {
      this.setState({loading: true});
      getInternalModel()
        .then((cloudModel) => {
          this.setState({loading: false});
          this.getHostName(cloudModel);
        })
        .catch((error) => {
          this.setState({
            processErrorBanner: error.toString(), overallStatus: constants.STATUS.FAILED, loading: false
          });
        });
    }
    else { //have the hostname already
      this.checkEncryptKeyAndProceed();
    }
  }

  needGetHostName() {
    return (
      !this.props.operationProps.oldServer.hostname ||
      !this.props.operationProps.server.hostname);
  }

  getHostName(cloudModel) {
    let oldHost =
      getHostFromCloudModel(cloudModel, this.props.operationProps.oldServer.id);
    let newHost =
      getHostFromCloudModel(cloudModel, this.props.operationProps.server.id);
    if (oldHost && newHost) {
      let opProps = Object.assign({}, this.props.operationProps);
      // save the host names for old compute node
      opProps.oldServer['hostname'] = oldHost['hostname'];
      opProps.oldServer['ansible_hostname'] = oldHost['ansible_hostname'];
      // save the host names for new compute node
      opProps.server['hostname'] = newHost['hostname'];
      opProps.server['ansible_hostname'] = newHost['ansible_hostname'];
      this.props.updateGlobalState('operationProps', opProps);
      this.checkEncryptKeyAndProceed();
    }
    else { // no old or new hostname, should not happen, just in case
      this.setState({
        processErrorBanner: translate(
          'server.deploy.progress.compute.emptyhost', this.props.operationProps.oldServer.id,
          oldHost, this.props.operationProps.server.id, newHost),
        overallStatus: constants.STATUS.FAILED
      });
    }
  }

  updatePageStatus = (status, error) => {
    this.setState({overallStatus: status});
    if (status === constants.STATUS.FAILED) {
      const errorMsg = error?.message || '';
      this.setState({
        processErrorBanner:
          translate(
            'server.deploy.progress.disable_compute_service_network.failure', errorMsg)
      });
    }
  }

  setNextButtonDisabled = () => this.state.overallStatus != constants.STATUS.COMPLETE;

  isValidToRenderPlaybookProgress = () => {
    return (
      this.state.showPlaybookProcess && !this.props.wizardLoading && !this.state.loading &&
      this.props.operationProps.oldServer.hostname
    );
  }

  showPartialFailedConfirmation = (resolve, reject, logger, msgKey, failed, migrating) => {
    let failedLines = failed.map(item => JSON.stringify(item)).join('\n');
    this.setState({
      'partialFailedConfirmation': {
        'resolve': resolve,
        'reject': reject,
        'logger': logger
      },
      'partialFailedConfirmMsg': translate(
        msgKey, this.props.operationProps.oldServer.hostname, failedLines),
      'migrationData': migrating
    });
  }

  partialFailureDialogPromise = (logger, error, logMsg, dialogMsgKey) => {
    logProgressResponse(logger, error.value.contents, logMsg);
    // have partial failure
    // pop up message for user to confirm
    return new Promise((resolve, reject) => {
      this.showPartialFailedConfirmation(
        resolve, reject, logger, dialogMsgKey,
        // always have failed, migrating could be undefined
        error.value.contents.failed, error.value.contents.migrating);
    });
  }

  disableCompServices = (logger) => {
    const apiUrl =
      '/api/v2/compute/services/' + this.props.operationProps.oldServer.hostname +
      '/disable';
    logger('PUT ' + apiUrl);
    return putJson(apiUrl)
      .then((response) => {
        const logMsg =
            'Got response from disabling compute services for compute host ' +
            this.props.operationProps.oldServer.hostname;
        logProgressResponse(logger, response, logMsg);
      })
      .catch((error) => {
        // have no compute service for the old compute node
        // move on
        if(error.status === 410) {
          logger(
            'Warning: No compute service found for compute host ' +
            this.props.operationProps.oldServer.hostname + ', continue...');
        }
        else if(error.status === 500 &&
          error.value?.contents?.failed && error.value?.contents?.disabled?.length > 0) {
          const logMsg =
            'Got response from disabling compute services for compute host ' +
            this.props.operationProps.oldServer.hostname;
          return this.partialFailureDialogPromise(
            logger, error, logMsg, 'server.deploy.progress.disable_compute_service.hasfailed');
        }
        else {
          const logMsg =
            'Error: Failed to disable compute services for compute host ' +
            this.props.operationProps.oldServer.hostname + '. ' + error.toString();
          logProgressError(logger, error, logMsg);
          const msg =
            translate(
              'server.deploy.progress.disable_compute_service.failure',
              this.props.operationProps.oldServer.hostname, error.toString());
          throw new Error(msg);
        }
      });
  }

  removeAggregates = (logger) => {
    const apiUrl =
      '/api/v2/compute/aggregates/' + this.props.operationProps.oldServer.hostname;
    logger('DELETE ' + apiUrl);
    return deleteJson(apiUrl)
      .then((response) => {
        const logMsg =
          'Got response from removing aggregates for compute host ' +
          this.props.operationProps.oldServer.hostname;
        logProgressResponse(logger, response, logMsg);
      })
      .catch((error) => {
        // have no compute service for the old compute node
        // move on
        if (error.status === 410) {
          const logMsg =
            'Warning: No aggregates found for compute host ' +
            this.props.operationProps.oldServer.hostname + ', continue...';
          logger(logMsg);
        }
        else if(error.status === 500 &&
          error.value?.contents?.failed && error.value?.contents?.deleted?.length > 0) {
          const logMsg =
            'Got response from removing aggregates for compute host ' +
            this.props.operationProps.oldServer.hostname;
          return this.partialFailureDialogPromise(
            logger, error, logMsg, 'server.deploy.progress.remove_from_aggregates.hasfailed');
        }
        else {
          const logMsg =
            'Error: Failed to remove aggregates for compute host ' +
            this.props.operationProps.oldServer.hostname + '. ' + error.toString();
          logProgressError(logger, error, logMsg);
          const msg =
            translate('server.deploy.progress.remove_from_aggregates.failure',
              this.props.operationProps.oldServer.hostname,
              error.toString());
          throw new Error(msg);
        }
      });
  }

  migrateInstances = (logger) => {
    if(!this.props.operationProps.server) return;
    const apiUrl =
      '/api/v2/compute/instances/' + this.props.operationProps.oldServer.hostname +
      '/' + this.props.operationProps.server.hostname + '/migrate';
    logger('PUT ' + apiUrl);
    return putJson(apiUrl)
      .then((response) => {
        const logMsg =
          'Got response from starting live migration from compute host ' +
          this.props.operationProps.oldServer.hostname + ' to ' +
          this.props.operationProps.server.hostname;
        logProgressResponse(logger, response, logMsg);
        //poll to find out migration is done
        logger('Starting monitoring instances migration...');
        return new Promise((resolve, reject) => {
          this.setState({
            'migrationMonitorModal': {
              'resolve': resolve,
              'reject': reject,
              'logger': logger
            },
            'migrationData': response
          });
        });
      })
      .catch((error) => {
        // have no compute service for the old compute node
        if (error.status === 410) {
          const logMsg =
            'Warning: No instance found for compute host ' +
            this.props.operationProps.oldServer.hostname + ', continue...';
          logger(logMsg);
        }
        else if(error.status === 500 &&
          error.value?.contents?.failed && error.value?.contents?.migrating?.length > 0) {
          const logMsg =
            'Got response from starting live migration from compute host ' +
            this.props.operationProps.oldServer.hostname + ' to ' +
            this.props.operationProps.server.hostname;
          return this.partialFailureDialogPromise(
            logger, error, logMsg, 'server.deploy.progress.migrate_instances.hasfailed');
        }
        else {
          const logMsg =
            'Error: Failed to start live migration from compute host ' +
            this.props.operationProps.oldServer.hostname + ' to ' +
            this.props.operationProps.server.hostname + '. ' + error.toString();
          logProgressError(logger, error, logMsg);
          const msg =
            translate('server.deploy.progress.migrate_instances.failure',
              this.props.operationProps.oldServer.hostname,
              this.props.operationProps.server.hostname, error.toString());
          throw new Error(msg);
        }
      });
  }

  disableNetworkAgents = (logger) => {
    const apiUrl =
      '/api/v2/network/agents/' + this.props.operationProps.oldServer.hostname +
      '/disable';
    logger('PUT ' + apiUrl);
    return putJson(apiUrl)
      .then((response) => {
        const logMsg =
          'Got response from disabling network agents for compute host ' +
          this.props.operationProps.oldServer.hostname;
        logProgressResponse(logger, response, logMsg);
      })
      .catch((error) => {
        // have no network agents for the old compute node
        // move on
        if(error.status === 410) {
          const logMsg =
            'No network agents found for compute host ' +
            this.props.operationProps.oldServer.hostname + ', continue...';
          logger(logMsg);
        }
        else if(error.status === 500 &&
          error.value?.contents?.failed && error.value?.contents?.disabled?.length > 0) {
          const logMsg =
            'Got response from disabling network agents for compute host ' +
            this.props.operationProps.oldServer.hostname;
          return this.partialFailureDialogPromise(
            logger, error, logMsg, 'server.deploy.progress.disable_network_agents.hasfailed');
        }
        else {
          const logMsg =
            'Error: Failed to disable network agents for compute host ' +
            this.props.operationProps.oldServer.hostname + '. ' + error.toString();
          logProgressError(logger, error, logMsg);
          const msg =
            translate('server.deploy.progress.disable_network_agents.failure',
              this.props.operationProps.oldServer.hostname,
              error.toString());
          throw new Error(msg);
        }
      });
  }

  getSteps() {
    let steps = [{
      label: translate('server.deploy.progress.disable_compute_service'),
      playbooks: [DISABLE_COMPUTE_SERVICE]
    }, {
      label: translate('server.deploy.progress.remove_from_aggregates'),
      playbooks: [REMOVE_FROM_AGGREGATES]
    }];

    if (this.props.operationProps.oldServer.hasInstances &&
        this.props.operationProps.server) {
      if(this.props.operationProps.oldServer.isReachable) {
        // Migrate instances when old compute host is reachable
        // and has instances
        steps.push({
          label: translate('server.deploy.progress.migrate_instances'),
          playbooks: [MIGRATE_INSTANCES]
        });
      }
      else {
        // Evacuate instances when the old compute is not reachable, it
        // has instances and compute hosts are configured with shared storage
        steps.push({
          label: translate('server.deploy.progress.evacuate_instances'),
          playbooks: [constants.NOVA_HOST_EVACUATE_PLAYBOOK + '.yml']
        });
      }
    }

    steps.push({
      label: translate('server.deploy.progress.disable_network_agents'),
      playbooks: [DISABLE_NETWORK_AGENTS]
    });
    return steps;
  }

  getPlaybooks() {
    let playbooks = [{
      name: DISABLE_COMPUTE_SERVICE,
      action: ((logger) => {
        return this.disableCompServices(logger);
      })
    }, {
      name: REMOVE_FROM_AGGREGATES,
      action: ((logger) => {
        return this.removeAggregates(logger);
      })
    }];

    if(this.props.operationProps.oldServer.hasInstances &&
       this.props.operationProps.server) {
      // Migrate instances when old compute host is reachable
      // and has instances
      if(this.props.operationProps.oldServer.isReachable) {
        playbooks.push({
          name: MIGRATE_INSTANCES,
          action: ((logger) => {
            return this.migrateInstances(logger);
          })
        });
      }
      else {
        // Evacuate instances when the old compute is not reachable, it
        // has instances and compute hosts are configured with shared storage
        playbooks.push({
          name: constants.NOVA_HOST_EVACUATE_PLAYBOOK,
          payload: {'extra-vars': {
            'failed_comp_host': this.props.operationProps.oldServer.hostname,
            'target_comp_host': this.props.operationProps.server.hostname}}
        });
      }
    }

    playbooks.push({
      name: DISABLE_NETWORK_AGENTS,
      action: ((logger) => {
        return this.disableNetworkAgents(logger);
      })
    });

    return playbooks;
  }

  renderMigrationMonitorModal() {
    if (this.state.migrationMonitorModal) {
      const handleCancel = (migrationInfo) => {
        // when have partial failure in migration, partialFailedConfirmation
        // shows up if click yes to continue, the migrationMonitorModal shows up,
        // partialFailedConfirmation Promise delays rejecting until migrationMonitorModal
        // is cancelled.
        if (this.state.partialFailedConfirmation) {
          this.state.partialFailedConfirmation.reject();
          this.setState({
            partialFailedConfirmation: undefined, partialFailedConfirmMsg: undefined
          });
        }
        // don't have parent partialFailedConfirmation
        else {
          this.state.migrationMonitorModal.reject();
        }
        this.state.migrationMonitorModal.logger('User aborted processes.');
        if(migrationInfo) {
          migrationInfo.started = this.state.migrationData.length;
          this.state.migrationMonitorModal.logger(JSON.stringify(migrationInfo));
        }
        this.setState({migrationMonitorModal: undefined, migrationData: undefined});
      };
      const handleDone = (migrationInfo) => {
        // when have partial failure in migration, partialFailedConfirmation
        // shows up if click yes to continue, the migrationMonitorModal shows up,
        // partialFailedConfirmation Promise delays resolving until migrationMonitorModal
        // is done.
        if (this.state.partialFailedConfirmation) {
          this.state.partialFailedConfirmation.resolve();
          this.setState({
            partialFailedConfirmation: undefined, partialFailedConfirmMsg: undefined
          });
        }
        // don't have parent partialFailedConfirmation
        else {
          this.state.migrationMonitorModal.resolve();
        }
        this.state.migrationMonitorModal.logger('Monitoring instances migration is done.');
        migrationInfo.started = this.state.migrationData.length;
        this.state.migrationMonitorModal.logger(JSON.stringify(migrationInfo));
        this.setState({migrationMonitorModal: undefined, migrationData: undefined});
      };

      return (
        <InstanceMigrationMonitor
          title={translate('server.deploy.progress.monitor_migration.heading')}
          cancelAction={handleCancel} doneAction={handleDone}
          migrationData={this.state.migrationData} {...this.props}/>
      );
    }
  }

  renderPartialFailedConfirmation() {
    if (this.state.partialFailedConfirmation) {
      const handleNo = () => {
        this.state.partialFailedConfirmation.reject();
        this.state.partialFailedConfirmation.logger('User aborted processes.');
        this.setState({
          partialFailedConfirmation: undefined, partialFailedConfirmMsg: undefined});
      };
      const handleYes = () => {
        // when have partial failure in migration, partialFailedConfirmation
        // shows up if click yes to continue, the migrationMonitorModal shows up,
        // partialFailedConfirmation Promise delays resolving or rejecting until
        // migrationMonitorModal done or cancel.
        if(this.state.migrationData) {
          let logger = this.state.partialFailedConfirmation.logger;
          logger('Starting monitoring instances migration...');
          this.setState({'migrationMonitorModal': {'logger': logger}});
        }
        else { // don't have instances migration
          this.state.partialFailedConfirmation.resolve();
          this.setState({
            partialFailedConfirmation: undefined, partialFailedConfirmMsg: undefined});
        }
      };

      const footer = (
        <div className="btn-row">
          <ActionButton type='default' clickAction={handleNo} displayLabel={translate('no')}/>
          <ActionButton clickAction={handleYes} displayLabel={translate('yes')}/>
        </div>
      );

      return (
        <ConfirmModal show={true} title={translate('default.warning')}
          onHide={handleNo} footer={footer}>
          {this.state.partialFailedConfirmMsg}</ConfirmModal>
      );
    }
  }

  renderPlaybookProgress() {
    let steps = this.getSteps();
    let playbooks = this.getPlaybooks();
    // common_payload will be merged with individual playbook payload when luanch
    // playbook in PlaybookProgress
    let common_payload = {'extra-vars': {encrypt: this.props.encryptKey || ''}};
    return (
      <PlaybookProgress
        payload={common_payload}
        updatePageStatus={this.updatePageStatus} updateGlobalState={this.props.updateGlobalState}
        playbookStatus={this.props.playbookStatus} steps={steps} playbooks={playbooks}/>
    );
  }

  renderProcessError() {
    return (
      <div className='banner-container'>
        <ErrorBanner message={this.state.processErrorBanner}
          show={this.state.overallStatus === constants.STATUS.FAILED}/>
      </div>
    );
  }

  render() {
    //if error happens, cancel button shows up
    let cancel =  this.state.overallStatus === constants.STATUS.FAILED;
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.props.wizardLoading || this.state.loading}/>
        <div className='content-header'>
          {this.renderHeading(this.state.heading)}
        </div>
        <div className='wizard-content'>
          <If condition={this.isValidToRenderPlaybookProgress()}>{this.renderPlaybookProgress()}</If>
          <If condition={cancel}>{this.renderProcessError()}</If>
        </div>
        {this.renderNavButtons(cancel)}
        {this.renderPartialFailedConfirmation()}
        {this.renderMigrationMonitorModal()}
        {this.renderEncryptKeyModal()}
      </div>
    );
  }
}

export default DisableComputeServiceNetwork;
