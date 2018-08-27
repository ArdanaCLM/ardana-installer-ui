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
import {getServerRoles, isRoleAssignmentValid} from "../utils/ModelUtils";

const ROLE_LIMIT = ['COMPUTE'];

class AddServers extends BaseUpdateWizardPage {
  constructor(props) {
    super(props);
    this.checkInputs = ['nic-mapping', 'server-group'];
    this.state = {
      model: this.props.model
    };
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      model : newProps.model,
    });
  }

  // reuse assignServerRole page for update
  // this.props contains all the global props from InstallWizard
  renderAddPage() {
    return (
      <AssignServerRoles
        mode='addserver' rolesLimit={ROLE_LIMIT} checkInputs={this.checkInputs}
        {...this.props}>
      </AssignServerRoles>
    );
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

  render() {
    return (
      <div className='wizard-page'>
        <div className='content-header'>
          <div className='titleBox'>
            {this.renderHeading(translate('add.server.add'))}
          </div>
        </div>
        <div className='wizard-content unlimited-height'>
          {this.state.model && this.state.model.size > 0 && this.renderAddPage()}</div>
        {this.renderFooterButtons()}
      </div>
    );
  }
}

export default AddServers;
