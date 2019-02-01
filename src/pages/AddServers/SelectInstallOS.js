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
      isValid: false
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if(this.props.operationProps !== prevProps.operationProps ||
      this.props.isEncrypted !== prevProps.isEncrypted ||
      this.props.encryptKey !== prevProps.encryptKey) {
      let isValid =
      !isEmpty(this.props.operationProps.selectedToInstallOS) &&
      !isEmpty(this.props.operationProps.osInstallPassword) &&
      (!this.props.operationProps.sshPassphraseRequired ||
        (this.props.operationProps.sshPassphraseRequired &&
        !isEmpty(this.props.operationProps.sshPassphrase))) &&
      (!this.props.isEncrypted ||
        (this.props.isEncrypted && !isEmpty(this.props.encryptKey)));
      this.setState({isValid: isValid});
    }
  }

  setNextButtonDisabled = () => {
    return !this.state.isValid;
  }

  goForward(e) {
    e.preventDefault();
    this.setState({showInstallConfirmModal : true});
  }

  startInstallProcess = (e) => {
    this.setState({showInstallConfirmModal : false});
    if (this.props.operationProps.sshPassphraseRequired) {
      let password = {'password': this.props.operationProps.sshPassphrase};
      postJson('/api/v2/sshagent/key', JSON.stringify(password), undefined, false)
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
      <If condition={this.state.showInstallConfirmModal}>
        <YesNoModal title={translate('warning')}
          yesAction={this.startInstallProcess}
          noAction={() => this.setState({showInstallConfirmModal: false})}>
          {translate('provision.server.confirm.body', this.props.operationProps.selectedToInstallOS.length)}
        </YesNoModal>
      </If>
    );
  }

  renderInstallSelectPage() {
    return (
      <SelectServersToProvision isUpdateMode={true} {...this.props} />
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
    // For select installos page, show cancel button but no retry button.
    // Will have a specific cancel confirmation message when user clicks
    // cancel button.
    let cancelMsg = translate('server.addserver.installos.cancel.confirm');
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.props.wizardLoading}/>
        <div className='content-header'>
          {this.renderHeading(translate('provision.server.heading'))}
        </div>
        <div className='wizard-content'>
          {!this.props.wizardLoading && this.renderInstallSelectPage()}
        </div>
        {this.state.isValid && this.renderInstallConfirmModal()}
        {this.state.passphraseError && this.renderPassphraseErrorMsg()}
        {this.renderNavButtons(true, false, cancelMsg)}
      </div>
    );
  }
}

export default SelectInstallOS;
