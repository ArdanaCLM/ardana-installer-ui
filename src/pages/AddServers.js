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
import { translate } from '../localization/localize.js';
import BaseUpdateWizardPage from './BaseUpdateWizardPage.js';
import AssignServerRoles from './AssignServerRoles.js';
import { ActionButton } from '../components/Buttons.js';
import { getServerRoles, isRoleAssignmentValid } from '../utils/ModelUtils.js';
import { fetchJson } from "../utils/RestUtils";
import { ErrorBanner } from '../components/Messages.js';
import { LoadingMask } from '../components/LoadingMask.js';

const ROLE_LIMIT = ['COMPUTE'];

class AddServers extends BaseUpdateWizardPage {
  constructor(props) {
    super(props);
    this.checkInputs = ['nic-mapping', 'server-group'];
    this.state = {
      model: this.props.model,
      deployedServers: undefined,
      // loading errors from wizard model or progress loading
      loadingErrors: this.props.loadingErrors,
      // errors from getting deployed servers
      errors: undefined
    };
  }

  componentWillMount() {
    fetchJson('/api/v1/clm/model/deployed_servers')
      .then((servers) => {
        if(servers) {
          this.setState({deployedServers: servers});
        }
      })
      .catch(error => {
        this.setState({errors: error.toString()});
      });
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      model : newProps.model,
      loadingErrors: newProps.loadingErrors
    });
  }

  addServers = () => {
    //TODO implement
  }

  installOS = () => {
    //TODO implement
  }

  //check if we can deploy the new servers
  isDeployable = () => {
    if(this.state.model && this.state.model.size > 0) {
      return getServerRoles(this.state.model, ROLE_LIMIT).every(role => {
        return isRoleAssignmentValid(role, this.checkInputs);
      });
    }
    else {
      return false;
    }
  }

  isInstallable = () => {
    //TODO implement
    return false;
  }

  isValidToRenderServerContent = () => {
    return (
      // render the servers content when  model loaded, have no errors of deployed servers
      // and have no model loading errors
      this.state.model && this.state.model.size > 0 && !this.state.errors &&
      (!this.state.loadingErrors || !this.state.loadingErrors.get('modelError'))
    );
  }

  toShowLoadingMask = () => {
    return (
      // show loadingmask when we don't have model ready and
      // don't have any errors
      !(this.state.model && this.state.model.size > 0) &&
      (!this.state.errors && !this.state.loadingErrors)
    );
  }

  // reuse assignServerRole page for update
  // this.props contains all the global props from InstallWizard
  renderAddPage() {
    return (
      <AssignServerRoles
        rolesLimit={ROLE_LIMIT} checkInputs={this.checkInputs}
        deployedServers={this.state.deployedServers}
        {...this.props}>
      </AssignServerRoles>
    );
  }

  renderInstallOSButton() {
    return (
      <ActionButton
        type='default'
        clickAction={this.installOS}
        displayLabel={translate('common.installos')}
        isDisabled={!this.isInstallable()}/>
    );
  }

  renderDeployButton() {
    return (
      <ActionButton
        clickAction={this.addServers}
        displayLabel={translate('common.deploy')}
        isDisabled={!this.isDeployable()}/>
    );
  }

  renderFooterButtons(showCancel) {
    return (
      <div className='btn-row footer-container'>
        {this.renderInstallOSButton()}
        {this.renderDeployButton()}
      </div>
    );
  }

  renderErrorBanner() {
    return (
      <div className='banner-container'>
        <ErrorBanner
          message={translate('server.addserver.error.get-deployed-servers', this.state.errors)}
          show={true}/>
      </div>
    );
  }

  render() {
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.toShowLoadingMask()}/>
        <div className='content-header'>
          <div className='titleBox'>
            {this.renderHeading(translate('add.server.add'))}
          </div>
        </div>
        <div className='wizard-content unlimited-height'>
          {this.isValidToRenderServerContent() && this.renderAddPage()}
        </div>
        {this.state.errors && this.renderErrorBanner()}
        {this.isValidToRenderServerContent() && this.renderFooterButtons()}
        {this.state.loadingErrors &&
        this.renderWizardLoadingErrors(
          this.state.loadingErrors, this.handleCloseLoadingErrorMessage)}
      </div>
    );
  }
}

export default AddServers;
