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
import { isEmpty } from 'lodash';
import BaseUpdateWizardPage from '../BaseUpdateWizardPage.js';
import { LoadingMask } from '../../components/LoadingMask.js';
import { translate } from '../../localization/localize.js';
import { ErrorMessage } from '../../components/Messages.js';
import { YesNoModal } from '../../components/Modals.js';
import SelectServersToProvision from '../SelectServersToProvision.js';
import { postJson } from '../../utils/RestUtils.js';

// This page allow the user to select newly added compute
// servers to install SLES on them
class SelectInstallOS extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);

    this.state = {
      // show confirm
      showInstallConfirmModal: false,
      // error msg
      passphraseError: undefined,
      // disable the next button when it is not valid
      isInvalid: true
    };
  }

  componentWillReceiveProps(newProps) {
    let isInvalid =
      isEmpty(newProps.operationProps.selectedToInstallOS) ||
      isEmpty(newProps.operationProps.osInstallPassword) ||
      (newProps.operationProps.sshPassphraseRequired &&
        isEmpty(newProps.operationProps.sshPassphrase));
    this.setState({isInvalid: isInvalid});
  }

  setNextButtonDisabled = () => {
    return this.state.isInvalid;
  }

  goForward(e) {
    e.preventDefault();
    this.setState({showInstallConfirmModal : true});
  }

  startInstallProcess = (e) => {
    this.setState({showInstallConfirmModal : false});
    if (this.props.operationProps.sshPassphraseRequired) {
      let password = {'password': this.props.operationProps.sshPassphrase};
      postJson('/api/v1/clm/sshagent/key', JSON.stringify(password), undefined, false)
        .then(() => {
          super.goForward(e);
        })
        .catch((error) => {
          this.setState({passphraseError: error.value ? error.value['error_msg'] : ''});
        });
    }
    else {
      super.goForward(e);
    }
  }

  renderInstallConfirmModal() {
    return (
      <YesNoModal show={this.state.showInstallConfirmModal} title={translate('warning')}
        yesAction={this.startInstallProcess}
        noAction={() => this.setState({showInstallConfirmModal: false})}>
        {translate('provision.server.confirm.body', this.props.operationProps.selectedToInstallOS.length)}
      </YesNoModal>
    );
  }

  renderInstallSelectPage() {
    return (
      <SelectServersToProvision {...this.props} />
    );
  }

  renderPassphraseErrorMsg () {
    return (
      <div className='notification-message-container'>
        <ErrorMessage
          title={translate('server.addserver.installos.passphrase.error')}
          message={this.state.passphraseError}
          closeAction={() => this.setState({passphraseError: undefined})}/>
      </div>
    );
  }

  render() {
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.props.wizardLoading}/>
        <div className='content-header'>
          {this.renderHeading(translate('provision.server.heading'))}
        </div>
        <div className='wizard-content'>
          {!this.props.wizardLoading && this.renderInstallSelectPage()}
        </div>
        {!this.state.isInvalid && this.renderInstallConfirmModal()}
        {this.state.passphraseError && this.renderPassphraseErrorMsg()}
        {this.renderNavButtons(true)}
      </div>
    );
  }
}

export default SelectInstallOS;
