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

import React from 'react';

import BaseUpdateWizardPage from '../BaseUpdateWizardPage';
import { ErrorBanner } from '../../components/Messages.js';
import { translate } from '../../localization/localize';
import { STATUS } from '../../utils/constants';
import { LoadingMask } from '../../components/LoadingMask';
import { PlaybookProgress } from '../../components/PlaybookProgress';
import { putJson } from '../../utils/RestUtils';
import { logProgressResponse, logProgressError } from '../../utils/MiscUtils.js';
import { ARDANA_START_PLAYBOOK } from '../../utils/constants';

const NOVA_ACTIVATE = 'nova_activate';

class ActivateComputeHost extends BaseUpdateWizardPage {
  // TODO add activate call to nova api
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      loading: false,
      overallStatus: STATUS.NOT_STARTED
    };
  }

  componentDidMount() {
    this.checkEncryptKeyAndProceed();
  }

  getSteps() {
    return [
      {
        label: translate('server.activate.text', this.props.operationProps.target.id),
        playbooks: [`${ARDANA_START_PLAYBOOK}.yml`],
        payload: {
          limit: this.props.operationProps.target.hostname
        }
      },
      {
        label: translate('server.activate_service.text', this.props.operationProps.target.id),
        playbooks: [NOVA_ACTIVATE]
      }
    ];
  }

  getPlaybooks() {
    return [
      {
        name: ARDANA_START_PLAYBOOK,
        payload: {
          limit: this.props.operationProps.target.hostname
        }
      },
      {
        name: NOVA_ACTIVATE,
        action: ::this.activateNova
      }
    ];
  }

  async activateNova(logger) {
    const { hostname } = this.props.operationProps.target,
      apiUrl = `/api/v2/compute/services/${hostname}/enable`;
    logger(`PUT ${apiUrl}`);
    try {
      let responce = await putJson(apiUrl),
        logMsg = `Got response from enabling compute services for compute host ${hostname}`;
      logProgressResponse(logger, responce, logMsg);
    } catch(error) {
      if(error.status === 410) {
        logger(`Warning: No compute service found for compute host ${hostname}, continue...`);
      }
      const logMsg = `Got error responce from enabling compute services for compute host ${hostname}`;
      this.updatePageStatus(STATUS.FAILED);
      this.setState({
        processErrorBanner: translate('server.activate.error', hostname, error.toString())
      });
      logProgressError(logger, error, logMsg);
    }
  }

  updatePageStatus(status) {
    let state = {
      overallStatus: status,
    };
    if(status === STATUS.FAILED && ! this.state.processErrorBanner) {
      state.processErrorBanner =
        translate('server.activate.error', this.props.operationProps.target.hostname, 'UNKNOWN');
    }
    this.setState(state);
  }

  render() {
    const failed = this.state.overallStatus === STATUS.FAILED,
      steps = this.getSteps(),
      playbooks = this.getPlaybooks(),
      // common_payload will be merged with individual playbook payload when luanch
      // playbook in PlaybookProgress
      common_payload = {'extra-vars': {encrypt: this.props.encryptKey || ''}};
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.props.wizardLoading || this.state.loading}/>
        <div className='content-header'>
          {this.renderHeading(translate('server.activate.text', this.props.operationProps.target.id))}
        </div>
        <div className='wizard-content'>
          <If condition={this.state.showPlaybookProcess}>
            <PlaybookProgress
              payload={common_payload}
              updatePageStatus={::this.updatePageStatus} updateGlobalState={this.props.updateGlobalState}
              playbookStatus={this.props.playbookStatus} steps={steps} playbooks={playbooks}/>
          </If>
          <If condition={failed}>
            <div className='banner-container'>
              <ErrorBanner message={this.state.processErrorBanner}
                show={true}/>
            </div>
          </If>
          {this.renderEncryptKeyModal()}
        </div>
        {this.renderNavButtons(false, failed)}
      </div>
    );
  }
}

export default ActivateComputeHost;
