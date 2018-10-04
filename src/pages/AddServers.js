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
import { AddServersPages } from './AddServers/AddServersPages.js';
import AssignServerRoles from './AssignServerRoles.js';
import BaseUpdateWizardPage from './BaseUpdateWizardPage.js';
import { ActionButton } from '../components/Buttons.js';
import { LoadingMask } from '../components/LoadingMask.js';
import { ErrorBanner } from '../components/Messages.js';
import { BaseInputModal, YesNoModal } from '../components/Modals.js';
import { translate } from '../localization/localize.js';
import { getServerRoles, isRoleAssignmentValid, hasConflictAddresses } from '../utils/ModelUtils.js';
import { fetchJson, postJson } from '../utils/RestUtils.js';

const ROLE_LIMIT = ['COMPUTE'];

class AddServers extends BaseUpdateWizardPage {
  constructor(props) {
    super(props);
    this.checkInputs = ['nic-mapping', 'server-group'];
    this.state = {
      model: this.props.model,
      deployedServers: undefined,
      validating: false,
      // loading errors from wizard model or progress loading
      wizardLoadingErrors: this.props.wizardLoadingErrors,
      // loading indicator from wizard
      wizardLoading: this.props.wizardLoading,
      // errors from getting deployed servers
      // it is fatal so it shows as error banner across the page
      errorBanner: undefined,
      // error message show as a popup modal for validation errors
      validationError: undefined,
      // indicator of this loading
      loading: false,
      // show confirm dialog when user clicks Deploy
      showDeployConfirmModal: false
    };
  }

