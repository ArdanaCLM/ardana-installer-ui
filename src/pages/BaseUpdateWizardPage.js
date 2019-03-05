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
import BaseWizardPage from './BaseWizardPage.js';
import { CloseButton, CancelButton, RetryButton } from '../components/Buttons.js';
import { ErrorBanner, ErrorMessage } from '../components/Messages.js';
import { translate } from '../localization/localize.js';
import { YesNoModal } from '../components/Modals.js';
import { SetEncryptKeyModal } from '../components/Modals.js';
import { getCachedEncryptKey, setCachedEncryptKey } from '../utils/MiscUtils.js';

/**
 * This base class handles the functions common to update process
 */
class BaseUpdateWizardPage extends BaseWizardPage {
  constructor(props) {
    super();
    this.state = {
      showPlaybookProcess: false,
      showRetryConfirmModal: false,
      showCancelConfirmModal: false,
      // show encryptKey modal when isEncrypted but key is missing
      showEncryptKeyModal: false
    };
  }

  goForward(e) {
    e.preventDefault();
    this.props.updateGlobalState('playbookStatus', undefined); //clean up playbook status
    super.goForward(e);
  }

  closeUpdateProcess = (e) => {
    e.preventDefault();
    this.props.closeUpdateProcess();
  }

  cancelUpdateProcess = (e) => {
    e.preventDefault();
    this.props.cancelUpdateProcess();
  }

  retryUpdateProcess = (e) => {
    e.preventDefault();
    this.props.retryUpdateProcess();
  }

  handleCloseLoadingErrorMessage = () => {
    this.setState({wizardLoadingErrors: undefined});
  }

  handleCancel = (e) => {
    e.preventDefault();
    this.setState({showCancelConfirmModal: true});
  }

  handleRetry = (e) => {
    e.preventDefault();
    this.setState({showRetryConfirmModal: true});
  }

  handleSaveEncryptKey = async (encryptKey) => {
    this.setState({showEncryptKeyModal: false});
    await setCachedEncryptKey(encryptKey);
    this.setState({showPlaybookProcess: true});
  }

  checkEncryptKeyAndProceed = () => {
    if((this.props.isEncrypted && !isEmpty(getCachedEncryptKey())) ||
      !this.props.isEncrypted) {
      this.setState({ showPlaybookProcess: true});
    }
    else { // encrypted but don't have encryptKey
      this.setState({showEncryptKeyModal: true});
    }
  }

  renderCancelConfirmModal(cancelMsg) {
    return (
      <If condition={this.state.showCancelConfirmModal}>
        <YesNoModal title={translate('warning')}
          yesAction={(e) => this.cancelUpdateProcess(e)}
          noAction={() => this.setState({showCancelConfirmModal: false})}>
          {cancelMsg || translate('server.deploy.failure.cancel.confirm')}
        </YesNoModal>
      </If>
    );
  }

  renderRetryConfirmModal() {
    return (
      <If condition={this.state.showRetryConfirmModal}>
        <YesNoModal title={translate('warning')}
          yesAction={(e) => this.retryUpdateProcess(e)}
          noAction={() => this.setState({showRetryConfirmModal: false})}>
          {translate('server.deploy.retry.confirm')}
        </YesNoModal>
      </If>
    );
  }

  renderCloseButton() {
    if(this.props.close) {
      return (
        <CloseButton clickAction={this.closeUpdateProcess}/>
      );
    }
  }

  renderCancelButton(show) {
    if(show) {
      return (
        <CancelButton clickAction={(e) => this.handleCancel(e)}/>
      );
    }
  }

  // playbookStatus includes playId and name
  renderRetryButton(show) {
    if(show) {
      return (
        <RetryButton clickAction={(e) => this.handleRetry(e)}/>
      );
    }
  }

  renderEncryptKeyModal() {
    return (
      <If condition={this.state.showEncryptKeyModal}>
        <SetEncryptKeyModal title={translate('warning')} doneAction={this.handleSaveEncryptKey}>
        </SetEncryptKeyModal>
      </If>
    );
  }

  renderNavButtons(showCancel, showRetry, cancelMsg) {
    return (
      <div className='btn-row footer-container'>
        {this.renderRetryButton(showRetry)}
        {this.renderCancelButton(showCancel)}
        {this.renderForwardButton()}
        {this.renderCloseButton()}
        {this.renderRetryConfirmModal()}
        {this.renderCancelConfirmModal(cancelMsg)}
      </div>
    );
  }

  renderWizardLoadingErrors(loadingErrors, callbackSetStateFunc) {
    // if have modelError and progressError from InstallWizard loading, will block server contents
    if(loadingErrors.get('modelError') && loadingErrors.get('progressError')) {
      return (
        <div className='banner-container'>
          <ErrorBanner message={translate('common.load.modelprogress.error')} show={true}/>
        </div>
      );
    }
    // if have modelError from InstallWizard loading, will block server contents
    else if(loadingErrors.get('modelError')) {
      return (
        <div className='banner-container'>
          <ErrorBanner message={translate('common.load.model.error')} show={true}/>
        </div>
      );
    }
    // if have progressError from InstallWizard loading, but no model error, will show
    // an error message
    else if(loadingErrors.get('progressError')) {
      return (
        <div className='notification-message-container'>
          <ErrorMessage
            message={translate('common.load.progress.error')}
            closeAction={() => callbackSetStateFunc()}/>
        </div>
      );
    }
  }
}

export default BaseUpdateWizardPage;
