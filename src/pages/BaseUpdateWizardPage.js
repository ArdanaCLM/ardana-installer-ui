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
import BaseWizardPage from './BaseWizardPage.js';
import { CloseButton, CancelButton } from '../components/Buttons.js';
import { ErrorBanner, ErrorMessage } from '../components/Messages.js';
import { translate } from '../localization/localize.js';

/**
 * This base class handles the functions common to update process
 */
class BaseUpdateWizardPage extends BaseWizardPage {

  constructor(props) {
    super(props);
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

  handleCloseLoadingErrorMessage = () => {
    this.setState({wizardLoadingErrors: undefined});
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
        <CancelButton clickAction={this.cancelUpdateProcess}/>
      );
    }
  }

  renderNavButtons(showCancel) {
    return (
      <div className='btn-row footer-container'>
        {this.renderCancelButton(showCancel)}
        {this.renderForwardButton()}
        {this.renderCloseButton()}
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