  componentDidMount() {
    // If wizard is not loading then getDeployedServers,
    // otherwise delay it when wizardLoading is done.
    if(!this.props.wizardLoading) {
      this.getDeployedServers();
    }
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      model : newProps.model,
      wizardLoadingErrors: newProps.wizardLoadingErrors,
      wizardLoading: newProps.wizardLoading
    });

    // if wizardLoading was going and now it is done
    // getDeployedServers
    if(this.state.wizardLoading && !newProps.wizardLoading) {
      this.getDeployedServers();
    }
  }

  getDeployedServers = () => {
    this.setState({loading: true});
    // fetchJson(url, init, forceLogin, noCache)
    fetchJson('/api/v1/clm/model/deployed_servers', undefined, true, true)
      .then((servers) => {
        if (servers) {
          this.setState({deployedServers: servers, loading: false});
        }
      })
      .catch(error => {
        this.setState({errorBanner: error.toString(), loading: false});
      });
  }

  assembleInstallProcessPages = () => {

    return [{
      name: 'SelectInstallOS',
      component: AddServersPages.SelectInstallOS
    }, {
      name: 'ProcessInstallOS',
      component: AddServersPages.ProcessInstallOS
    }, {
      name: 'CompleteInstallOS',
      component: AddServersPages.CompleteInstallOS
    }];
  }

  assembleDeployProcessPages = () => {

    return [{
      name: 'PrepareAddServers',
      component: AddServersPages.PrepareAddServers
    }, {
      name: 'DeployAddServers',
      component: AddServersPages.DeployAddServers
    }, {
      name: 'CompleteAddServers',
      component: AddServersPages.CompleteAddServers
    }];
  }

  getAddedServerIds = () => {
    let servers = this.props.model.getIn(['inputModel', 'servers']).toJS();
    let serverIds = servers.map(server => server.id);
    let deployedServerIds =
      this.state.deployedServers ? this.state.deployedServers.map(server => server.id) : [];
    let newServerIds = serverIds.filter(id => {
      return !deployedServerIds.includes(id);
    });

    return newServerIds;
  }

  addServers = () => {
    // validate and update CloudModel.yml so we
    // can have hostnames ready for newly added servers
    this.setState({validating: true, showDeployConfirmModal: false});
    postJson('/api/v1/clm/config_processor')
      .then(() => {
        this.setState({validating: false});
        let pages = this.assembleDeployProcessPages();
        let opProps = {'deployedServers': this.state.deployedServers};
        this.props.startUpdateProcess('AddServer', pages, opProps);
      })
      .catch((error) => {
        this.setState({validating: false});
        this.setState({validationError: error.value ? error.value.log : error.toString()});
      });
  }

  // Check the array list has duplicate values.
  // Convert an array list to be a set which only contains
  // unique values. If array list doesn't contain duplicate
  // values, then set size is the same as the array list length,
  // otherwise the list contains duplicate values.
  hasDuplicates = (arrayList) => {
    return (new Set(arrayList)).size !== arrayList.length;
  }

  hasAddressesConflicts = () => {
    let hasConflicts = false;
    let allSevers = this.state.model.getIn(['inputModel','servers']).toJS();
    let deployedServerIds =
      this.state.deployedServers ?  this.state.deployedServers.map(server => server.id) : [];
    let newServers = allSevers.filter(server => {
      return !deployedServerIds.includes(server.id);
    });
    let modelDeployedServers = allSevers.filter(server => {
      return deployedServerIds.includes(server.id);
    });

    // check if newly added servers have addresses conflicts with any deployed servers
    for (let i = 0; i < newServers.length; i++) {
      let newServer = newServers[i];
      hasConflicts = hasConflictAddresses(newServer, modelDeployedServers);
      if (hasConflicts) {
        break;
      }
    }

    // check if have duplicates within the newly added servers
    if (!hasConflicts) {
      let addresses = newServers.map(server => server['mac-addr']);
      hasConflicts = this.hasDuplicates(addresses);

      if(!hasConflicts) {
        addresses = newServers.map(server => server['ip-addr']);
        hasConflicts = this.hasDuplicates(addresses);
      }

      if(!hasConflicts) {
        addresses = newServers.map(server => server['ilo-ip']);
        hasConflicts = this.hasDuplicates(addresses);
      }
    }

    return hasConflicts;
  }

  installOS = () => {
    let pages = this.assembleInstallProcessPages();
    let newIds = this.getAddedServerIds();
    let opProps = {'newServerIds': newIds};
    this.props.startUpdateProcess('AddServer-InstallOS', pages, opProps);
  }

  //check if we can deploy the new servers
  isDeployable = () => {
    if(this.state.model && this.state.model.size > 0) {
      let newIds = this.getAddedServerIds();
      // turn on the deploy button when all servers are valid
      // and have new servers added and do not have existing processOperation
      // going on
      return (
        !this.props.wizardLoadingErrors &&
        newIds && newIds.length > 0 && !this.props.processOperation &&
        !this.hasAddressesConflicts() &&
        getServerRoles(this.state.model, ROLE_LIMIT).every(role => {
          return isRoleAssignmentValid(role, this.checkInputs);
        })
      );
    }
    else {
      return false;
    }
  }

  isInstallable = () => {
    return this.isDeployable();
  }

  isValidToRenderServerContent = () => {
    return (
      // render the servers content when  model loaded, have no errors of deployed servers
      // and have no model loading errors and wizard loading is done
      this.state.model && this.state.model.size > 0 && !this.state.errorBanner &&
      (!this.state.wizardLoadingErrors || !this.state.wizardLoadingErrors.get('modelError')) &&
      !this.state.wizardLoading
    );
  }

  toShowLoadingMask = () => {
    return (
      this.state.loading || this.state.validating || this.state.wizardLoading
    );
  }

  handleCloseValidationErrorModal = () => {
    this.setState({validationError: undefined});
  }

  handleDeploy = () => {
    this.setState({showDeployConfirmModal: true});
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
        clickAction={this.handleDeploy}
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

  renderGetDeployedSrvsError() {
    return (
      <div className='banner-container'>
        <ErrorBanner
          message={translate('server.addserver.error.get-deployed-servers', this.state.errorBanner)}
          show={true}/>
      </div>
    );
  }

  renderValidationErrorModal() {
    return (
      <BaseInputModal
        show={this.state.validationError !== undefined}
        className='addserver-log-dialog'
        onHide={this.handleCloseValidationErrorModal}
        title={translate('server.addserver.validate.error.title')}>
        <div className='addservers-page'><pre className='log'>{this.state.validationError}</pre></div>
      </BaseInputModal>
    );
  }

  renderDeployConfirmModal() {
    return (
      <YesNoModal show={this.state.showDeployConfirmModal} title={translate('warning')}
        yesAction={this.addServers}
        noAction={() => this.setState({showDeployConfirmModal: false})}>
        {translate('server.addserver.deploy.confirm')}
      </YesNoModal>
    );
  }

  render() {
    let loadingText =  this.state.validating ? translate('server.validating') : '';
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.toShowLoadingMask()} text={loadingText}/>
        <div className='content-header'>
          <div className='titleBox'>
            {this.renderHeading(translate('add.server.add'))}
          </div>
        </div>
        <div className='wizard-content unlimited-height'>
          {this.isValidToRenderServerContent() && this.renderAddPage()}
        </div>
        {this.renderDeployConfirmModal()}
        {this.renderValidationErrorModal()}
        {this.state.errorBanner && this.renderGetDeployedSrvsError()}
        {this.isValidToRenderServerContent() && this.renderFooterButtons()}
        {!this.state.wizardLoading && this.state.wizardLoadingErrors &&
          this.renderWizardLoadingErrors(
            this.state.wizardLoadingErrors, this.handleCloseLoadingErrorMessage)}
      </div>
    );
  }
}

export default AddServers;
