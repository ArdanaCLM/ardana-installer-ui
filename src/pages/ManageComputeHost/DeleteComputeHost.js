// (c) Copyright 2019 SUSE LLC
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

import DeleteCompute from '../ReplaceServer/DeleteCompute.js';
import { translate } from '../../localization/localize.js';
import * as constants from '../../utils/constants.js';
import { deleteJson, putJson } from '../../utils/RestUtils.js';
import { logProgressError, logProgressResponse } from '../../utils/MiscUtils.js';

class DeleteComputeHost extends DeleteCompute {

  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
    };
  }

  getSteps() {
    // Added steps that are necessary before delete
    let steps = [{
      label: translate('server.deploy.progress.remove_from_aggregates'),
      playbooks: [constants.REMOVE_FROM_AGGREGATES_ACTION]
    }, {
      label: translate('server.deploy.progress.disable_network_agents'),
      playbooks: [constants.DISABLE_NETWORK_AGENTS_ACTION]
    }];

    // Append parent's steps
    let parentSteps = super.getSteps();
    steps = steps.concat(parentSteps);

    return steps;
  }

  getPlaybooks() {
    // Added playbooks that are necessary before delete
    let playbooks = [{
      name: constants.REMOVE_FROM_AGGREGATES_ACTION,
      action: ((logger) => {
        return this.removeAggregates(logger);
      })
    }, {
      name: constants.DISABLE_NETWORK_AGENTS_ACTION,
      action: ((logger) => {
        return this.disableNetworkAgents(logger);
      })
    }];

    // Append parent's playbooks
    let parentBooks = super.getPlaybooks();
    playbooks = playbooks.concat(parentBooks);

    return playbooks;
  }

  removeAggregates = (logger) => {
    const apiUrl =
      '/api/v2/compute/aggregates/' + this.props.operationProps.oldServer.hostname;
    logger('DELETE ' + apiUrl);
    // Following logMsg will show up in the PlaybookProgress's log view in English
    return deleteJson(apiUrl)
      .then((response) => {
        const logMsg =
          'Got response from removing aggregates for compute host ' +
          this.props.operationProps.oldServer.hostname;
        logProgressResponse(logger, response, logMsg);
      })
      .catch((error) => {
        // Have no compute service for the old compute node and move on
        if (error.status === 410) {
          const logMsg =
            'Warning: No aggregates found for compute host ' +
            this.props.operationProps.oldServer.hostname + ', continue...';
          logger(logMsg);
        }
        // Backend deletes host aggregates one by one, it returns 500 error when some
        // host aggregates are successfully deleted and some failed. UI will
        // will pop up a confirmation dialog for user to decide to move on or stop.
        else if(error.status === 500 &&
          error.value?.contents?.failed && error.value?.contents?.deleted?.length > 0) {
          const logMsg =
            'Got response from removing aggregates for compute host ' +
            this.props.operationProps.oldServer.hostname;
          return this.partialFailureDialogPromise(
            logger, error, logMsg, 'server.deploy.progress.remove_from_aggregates.hasfailed');
        }
        // Other errors are thrown, the playbook step will fail
        else {
          const logMsg =
            'Error: Failed to remove aggregates for compute host ' +
            this.props.operationProps.oldServer.hostname + '. ' + error.toString();
          logProgressError(logger, error, logMsg);
          // msg will show up in the PlaybookProgress's error banner in localized language
          const msg =
            translate('server.deploy.progress.remove_from_aggregates.failure',
              this.props.operationProps.oldServer.hostname,
              error.toString());
          throw new Error(msg);
        }
      });
  }

  disableNetworkAgents = (logger) => {
    const apiUrl =
      '/api/v2/network/agents/' + this.props.operationProps.oldServer.hostname +
      '/disable';
    logger('PUT ' + apiUrl);
    // Following logMsg will show up in the PlaybookProgress's log view in English
    return putJson(apiUrl)
      .then((response) => {
        const logMsg =
          'Got response from disabling network agents for compute host ' +
          this.props.operationProps.oldServer.hostname;
        logProgressResponse(logger, response, logMsg);
      })
      .catch((error) => {
        // Have no network agents for the old compute node and move on
        if(error.status === 410) {
          const logMsg =
            'No network agents found for compute host ' +
            this.props.operationProps.oldServer.hostname + ', continue...';
          logger(logMsg);
        }
        // Backend deletes network agents one by one, it returns 500 error when
        // some network agents are successfully deleted and some failed. UI will
        // pop up a confirmation dialog for user to decide to move on or stop.
        else if(error.status === 500 &&
          error.value?.contents?.failed && error.value?.contents?.disabled?.length > 0) {
          const logMsg =
            'Got response from disabling network agents for compute host ' +
            this.props.operationProps.oldServer.hostname;
          return this.partialFailureDialogPromise(
            logger, error, logMsg, 'server.deploy.progress.disable_network_agents.hasfailed');
        }
        // Other errors are thrown, the playbook step will fail
        else {
          const logMsg =
            'Error: Failed to disable network agents for compute host ' +
            this.props.operationProps.oldServer.hostname + '. ' + error.toString();
          logProgressError(logger, error, logMsg);
          // msg will show up in the PlaybookProgress's error banner in localized language
          const msg =
            translate('server.deploy.progress.disable_network_agents.failure',
              this.props.operationProps.oldServer.hostname,
              error.toString());
          throw new Error(msg);
        }
      });
  }

  setCloseButtonDisabled = () => {
    // Disable the close button when playbooks/actions haven't started at all or
    // one of the playbooks or actions is still in progress
    return this.state.overallStatus === constants.STATUS.IN_PROGRESS ||
      this.state.overallStatus === constants.STATUS.UNKNOWN;
  }

  renderFooterButtons (showCancel, showRetry) {
    return this.renderNavButtons(false, showRetry);
  }
}

export default DeleteComputeHost;
