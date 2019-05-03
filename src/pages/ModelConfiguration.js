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
import { isEmpty } from 'lodash';

import BaseUpdateWizardPage from './BaseUpdateWizardPage.js';
import { ValidateConfigFiles } from './ValidateConfigFiles';
import { getCachedEncryptKey, setCachedEncryptKey } from '../utils/MiscUtils.js';
import { UpdateModelPages } from './ModelConfiguration/UpdateModelPages.js';
import { UpdateModelConfirmModal } from '../components/Modals.js';
import { translate } from '../localization/localize.js';
import { LoadingMask } from '../components/LoadingMask.js';
import { ActionButton } from '../components/Buttons.js';
import * as constants from '../utils/constants.js';

class ModelConfiguration extends BaseUpdateWizardPage {
  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      // Loading errors from wizard model or progress loading
      wizardLoadingErrors: props.wizardLoadingErrors,
      // Indicator of validation status
      modelValid: constants.UNKNOWN,
      // Show confirm dialog when user clicks Update
      showUpdateConfirmModal: false,
      // Whether or not users wants to run full deployment
      isDeploy: false,
    };
  }

  startUpdateModel = () => {
    let opProps = {'isDeploy': this.state.isDeploy};
    let pages = [{
      name: 'UpdateModelProcess', component: UpdateModelPages.UpdateModelProcess}];
    this.props.startUpdateProcess('UpdateModelProcess', pages, opProps);
  };

  updateModel = async (isDeploy) => {
    await this.setState({showUpdateConfirmModal: false, isDeploy: isDeploy});

    if((this.props.isEncrypted && !isEmpty(getCachedEncryptKey())) || !this.props.isEncrypted) {
      this.startUpdateModel();
    }
    else { // encrypted but don't have encryptKey
      this.setState({showEncryptKeyModal: true});
    }
  }

  // Overwrite function in parent
  handleSaveEncryptKey = async (encryptKey) => {
    this.setState({showEncryptKeyModal: false});
    await setCachedEncryptKey(encryptKey);
    this.startUpdateModel();
  }

  noop() {
    // Do nothing because we are not using any of these values
    return () => undefined;
  }

  isValidToRenderModelConfig = () => {
    return (
      // Render the model page when have no model loading errors
      // and wizard loading is done
      !this.state.wizardLoadingErrors && !this.props.wizardLoading
    );
  }

  isUpdatable = () => {
    return (
      !this.props.wizardLoadingErrors && !this.props.processOperation &&
      this.state.modelValid === constants.VALID
    );
  }

  handleUpdate = () => {
    this.setState({showUpdateConfirmModal: true});
  }

  updateValidationStatus = (status) => {
    this.setState({modelValid : status});
  }

  renderUpdateModelFiles() {
    return <div className='menu-tab-content'>
      <ValidateConfigFiles disableTab={this.noop()} showNavButtons={this.noop()}
        enableBackButton={this.noop()} updateValidationStatus={this.updateValidationStatus}
        enableNextButton={this.noop()} setRequiresPassword={this.noop()} loadModel={this.noop()}
        requiresPassword={false} sshPassphrase={undefined} isUpdateMode={true} />
    </div>;
  }

  renderUpdateConfirmModal() {
    return (
      <If condition={this.state.showUpdateConfirmModal}>
        <UpdateModelConfirmModal
          doneAction={this.updateModel}
          cancelAction={() => this.setState({showUpdateConfirmModal: false})}/>
      </If>
    );
  }

  renderFooterButtons() {
    return (
      <div className='btn-row footer-container'>
        <ActionButton
          clickAction={this.handleUpdate}
          displayLabel={translate('common.update')}
          isDisabled={!this.isUpdatable()}/>
      </div>
    );
  }

  render() {
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.state.loading || this.props.wizardLoading}/>
        <div className='content-header'>
          <div className='titleBox'>
            {this.renderHeading(translate('update.model.heading'))}
          </div>
        </div>
        <div className='wizard-content'>
          <If condition={this.isValidToRenderModelConfig()}>
            {this.renderUpdateModelFiles()}
          </If>
        </div>
        <If condition={this.isValidToRenderModelConfig()}>
          {this.renderFooterButtons()}
        </If>
        <If condition={!this.props.wizardLoading && this.state.wizardLoadingErrors}>
          {this.renderWizardLoadingErrors(
            this.state.wizardLoadingErrors, this.handleCloseLoadingErrorMessage)}
        </If>
        {this.renderUpdateConfirmModal()}
        {this.renderEncryptKeyModal()}
      </div>
    );
  }
}

export default ModelConfiguration;
