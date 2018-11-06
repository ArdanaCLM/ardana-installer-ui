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
import BaseUpdateWizardPage from './BaseUpdateWizardPage.js';
import { ActionButton } from '../components/Buttons.js';
import CollapsibleTable from '../components/CollapsibleTable.js';
import { LoadingMask } from '../components/LoadingMask.js';
import { ErrorMessage } from '../components/Messages.js';
import { translate } from '../localization/localize.js';
import { UpdateServerPages } from './ReplaceServer/UpdateServerPages.js';
import {
  MODEL_SERVER_PROPS_ALL, MODEL_SERVER_PROPS, REPLACE_SERVER_MAC_IPMI_PROPS }
  from '../utils/constants.js';
import {
  updateServersInModel, getMergedServer, addServerInModel, isComputeNode,
  removeServerFromModel }
  from '../utils/ModelUtils.js';
import { fetchJson, postJson, putJson } from '../utils/RestUtils.js';
import ReplaceServerDetails from '../components/ReplaceServerDetails.js';
import { BaseInputModal, ConfirmModal, YesNoModal } from '../components/Modals.js';
import { genUID } from '../utils/ModelUtils.js';

class UpdateServers extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);

    this.state = {
      // loading errors from wizard model or progress loading
      wizardLoadingErrors: props.wizardLoadingErrors,
      // loading indicator from wizard
      wizardLoading: props.wizardLoading,
      // this loading indicator
      loading: true,
      errorMessages: [],

      // Track which groups the user has expanded
      expandedGroup: [],

      // servers that were discovered or manually entered
      servers: [],

      showReplaceModal: false,

      showSharedWarning: false,

      serverToReplace: undefined,

      validating: false,
      // error message show as a popup modal for validation errors
      validationError: undefined
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.model !== prevProps.model)
    {
      const allGroups =
        this.props.model.getIn(['inputModel', 'server-roles']).map(e => e.get('name'));
      if (allGroups.includes('COMPUTE-ROLE')) {
        this.setState({expandedGroup: ['COMPUTE-ROLE']});
      } else if (allGroups.size > 0) {
        this.setState({expandedGroup: [allGroups.sort().first()]});
      }
    }

    if (this.props.wizardLoadingErrors !== prevProps.wizardLoadingErrors ||
      this.props.wizardLoading !== prevProps.wizardLoading)
    {
      this.setState({
        wizardLoadingErrors: this.props.wizardLoadingErrors,
        wizardLoading: this.props.wizardLoading
      });
    }
  }

  componentDidMount() {
    fetchJson('/api/v1/server?source=sm,ov,manual')
      .then(servers => {
        this.setState({
          servers: servers,
          loading: false});
      })
      .catch(error => {
        let msg = translate('server.retrieve.discovered.servers.error', error.toString());
        this.setState(prev => {
          return {
            errorMessages: prev.errorMessages.concat([msg]),
            loading: false
          };
        });
      });
  }

  expandAll() {
    const allGroups =
      this.props.model.getIn(['inputModel','server-roles']).map(e => e.get('name'));
    this.setState({expandedGroup: allGroups});
  }

  collapseAll() {
    this.setState({expandedGroup: []});
  }

  removeExpandedGroup = (groupName) => {
    this.setState(prevState => {
      return {'expandedGroup': prevState.expandedGroup.filter(e => e != groupName)};
    });
  }

  addExpandedGroup = (groupName) => {
    this.setState(prevState => ({'expandedGroup': prevState.expandedGroup.concat(groupName)}));
  }

  getReplaceProps = () => {
    if(isComputeNode(this.state.serverToReplace)) {
      return MODEL_SERVER_PROPS;
    }
    else {
      return REPLACE_SERVER_MAC_IPMI_PROPS;
    }
  }

  updateServerForReplaceServer = (server) => {
    let old = this.state.servers.find(s => server.uid === s.uid);
    if (old) {
      const updated_server = getMergedServer(old, server, this.getReplaceProps());
      putJson('/api/v1/server', updated_server)
        .catch(error => {
          let msg = translate('server.save.error', error.toString());
          this.setState(prev => ({ errorMessages: prev.errorMessages.concat(msg)}));
        });
    }
    // for compute host replacement, user added info manually, will add to
    // to saved servers
    else if(isComputeNode(this.state.serverToReplace)) {
      server['source'] = 'manual';
      postJson('/api/v1/server', [server])
        .catch(error => {
          let msg = translate('server.save.error', error.toString());
          this.setState(prev => ({ errorMessages: prev.errorMessages.concat(msg)}));
        });
    }
    // for non-compute host replacement, if user added info manually, won't
    // save to saved servers
  }

  assembleProcessPages = (theProps) => {
    let pages = [];

    if(isComputeNode(this.state.serverToReplace)) {
      pages.push({
        name: 'PrepareAddCompute',
        component: UpdateServerPages.PrepareAddCompute
      });
      pages.push({
        name: 'DeployAddCompute',
        component: UpdateServerPages.DeployAddCompute
      });
      pages.push({
        name: 'CompleteAddCompute',
        component: UpdateServerPages.CompleteAddCompute
      });
    } else {
      pages.push({
        name: 'ReplaceController',
        component: UpdateServerPages.ReplaceController
      });
    }
    return pages;
  }

  // server includes server info and ipmi info
  // theProps includes zero or more of the items like
  // wipeDisk, installOS, osInstallUsername, osInstallPassword,
  // selectedServerId
  replaceServer = (server, theProps) =>  {
    let model;

    let repServer = Object.assign({}, server);

    // the new server is from discovered servers or manual servers
    // need to update
    if(theProps.selectedServerId) {
      // update internal uuid for UI purpose
      let selServer =
        this.state.servers.find(svr => svr.id === theProps.selectedServerId);
      repServer['uid'] = selServer['uid'];
    }
    else {
      // user input new mac-addr and ilo info
      // generate a new uid, treat it as manual added server
      repServer['uid'] = genUID('manual');
    }

    // if compute node, will add server to the model
    if(isComputeNode(this.state.serverToReplace)) {
      // get the old server's role
      repServer['role'] = this.state.serverToReplace['role'];
      model = addServerInModel(repServer, this.props.model, MODEL_SERVER_PROPS_ALL);
    }
    else { // update existing server
      model =
        updateServersInModel(repServer, this.props.model, MODEL_SERVER_PROPS_ALL, repServer.id);
    }

    this.updateServerForReplaceServer(repServer);

    this.props.updateGlobalState('model', model);

    // existing server id and ip-addr for non-compute node
    // new server id and ip-addr for a new compute node
    // for replacing a compute node, also recorded oldServer's id
    // and ip-addr
    // id and ip-addr can be used to retriev hostname in CloudModel.yml
    theProps.server = {id: repServer.id, 'ip': repServer['ip-addr']};

    // save the oldServer information for later process when replace compute
    if(isComputeNode(this.state.serverToReplace)) {
      theProps.oldServer = {
        id: this.state.serverToReplace['id'], 'ip': this.state.serverToReplace['ip-addr']};
      // will always activate the newly added compute server
      theProps.activate = true;
    }

    let pages = this.assembleProcessPages(theProps);

    if(isComputeNode(this.state.serverToReplace)) {
      this.setState({validating: true});
      postJson('/api/v1/clm/config_processor')
        .then(() => {
          this.setState({validating: false});
          this.props.startUpdateProcess('ReplaceServer', pages, theProps);
        })
        .catch((error) => {
          // when validation failed, show error messages and
          // instruct users to update and do replace again.
          this.setState({validating: false});
          this.setState({validationError: error.value ? error.value.log : error.toString()});
          // remove the server from model
          // remove role of the server in the availabe server list
          this.updateInvalidComputeServer(repServer);

        });
    }
    else {
      // trigger update process to start which calls the startUpdate in
      // UpdateWizard
      this.props.startUpdateProcess('ReplaceServer', pages, theProps);
    }
  }

  updateInvalidComputeServer = (server) => {
    let model = removeServerFromModel(server, this.props.model);
    this.props.updateGlobalState('model', model);
    // remove role and update servers list
    server['role'] = '';
    let old = this.state.servers.find(s => server.uid === s.uid);
    if (old) {
      const updated_server = getMergedServer(old, server, MODEL_SERVER_PROPS_ALL);
      let servers = this.state.servers.filter(s => server.uid !== s.uid);
      servers.push(updated_server);
      this.setState({'servers': servers});
      putJson('/api/v1/server', updated_server)
        .catch(error => {
          let msg = translate('server.save.error', error.toString());
          this.setState(prev => ({ errorMessages: prev.errorMessages.concat(msg)}));
        });
    }
  }

  handleCloseMessage = (idx) => {
    this.setState((prevState) => {
      let msgs = prevState.errorMessages.slice();
      msgs.splice(idx, 1);
      return {errorMessages: msgs};
    });
  }

  handleCloseValidationErrorModal = () => {
    this.setState({validationError: undefined});
  }

  renderValidationErrorModal() {
    let msg = translate('server.addcompute.validate.error.msg');
    return (
      <BaseInputModal
        show={this.state.validationError !== undefined}
        className='addserver-log-dialog'
        onHide={this.handleCloseValidationErrorModal}
        title={translate('server.addcompute.validate.error.title')}>
        <div className='addservers-page'>
          <pre>{msg}</pre>
          <pre className='log'>{this.state.validationError}</pre></div>
      </BaseInputModal>
    );
  }

  renderMessages() {
    let msgList = this.state.errorMessages.map((msg, idx) => {
      return (
        <ErrorMessage key={idx} closeAction={() => this.handleCloseMessage(idx)}
          message={msg}/>
      );
    });
    return (<div className='notification-message-container'>{msgList}</div>);
  }

  checkPrereqs = (server) => {
    // Verify the prerequisites before prompting for replacement information:
    // - the selected controller node is not shared with the deployer
    // - the selected node is no longer reachable (via ssh)
    // - For replacing a compute node, we need to migrate instances
    // on the old compute node first, therefore it should be reachable.
    // If it is not reachable, show a warning indicating that instances can not
    // be migrated.
    fetchJson('api/v1/ips')
      .then(ips => {
        if (ips.includes(server['ip-addr'])) {
          this.setState({showSharedWarning: true});
        }
        else {
          // Display the load mask
          this.setState({loading: true});

          postJson('api/v1/connection_test', {host: server['ip-addr']})
            .then(result => {
              if(isComputeNode(server)) {
                this.setState({
                  loading: false,
                  showReplaceModal: true,
                  serverToReplace: server
                });
              }
              else {
                // If the node is still reachable, then display a message to the user to have them
                // power it down.
                this.setState({loading: false, showPowerOffWarning: true});
              }
            })
            .catch(error => {
              if (error.status == 404) {
                if(isComputeNode(server)) {
                  this.setState({
                    loading: false,
                    serverToReplace: server,
                    showNoMigrationWarning: true});
                }
                else {
                  console.log(   // eslint-disable-line no-console
                    'The 404 immediately preceding this message is expected, ' +
                    'and it means that the server is in the correct state (powered off)');
                  // 404 means the server is not found, which is the state that we *want* to be in.
                  // Proceed with the modal for entering the replacement info.
                  this.setState({
                    loading: false,
                    showReplaceModal: true,
                    serverToReplace: server
                  });
                }
              } else {
                let msg = translate('server.save.error', error.toString());
                this.setState(prev => ({
                  errorMessages: prev.errorMessages.concat(msg),
                  loading: false
                }));
              }
            });
        }
      });
  }

  handleCancelReplaceServer = () => {
    this.setState({showReplaceModal: false, serverToReplace: undefined});
  }

  handleDoneReplaceServer = (server, theProps) => {
    this.replaceServer(server, theProps);
    this.handleCancelReplaceServer();
  }

  renderSharedWarning() {
    if (this.state.showSharedWarning) {
      return (
        <ConfirmModal
          show={true}
          title={translate('warning')}
          onHide={() => this.setState({showSharedWarning: false})}>
          <div>{translate('replace.server.shared.warning')}</div>
        </ConfirmModal>
      );
    } else {
      return null;
    }
  }

  renderPowerOffWarning() {
    if (this.state.showPowerOffWarning) {
      return (
        <ConfirmModal
          show={true}
          title={translate('warning')}
          onHide={() => this.setState({showPowerOffWarning: false})}>
          <div>{translate('replace.server.poweroff.warning')}</div>
        </ConfirmModal>
      );
    } else {
      return null;
    }
  }

  renderNoMigrationWarning() {
    if (this.state.showNoMigrationWarning) {
      return (
        <YesNoModal
          show={true} title={translate('warning')}
          yesAction={() => this.setState({showNoMigrationWarning: false, showReplaceModal: true})}
          noAction={() => this.setState({showNoMigrationWarning: false, serverToReplace: undefined})}>
          {translate('replace.server.nomigration.warning',
            this.state.serverToReplace['id'], this.state.serverToReplace['ip-addr'])}
        </YesNoModal>
      );
    } else {
      return null;
    }
  }

  renderReplaceServerModal() {
    if (! this.state.serverToReplace) {
      return;
    }

    let title = translate('server.replace.heading', this.state.serverToReplace.id);
    let newProps = { ...this.props };

    const modelIds = this.props.model.getIn(['inputModel','servers'])
      .map(server => server.get('uid') || server.get('id'));

    newProps.availableServers = this.state.servers.filter(server => ! modelIds.includes(server.uid));

    return (
      <BaseInputModal
        show={true} className='edit-details-dialog'
        onHide={this.handleCancelReplaceServer} title={title}>
        <ReplaceServerDetails
          cancelAction={this.handleCancelReplaceServer}
          doneAction={this.handleDoneReplaceServer}
          data={this.state.serverToReplace}
          { ...newProps }>
        </ReplaceServerDetails>
      </BaseInputModal>
    );
  }

  renderCollapsibleTable() {
    let tableConfig = {
      columns: [
        {name: 'id'},
        {name: 'uid', hidden: true},
        {name: 'ip-addr',},
        {name: 'server-group'},
        {name: 'nic-mapping'},
        {name: 'mac-addr'},
        {name: 'ilo-ip', hidden: true},
        {name: 'ilo-user', hidden: true},
        {name: 'ilo-password', hidden: true},
        {name: 'role', hidden: true}
      ]
    };

    const autoServers = this.state.servers.filter(s => s.source !== 'manual');
    const manualServers = this.state.servers.filter(s => s.source === 'manual');

    // TODO: pass in array of menu items and callbacks
    return (
      <CollapsibleTable
        addExpandedGroup={this.addExpandedGroup} removeExpandedGroup={this.removeExpandedGroup}
        model={this.props.model} tableConfig={tableConfig} expandedGroup={this.state.expandedGroup}
        replaceServer={this.checkPrereqs} updateGlobalState={this.props.updateGlobalState}
        autoServers={autoServers} manualServers={manualServers}
        processOperation={this.props.processOperation}/>
    );
  }

  renderGlobalButtons() {
    return (
      <div className='buttonBox'>
        <div className='btn-row'>
          <ActionButton type='default'
            displayLabel={translate('collapse.all')} clickAction={() => this.collapseAll()} />
          <ActionButton type='default'
            displayLabel={translate('expand.all')} clickAction={() => this.expandAll()} />
        </div>
      </div>
    );
  }

  render() {
    let loadingText =  this.state.validating ? translate('server.validating') : '';
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.state.wizardLoading || this.state.loading || this.state.validating}
          text={loadingText}/>
        <div className='content-header'>
          <div className='titleBox'>
            {this.renderHeading(translate('common.servers'))}
          </div>
          {this.props.model && this.props.model.size > 0 && this.renderGlobalButtons()}
        </div>
        <div className='wizard-content unlimited-height'>
          {this.props.model && this.props.model.size > 0 && this.renderCollapsibleTable()}
          {!this.state.wizardLoading && this.state.wizardLoadingErrors &&
           this.renderWizardLoadingErrors(
             this.state.wizardLoadingErrors, this.handleCloseLoadingErrorMessage)}
          {this.state.errorMessages.length > 0 && this.renderMessages()}
        </div>
        {this.state.showReplaceModal && this.renderReplaceServerModal()}
        {this.renderSharedWarning()}
        {this.renderPowerOffWarning()}
        {this.renderNoMigrationWarning()}
        {this.renderValidationErrorModal()}
      </div>
    );
  }
}

export default UpdateServers;
