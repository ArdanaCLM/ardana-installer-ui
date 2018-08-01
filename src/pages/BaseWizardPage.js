// (c) Copyright 2017-2018 SUSE LLC
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
import React, { Component } from 'react';
import '../styles/deployer.less';

import {
  NextButton,
  BackButton,
  CloseButton,
  CancelButton
} from '../components/Buttons.js';


/**
 * This base class handles the generic back and forward navigation that is common to
 * most wizard pages.
 */
class BaseWizardPage extends Component {

  /**
   * function to determine whether the page is in an error state.  Subclasses
   * should override this and return true to prevent navigation
   */
  isError() {
    return false;
  }

  /**
  * function to go back a page, this depends on a callback function being passed
  * into this class via props, and will call that function after any local changes
  * @param {Event} the click event on the goBack button
  */
  goBack(e) {
    e.preventDefault();
    this.props.back(false);
  }

  /**
  * function to go forward a page, this depends on a callback function being passed
  * into this class via props, and will call that function after any local changes
  * This function should be where error checking occurs
  * @param {Event} the click event on the goForward button
  */
  goForward(e) {
    e.preventDefault();
    this.props.next(this.isError());
  }

  setNextButtonLabel() {
    return null;
  }

  setNextButtonDisabled() {
    return false;
  }

  setBackButtonLabel() {
    return null;
  }

  setBackButtonDisabled() {
    return false;
  }

  closeUpdateProcess(e) {
    e.preventDefault();
    this.props.closeUpdateProcess();
  }

  cancelUpdateProcess(e) {
    e.preventDefault();
    this.props.cancelUpdateProcess();
  }

  renderNavButtons(close, cancel) {

    let back = null;
    if(this.props.back !== undefined) {
      back= <BackButton
        clickAction={this.goBack.bind(this)}
        displayLabel={this.setBackButtonLabel()}
        isDisabled={this.setBackButtonDisabled()}
      />;
    }

    let forward = null;
    if(this.props.next !== undefined) {
      forward = <NextButton
        clickAction={this.goForward.bind(this)}
        displayLabel={this.setNextButtonLabel()}
        isDisabled={this.setNextButtonDisabled()}
      />;
    }

    //buttons for update process
    let cancelB = null;
    if(cancel) {
      cancelB = <CancelButton
        clickAction={this.cancelUpdateProcess.bind(this)}
      />;
    }

    let closeB = null;
    if(close) {
      closeB = <CloseButton
        clickAction={this.closeUpdateProcess.bind(this)}
      />;
    }
    return (
      <div className='btn-row footer-container'>
        {back}
        {cancel && cancelB}
        {forward}
        {close && closeB}
      </div>
    );
  }

  renderHeading(text) {
    return (
      <h3 className='heading'>{text}</h3>
    );
  }


}

export default BaseWizardPage;
