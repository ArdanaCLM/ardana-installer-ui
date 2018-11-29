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
import BaseUpdateWizardPage from '../BaseUpdateWizardPage.js';
import { STATUS } from '../../utils/constants.js';
import { LoadingMask } from '../../components/LoadingMask.js';
import { getHostFromCloudModel } from '../../utils/ModelUtils.js';
import { PlaybookProgress } from '../../components/PlaybookProgress.js';
import { ErrorBanner } from '../../components/Messages.js';
import { putJson, deleteJson, fetchJson } from '../../utils/RestUtils.js';
import { ActionButton } from '../../components/Buttons.js';
import { ConfirmModal } from '../../components/Modals.js';
import InstanceMigrationMonitor from './InstanceMigrationMonitor.js';

const DISABLE_COMPUTE_SERVICE = 'disable_compute_service';
const REMOVE_FROM_AGGREGATES = 'remove_from_aggregates';
const MIGRATE_INSTANCES = 'migrate_instances';
const MIGRATE_INSTANCES_SKIP = 'migrate_instances_skip';
const DISABLE_NETWORK_AGENTS = 'disable_network_agents';

// This is the page to disable compute service, delete aggregates
// migrate instances to the new compute host and disable network
// agents for the old compute host
class DisableComputeServiceNetwork extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);
    this.state = {
      overallStatus: STATUS.UNKNOWN, // overall status of entire playbook
      showPlabybookProcess: false,
      processErrorBanner: '',
      loading: false,
      // confirmation dialog when results contain failed
      partialFailedConfirmation: undefined,
      partialFailedConfirmMsg: undefined,
      // monitor instances migration polling
      migrationMonitorModal: undefined,
      migrationData: undefined
    };
  }

  componentDidMount() {
    if (!this.props.operationProps.oldServer.hostname) {
      this.setState({loading: true});
      // fetchJson with url, init=undefined, forceLogin=true, noCache=true
      fetchJson(
        '/api/v1/clm/model/cp_internal/CloudModel.yaml', undefined, true, true
      )
        .then((cloudModel) => {
          this.setState({loading: false});
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
            this.setState({showPlabybookProcess: true});
          }
          else { // no old or new hostname, should not happen, just in case
            this.setState({
              processErrorBanner: translate(
                'server.deploy.progress.compute.emptyhost', this.props.operationProps.oldServer.id,
                oldHost, this.props.operationProps.server.id, newHost),
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
    else { //have the hostname already
      this.setState({showPlabybookProcess: true});
    }
  }

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
    if (status === STATUS.FAILED) {
      this.setState({
        processErrorBanner:
          translate('server.deploy.progress.disable_compute_service_network.failure')
      });
    }
  }

  setNextButtonDisabled = () => this.state.overallStatus != STATUS.COMPLETE;

  isValidToRenderPlaybookProgress = () => {
    return (
      this.state.showPlabybookProcess && !this.props.wizardLoading && !this.state.loading &&
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

  logResponse = (logger, response, msg) => {
    logger(msg + '\n');
    let lines = '';
    if (Array.isArray(response)) {
      lines = response.map(item => JSON.stringify(item)).join('\n');
      logger(lines + '\n');
    }
    else {
      let items;
      if (response.failed) {
        logger('failed:\n');
        items = response.failed;
        lines = items.map(item => JSON.stringify(item)).join('\n');
        logger(lines + '\n');
      }
      if (response.disabled) {
        logger('disabled:\n');
        items = response.disabled;
        lines = items.map(item => JSON.stringify(item)).join('\n');
        logger(lines + '\n');
      }
      if (response.deleted) {
        logger('deleted:\n');
        items = response.deleted;
        lines = items.map(item => JSON.stringify(item)).join('\n');
        logger(lines + '\n');
      }
      if(response.migrating) {
        logger('migrating:\n');
        items = response.migrating;
        lines = items.map(item => JSON.stringify(item)).join('\n');
        logger(lines + '\n');
      }
    }
  }

  logError = (logger, error, msg) => {
    logger(msg + '\n');
    if (error.value?.contents?.failed) {
      let failedLines =
        error.value.contents.failed.map(item => JSON.stringify(item)).join('\n');
      logger('\n' + failedLines);
    }
  }

  disableCompServices = (logger) => {
    const apiUrl =
      '/api/v1/clm/compute/services/' + this.props.operationProps.oldServer.hostname +
      '/disable';
    logger('\nPUT ' + apiUrl + '\n');
    return putJson(apiUrl)
      .then((response) => {
        const msg = translate(
          'server.deploy.progress.response.disable_compute_service',
          this.props.operationProps.oldServer.hostname);
        this.logResponse(logger, response, msg);
      })
      .catch((error) => {
        // have no compute service for the old compute node
        // move on
        if(error.status === 410) {
          const msg = translate(
            'server.deploy.progress.no_compute_service',
            this.props.operationProps.oldServer.hostname);
          logger(msg + '\n');
        }
        else if(error.status === 500 &&
          error.value?.contents?.failed && error.value?.contents?.disabled?.length > 0) {
          const msg = translate(
            'server.deploy.progress.response.disable_compute_service',
            this.props.operationProps.oldServer.hostname);
          this.logResponse(logger, error.value.contents, msg);
          // have partial failure
          // pop up message for user to confirm
          return new Promise((resolve, reject) => {
            this.showPartialFailedConfirmation(
              resolve, reject,
              logger, 'server.deploy.progress.disable_compute_service.hasfailed',
              error.value.contents.failed);
          });
        }
        else {
          const msg =
            translate(
              'server.deploy.progress.disable_compute_service.failure',
              this.props.operationProps.oldServer.hostname, error.toString());
          this.logError(logger, error, msg);
          throw new Error(msg);
        }
      });
  }

  removeAggregates = (logger) => {
    const apiUrl =
      '/api/v1/clm/compute/aggregates/' + this.props.operationProps.oldServer.hostname;
    logger('\nDELETE ' + apiUrl + '\n');
    return deleteJson(apiUrl)
      .then((response) => {
        const msg = translate(
          'server.deploy.progress.response.remove_from_aggregates',
          this.props.operationProps.oldServer.hostname);
        this.logResponse(logger, response, msg);
      })
      .catch((error) => {
        // have no compute service for the old compute node
        // move on
        if (error.status === 410) {
          const msg = translate('server.deploy.progress.no_aggregates',
            this.props.operationProps.oldServer.hostname);
          logger(msg + '\n');
        }
        else if(error.status === 500 &&
          error.value?.contents?.failed && error.value?.contents?.deleted?.length > 0) {
          const msg = translate(
            'server.deploy.progress.response.remove_from_aggregates',
            this.props.operationProps.oldServer.hostname);
          this.logResponse(logger, error.value.contents, msg);
          // have partial failure
          // pop up message for user to confirm
          return new Promise((resolve, reject) => {
            this.showPartialFailedConfirmation(
              resolve, reject,
              logger, 'server.deploy.progress.remove_from_aggregates.hasfailed',
              error.value.contents.failed);
          });
        } else {
          const msg =
            translate('server.deploy.progress.remove_from_aggregates.failure',
              this.props.operationProps.oldServer.hostname,
              error.toString());
          this.logError(logger, error, msg);
          throw new Error(msg);
        }
      });
  }

  migrateInstances = (logger) => {
    const apiUrl =
      '/api/v1/clm/compute/instances/' + this.props.operationProps.oldServer.hostname +
      '/' + this.props.operationProps.server.hostname + '/migrate';
    logger('\nPUT ' + apiUrl + '\n');
    return putJson(apiUrl)
      .then((response) => {
        const msg =
          translate(
            'server.deploy.progress.response.migrate_instances',
            this.props.operationProps.oldServer.hostname,
            this.props.operationProps.server.hostname);
        this.logResponse(logger, response, msg);
        //poll to find out migration is done
        logger('\n' + translate('server.deploy.progress.monitor_migration') + '\n');
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
          const msg = translate('server.deploy.progress.no_instances',
            this.props.operationProps.oldServer.hostname);
          logger(msg + '\n');
        }
        else if(error.status === 500 &&
          error.value?.contents?.failed && error.value?.contents?.migrating?.length > 0) {
          const msg =
          translate(
            'server.deploy.progress.response.migrate_instances',
            this.props.operationProps.oldServer.hostname,
            this.props.operationProps.server.hostname);
          this.logResponse(logger, error.value.contents, msg);
          // has partial failure
          // pop up message for user to confirm
          return new Promise((resolve, reject) => {
            this.showPartialFailedConfirmation(
              resolve, reject,
              logger, 'server.deploy.progress.migrate_instances.hasfailed',
              error.value.contents.failed, error.value.contents.migrating);
          });
        }
        else {
          const msg =
            translate('server.deploy.progress.migrate_instances.failure',
              this.props.operationProps.oldServer.hostname,
              this.props.operationProps.server.hostname, error.toString());
          this.logError(logger, error, msg);
          throw new Error(msg);
        }
      });
  }

  disableNetworkAgents = (logger) => {
    const apiUrl =
      '/api/v1/clm/network/agents/' + this.props.operationProps.oldServer.hostname +
      '/disable';
    logger('\nPUT ' + apiUrl + '\n');
    return putJson(apiUrl)
      .then((response) => {
        const msg = translate(
          'server.deploy.progress.response.disable_network_agents',
          this.props.operationProps.oldServer.hostname);
        this.logResponse(logger, response, msg);
        // response has partial failure
        if(response['failed']) {
          // pop up message for user to confirm
          return new Promise((resolve, reject) => {
            this.showPartialFailedConfirmation(
              resolve, reject,
              logger, 'server.deploy.progress.disable_network_agents.hasfailed',
              response.failed);
          });
        }
      })
      .catch((error) => {
        // have no network agents for the old compute node
        // move on
        if(error.status === 410) {
          const msg = translate(
            'server.deploy.progress.no_network_agents', this.props.operationProps.oldServer.hostname);
          logger(msg + '\n');
        }
        else if(error.status === 500 &&
          error.value?.contents?.failed && error.value?.contents?.disabled?.length > 0) {
          const msg = translate(
            'server.deploy.progress.response.disable_network_agents',
            this.props.operationProps.oldServer.hostname);
          this.logResponse(logger, error.value.contents, msg);
          // have partial failure
          // pop up message for user to confirm
          return new Promise((resolve, reject) => {
            this.showPartialFailedConfirmation(
              resolve, reject,
              logger, 'server.deploy.progress.disable_network_agents.hasfailed',
              error.value.contents.failed);
          });
        }
        else {
          const msg =
            translate('server.deploy.progress.disable_network_agents.failure',
              this.props.operationProps.oldServer.hostname,
              error.toString());
          this.logError(logger, error, msg);
          throw new Error(msg);
        }
      });
  }

  getSteps = () => {
    let steps = [{
      label: translate('server.deploy.progress.disable_compute_service'),
      playbooks: [DISABLE_COMPUTE_SERVICE]
    }, {
      label: translate('server.deploy.progress.remove_from_aggregates'),
      playbooks: [REMOVE_FROM_AGGREGATES]
    }];

    if (!this.props.operationProps.oldServer.isReachable) {
      steps.push({
        label: translate('server.deploy.progress.migrate_instances'),
        playbooks: [MIGRATE_INSTANCES]
      });
    }
    // if the old compute is not reachable, at this point
    // user has confirmed earlier that no instances migration is ok
    else {
      steps.push({
        label: translate('server.deploy.progress.migrate_instances.skip'),
        playbooks: [MIGRATE_INSTANCES_SKIP]
      });
    }

    steps.push({
      label: translate('server.deploy.progress.disable_network_agents'),
      playbooks: [DISABLE_NETWORK_AGENTS]
    });
    return steps;
  }

  getPlaybooks = () => {
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

    // migrate instances when old compute host is reachable
    if(!this.props.operationProps.oldServer.isReachable) {
      playbooks.push({
        name: MIGRATE_INSTANCES,
        action: ((logger) => {
          return this.migrateInstances(logger);
        })
      });
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
        this.state.migrationMonitorModal.logger(
          '\n' + translate('server.deploy.progress.abort') + '\n');
        if(migrationInfo) {
          migrationInfo.started = this.state.migrationData.length;
          this.state.migrationMonitorModal.logger(JSON.stringify(migrationInfo) + '\n');
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
        this.state.migrationMonitorModal.logger(
          '\n' + translate('server.deploy.progress.migration_monitor_done') + '\n');
        migrationInfo.started = this.state.migrationData.length;
        this.state.migrationMonitorModal.logger(JSON.stringify(migrationInfo) + '\n');
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
        this.state.partialFailedConfirmation.logger(
          '\n' + translate('server.deploy.progress.abort') + '\n');
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
          logger('\n' + translate('server.deploy.progress.monitor_migration') + '\n');
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

    return (
      <PlaybookProgress
        updatePageStatus={this.updatePageStatus} updateGlobalState={this.props.updateGlobalState}
        playbookStatus={this.props.playbookStatus} steps={steps} playbooks={playbooks}/>
    );
  }

  renderProcessError() {
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
        <LoadingMask show={this.props.wizardLoading || this.state.loading}/>
        <div className='content-header'>
          {this.renderHeading(translate('server.deploy.progress.disable_compute_service_network'))}
        </div>
        <div className='wizard-content'>
          <If condition={this.isValidToRenderPlaybookProgress()}>{this.renderPlaybookProgress()}</If>
          <If condition={cancel}>{this.renderProcessError()}</If>
        </div>
        {this.renderNavButtons(cancel)}
        {this.renderPartialFailedConfirmation()}
        {this.renderMigrationMonitorModal()}
      </div>
    );
  }
}

export default DisableComputeServiceNetwork;
