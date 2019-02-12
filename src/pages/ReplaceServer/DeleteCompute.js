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
import { STATUS } from '../../utils/constants.js';
import { LoadingMask } from '../../components/LoadingMask.js';
import { PlaybookProgress } from '../../components/PlaybookProgress.js';
import { ErrorBanner } from '../../components/Messages.js';
import { putJson, deleteJson, fetchJson, postJson } from '../../utils/RestUtils.js';
import { ActionButton } from '../../components/Buttons.js';
import { ConfirmModal } from '../../components/Modals.js';
import { logProgressResponse, logProgressError } from '../../utils/MiscUtils.js';
import {
  NOVA_STOP_PLAYBOOK, NEUTRON_STOP_PLAYBOOK, BM_POWER_DOWN_PLAYBOOK,
  COBBLER_DEPLOY_PLAYBOOK, PRE_DEPLOYMENT_PLAYBOOK, MONASCA_DEPLOY_PLAYBOOK,
  CONFIG_PROCESSOR_RUN_PLAYBOOK, READY_DEPLOYMENT_PLAYBOOK,
  MODEL_SERVER_PROPS_ALL} from '../../utils/constants.js';
import { removeServerFromModel, getMergedServer, genUID } from '../../utils/ModelUtils.js';

const MANUAL_SHUTDOWN = 'manual_shutdown';
const DELETE_COMPUTE_SERVICE = 'delete_compute_service';
const DELETE_NETWORK_AGENTS = 'delete_network_agents';
const REMOVE_COMPUTE_FROM_MODEL = 'remove_compute_from_model';
const COMMIT_MODEL_CHANGE = 'commit_model_change';
const REMOVE_FROM_COBBLER = 'remove_from_cobbler';

