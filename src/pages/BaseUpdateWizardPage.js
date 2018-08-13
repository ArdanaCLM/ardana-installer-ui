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

/**
 * This base class handles the functions common to update process
 */
class BaseUpdateWizardPage extends BaseWizardPage {

  constructor(props) {
    super(props);
  }

  closeUpdateProcess = (e) => {
    e.preventDefault();
    this.props.closeUpdateProcess();
  }

  cancelUpdateProcess = (e) => {
    e.preventDefault();
    this.props.cancelUpdateProcess();
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
}

export default BaseUpdateWizardPage;