class DeleteCompute extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      overallStatus: STATUS.UNKNOWN, // overall status of entire playbook
      processErrorBanner: '',
      loading: false,
      // confirmation dialog when results contain failed
      partialFailedConfirmation: undefined,
      partialFailedConfirmMsg: undefined,
      // confirmation dialog when old compute host is not reachable, ask
      // user to manually shutdown
      manualShutdownConfirmation: undefined,
      servers: undefined
    };
  }

  async componentDidMount() {
    this.setState({loading: true});
    try {
      const promises = [
        fetchJson('/api/v2/server?source=sm,ov,manual'),
        fetchJson('/api/v2/cobbler')
      ];
      const [ servers, cobblerStatus ] = await Promise.all(promises);
      this.setState({
        servers,
        cobblerPresent: cobblerStatus.cobbler,
        loading: false
      });
      this.checkEncryptKeyAndProceed();
    } catch(error) {
      let msg = `Failed to get list of servers or cobbler presence flag: ${error.toString()}`;
      console.log(msg, error); // eslint-disable-line no-console
      this.setState({
        cobblerPresent: true,
        loading: false
      });
      this.checkEncryptKeyAndProceed();
    }
  }

  updatePageStatus = (status, error) => {
    this.setState({overallStatus: status});
    if (status === STATUS.FAILED) {
      const errorMsg = error?.message || '';
      this.setState({
        processErrorBanner:
          translate('server.deploy.progress.delete_compute.failure', errorMsg)
      });
    }
  }

  setNextButtonDisabled = () => this.state.overallStatus != STATUS.COMPLETE;

  isValidToRenderPlaybookProgress = () => {
    return (
      !this.props.wizardLoading && !this.state.loading &&
      this.props.operationProps.oldServer.hostname && this.state.showPlaybookProcess
    );
  }

  showPartialFailedConfirmation = (resolve, reject, logger, msgKey, failed) => {
    let failedLines = failed.map(item => JSON.stringify(item)).join('\n');
    this.setState({
      'partialFailedConfirmation': {
        'resolve': resolve,
        'reject': reject,
        'logger': logger
      },
      'partialFailedConfirmMsg': translate(
        msgKey, this.props.operationProps.oldServer.hostname, failedLines)
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

  deleteComputeService = (logger) => {
    const apiUrl =
      '/api/v2/compute/services/' + this.props.operationProps.oldServer.hostname;
    logger('DELETE ' + apiUrl);
    return deleteJson(apiUrl)
      .then((response) => {
        const logMsg =
          'Got response from deleting compute services for compute host ' +
          this.props.operationProps.oldServer.hostname;
        logProgressResponse(logger, response, logMsg);
      })
      .catch((error) => {
        // have no compute service for the old compute node
        // move on
        if(error.status === 410) {
          const logMsg =
            'Warning: No compute service found for compute host ' +
            this.props.operationProps.oldServer.hostname + ', continue...';
          logger(logMsg);
        }
        else if(error.status === 500 &&
          error.value?.contents?.failed && error.value?.contents?.deleted?.length > 0) {
          const logMsg =
            'Got response from deleting compute services for compute host ' +
            this.props.operationProps.oldServer.hostname;
          return this.partialFailureDialogPromise(
            logger, error, logMsg, 'server.deploy.progress.delete_compute_service.hasfailed');
        }
        else {
          const logMsg =
            'Error: Failed to delete compute services for compute host ' +
            this.props.operationProps.oldServer.hostname + '. ' + error.toString();
          logProgressError(logger, error, logMsg);
          const msg =
            translate(
              'server.deploy.progress.delete_compute_service.failure',
              this.props.operationProps.oldServer.hostname, error.toString());
          throw new Error(msg);
        }
      });
  }

  deleteNetworkAgents = (logger) => {
    const apiUrl =
      '/api/v2/network/agents/' + this.props.operationProps.oldServer.hostname;
    logger('PUT ' + apiUrl);
    return deleteJson(apiUrl)
      .then((response) => {
        const logMsg =
          'Got response from deleting network agents for compute host ' +
          this.props.operationProps.oldServer.hostname;
        logProgressResponse(logger, response, logMsg);
      })
      .catch((error) => {
        // have no network agents for the old compute node
        // move on
        if (error.status === 410) {
          const logMsg =
            'No network agents found for compute host ' +
            this.props.operationProps.oldServer.hostname + ', continue...';
          logger(logMsg);
        }
        else if(error.status === 500 &&
          error.value?.contents?.failed && error.value?.contents?.deleted?.length > 0) {
          const logMsg =
            'Got response from deleting network agents for compute host ' +
            this.props.operationProps.oldServer.hostname;
          return this.partialFailureDialogPromise(
            logger, error, logMsg, 'server.deploy.progress.delete_network_agents.hasfailed');
        }
        else {
          const logMsg =
            'Error: Failed to delete network agents for compute host ' +
            this.props.operationProps.oldServer.hostname + '. ' + error.toString();
          logProgressError(logger, error, logMsg);
          const msg =
            translate('server.deploy.progress.delete_network_agents.failure',
              this.props.operationProps.oldServer.hostname,
              error.toString());
          throw new Error(msg);
        }
      });
  }

  removeOldServer = (resolve, reject, logger) => {
    let server =
      this.props.model.getIn(['inputModel','servers'])
        .find(server => server.get('id') ===  this.props.operationProps.oldServer.id);
    if (server) {
      server = server.toJS();
      let model = removeServerFromModel(server, this.props.model);
      this.props.updateGlobalState('model', model);
      logger(
        'Removed compute host ' + this.props.operationProps.oldServer.id + ' from model.');
      // save the changes to the saved servers
      if(this.state.servers) {
        server['role'] = '';
        let old = this.state.servers.find(s => server.uid === s.uid || server.id === s.id);
        if (old) {
          const updated_server = getMergedServer(old, server, MODEL_SERVER_PROPS_ALL);
          putJson('/api/v2/server', updated_server)
            .then(() => resolve())
            .catch(error => {
              let logMsg =
                'Warning: failed to update the deleted compute server ' +
                this.props.operationProps.oldServer.id + ' information in the saved servers. ' +
                error.toString();
              logger(logMsg);
              // if cannot update the deleted server info in the saved servers
              // for some reason, still let it go
              resolve();
            });
        }
        else { // default server in the model, but not in the saved servers, will add server
          if(!server['uid']) {
            server['uid'] = genUID('manual');
          }
          if(!server['source']) {
            server['source'] = 'manual';
          }
          postJson('/api/v2/server', [server])
            .then(() => resolve())
            .catch(error => {
              const logMsg =
                'Warning: failed to save the deleted compute server ' +
                this.props.operationProps.oldServer.id + ' information. ' + error.toString();
              logger(logMsg);
              // if cannot update the deleted server info in the saved servers
              // for some reason, still let it go
              resolve();
            });
        }
      }
      else {
        //this.state.servers is not defined, skip saving or updating saved servers
        logger('Warning: No saved servers, will skip updating saved servers');
        resolve();
      }
    }
    else { // old compute server is not in the model. Should not happen, just in case
      const logMsg =
        'Warning: the old compute server ' +  this.props.operationProps.oldServer.id +
        ' is not in the cloud model';
      logger(logMsg);
      resolve();
    }
  }

  commitModel = (logger) => {
    const commitMessage = {'message': 'Committed via Ardana Installer'};
    return postJson('/api/v2/model/commit', commitMessage)
      .then((response) => {
        logger('Successfully committed model changes.');
      })
      .catch((error) => {
        const logMsg = 'Failed to commit update changes. ' + error.toString();
        logger(logMsg);
        const msg = translate('update.commit.failure', error.toString());
        throw new Error(msg);
      });
  }

  removeFromCobbler = (logger) => {
    const apiUrl =
      '/api/v2/cobbler/servers/' + this.props.operationProps.oldServer.id;
    logger('DELETE ' + apiUrl);
    return deleteJson(apiUrl)
      .then((response) => {
        const logMsg =
          'Got response from deleting server from cobbler for compute host ' +
          this.props.operationProps.oldServer.hostname;
        logProgressResponse(logger, response, logMsg);
      })
      .catch((error) => {
        const logMsg =
          'Error: Failed to remove server from cobbler for compute host ' +
          this.props.operationProps.oldServer.hostname + '. ' + error.toString();
        logger(logMsg);
        const msg =
          translate('server.deploy.progress.remove_from_cobbler.failure',
            this.props.operationProps.oldServer.hostname,
            error.toString());
        throw new Error(msg);
      });
  }

  getSteps = () => {
    let steps = [];
    if (this.props.operationProps.oldServer.isReachable) {
      steps.push({
        label: translate('server.deploy.progress.nova_stop'),
        playbooks: [NOVA_STOP_PLAYBOOK + '.yml']
      });
      steps.push({
        label: translate('server.deploy.progress.neutron_stop'),
        playbooks: [NEUTRON_STOP_PLAYBOOK + '.yml']
      });
      steps.push({
        label: translate('server.deploy.progress.bm_powerdown'),
        playbooks: [BM_POWER_DOWN_PLAYBOOK + '.yml']
      });
    }
    //prompt user to shutdown manually
    else {
      steps.push({
        label: translate('server.deploy.progress.manual_powerdown'),
        playbooks: [MANUAL_SHUTDOWN]
      });
    }

    //delete services and network agents
    steps.push({
      label: translate('server.deploy.progress.delete_compute_service'),
      playbooks: [DELETE_COMPUTE_SERVICE]
    });
    steps.push({
      label: translate('server.deploy.progress.delete_network_agents'),
      playbooks: [DELETE_NETWORK_AGENTS]
    });

    // remove from model, commit and ready to deploy
    steps.push({
      label: translate('server.deploy.progress.remove_compute_from_model'),
      playbooks: [REMOVE_COMPUTE_FROM_MODEL]
    });
    steps.push({
      label: translate('deploy.progress.commit'),
      playbooks: [COMMIT_MODEL_CHANGE]
    });
    steps.push({
      label: translate('deploy.progress.config-processor-run'),
      playbooks: [CONFIG_PROCESSOR_RUN_PLAYBOOK + '.yml']
    });
    steps.push({
      label: translate('deploy.progress.ready-deployment'),
      playbooks: [READY_DEPLOYMENT_PLAYBOOK + '.yml']
    });
    steps.push({
      label: translate('deploy.progress.predeployment'),
      playbooks: [PRE_DEPLOYMENT_PLAYBOOK + '.yml']
    });

    if(this.state.cobblerPresent) {
      // remove from cobbler
      steps.push({
        label: translate('server.deploy.progress.remove_from_cobbler'),
        playbooks: [REMOVE_FROM_COBBLER]
      });

      steps.push({
        label: translate('server.deploy.progress.cobbler_deploy'),
        playbooks: [COBBLER_DEPLOY_PLAYBOOK + '.yml']
      });
    }

    // remove from monasca ping if there is monasca
    steps.push({
      label: translate('server.deploy.progress.update-monasca'),
      playbooks: [MONASCA_DEPLOY_PLAYBOOK + '.yml']
    });

    return steps;
  }

  getPlaybooks = () => {
    let playbooks = [];

    if (this.props.operationProps.oldServer.isReachable) {
      playbooks.push({
        name: NOVA_STOP_PLAYBOOK,
        payload: {limit: this.props.operationProps.oldServer.ansible_hostname}
      });
      playbooks.push({
        name: NEUTRON_STOP_PLAYBOOK,
        payload: {limit: this.props.operationProps.oldServer.ansible_hostname}
      });
      playbooks.push({
        name: BM_POWER_DOWN_PLAYBOOK,
        payload: {'extra-vars': {'nodelist': this.props.operationProps.oldServer.id}}
      });
    }
    else {
      playbooks.push({
        name: MANUAL_SHUTDOWN,
        action: ((logger) => {
          return new Promise((resolve, reject) => {
            this.setState({
              'manualShutdownConfirmation': {
                'resolve': resolve,
                'reject': reject,
                'logger': logger
              }
            });
          });
        })
      });
    }

    playbooks.push({
      name: DELETE_COMPUTE_SERVICE,
      action: ((logger) => {
        return this.deleteComputeService(logger);
      })
    });

    playbooks.push({
      name: DELETE_NETWORK_AGENTS,
      action: ((logger) => {
        return this.deleteNetworkAgents(logger);
      })
    });

    playbooks.push({
      name: REMOVE_COMPUTE_FROM_MODEL,
      action: ((logger) => {
        return new Promise((resolve, reject) => {
          this.removeOldServer(resolve, reject, logger);
        });
      })
    });

    playbooks.push({
      name: COMMIT_MODEL_CHANGE,
      action: ((logger) => {
        return this.commitModel(logger);
      })
    });

    playbooks.push({
      name: PRE_DEPLOYMENT_PLAYBOOK,
      payload: {'extra-vars': {'remove_deleted_servers': 'y', 'free_unused_addresses': 'y'}}
    });

    if(this.state.cobblerPresent) {
      playbooks.push({
        name: REMOVE_FROM_COBBLER,
        action: ((logger) => {
          return this.removeFromCobbler(logger);
        })
      });

      playbooks.push({
        name: COBBLER_DEPLOY_PLAYBOOK,
        payload: {'extra-vars': {'ardanauser_password': this.props.operationProps.osPassword}}
      });
    }

    playbooks.push({
      name: MONASCA_DEPLOY_PLAYBOOK,
      payload: {'tags': 'active_ping_checks'}
    });

    return playbooks;
  }

  renderPartialFailedConfirmation() {
    if (this.state.partialFailedConfirmation) {
      const handleNo = () => {
        this.state.partialFailedConfirmation.reject();
        this.state.partialFailedConfirmation.logger('User aborted processes');
        this.setState({
          partialFailedConfirmation: undefined, partialFailedConfirmMsg: undefined});
      };
      const handleYes = () => {
        this.state.partialFailedConfirmation.resolve();
        this.setState({
          partialFailedConfirmation: undefined, partialFailedConfirmMsg: undefined});
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

  renderManualShutdownConfirmation() {
    if(this.state.manualShutdownConfirmation) {
      const handleCancel = () => {
        this.state.manualShutdownConfirmation.reject();
        this.state.manualShutdownConfirmation.logger('User aborted processes.');
        this.setState({manualShutdownConfirmation: undefined});
      };
      const handleDone = () => {
        this.state.manualShutdownConfirmation.resolve();
        this.setState({manualShutdownConfirmation: undefined});
      };

      const footer = (
        <div className="btn-row">
          <ActionButton type='default' clickAction={handleCancel} displayLabel={translate('cancel')}/>
          <ActionButton clickAction={handleDone} displayLabel={translate('done')}/>
        </div>
      );

      return (
        <ConfirmModal title={translate('default.warning')}
          onHide={handleCancel} footer={footer}>
          {translate('server.deploy.progress.manual_shutdown', this.props.operationProps.oldServer.hostname)}
        </ConfirmModal>
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
          {this.renderHeading(translate('server.deploy.progress.delete_compute'))}
        </div>
        <div className='wizard-content'>
          <If condition={this.isValidToRenderPlaybookProgress()}>{this.renderPlaybookProgress()}</If>
          <If condition={cancel}>{this.renderProcessError()}</If>
        </div>
        {this.renderNavButtons(cancel)}
        {this.renderPartialFailedConfirmation()}
        {this.renderManualShutdownConfirmation()}
        {this.renderEncryptKeyModal()}
      </div>
    );
  }
}

export default DeleteCompute;
