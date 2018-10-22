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
import { MODEL_SERVER_PROPS_ALL, REPLACE_SERVER_PROPS } from '../utils/constants.js';
import { updateServersInModel, getMergedServer } from '../utils/ModelUtils.js';
import { fetchJson, postJson, putJson } from '../utils/RestUtils.js';
import ReplaceServerDetails from '../components/ReplaceServerDetails.js';
import { BaseInputModal, ConfirmModal } from '../components/Modals.js';

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
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.model !== prevProps.model)
    {
      const allGroups = this.props.model.getIn(['inputModel', 'server-roles']).map(e => e.get('name'));
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

  updateServerForReplaceServer = (server) => {
    let old = this.state.servers.find(s => server.uid === s.uid);
    if (old) {
      const updated_server = getMergedServer(old, server, REPLACE_SERVER_PROPS);
      putJson('/api/v1/server', updated_server)
        .catch(error => {
          let msg = translate('server.save.error', error.toString());
          this.setState(prev => ({ errorMessages: prev.errorMessages.concat(msg)}));
        });
    }
  }

  assembleProcessPages = (theProps) => {
    let pages = [];

    pages.push({
      name: 'PrepareReplace',
      component: UpdateServerPages.PrepareReplace
    });

    //TODO other pages based on the theProps

    if(theProps.installOS) {
      pages.push({
        name: 'InstallOS',
        component: UpdateServerPages.InstallOS
      });
    }

    pages.push({
      name: 'UpdateComplete',
      component: UpdateServerPages.UpdateComplete
    });
    return pages;
  }

  replaceServer = (server, theProps) =>  {
    // update model
    let model =
      updateServersInModel(server, this.props.model, MODEL_SERVER_PROPS_ALL, server.id);
    this.props.updateGlobalState('model', model);

    // the new server is from discovered servers or manual servers
    // need to update
    if(theProps.selectedServerId) {
      this.updateServerForReplaceServer(server);
    }

    // TODO record only pass id and ip for now, not really used
    // at this point. might be in the future. If it turns out no
    // no use at all, remove it
    theProps.server = {id : server.id, 'ip': server['ip-addr']};

    let pages = this.assembleProcessPages(theProps);

    // trigger update process to start which calls the startUpdate in
    // InstallWizard
    this.props.startUpdateProcess('ReplaceServer', pages, theProps);
  }

  handleCloseMessage = (idx) => {
    this.setState((prevState) => {
      let msgs = prevState.errorMessages.slice();
      msgs.splice(idx, 1);
      return {errorMessages: msgs};
    });
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
              // If the node is still reachable, then display a message to the user to have them
              // power it down.
              this.setState({loading: false, showPowerOffWarning: true});
            })
            .catch(error => {
              if (error.status == 404) {
                console.log(   // eslint-disable-line no-console
                  'The 404 immediately preceding this message is expected, '+
                  'and it means that the server is in the correct state (powered off)');
                // 404 means the server is not found, which is the state that we *want* to be in.
                // Proceed with the modal for entering the replacement info.
                this.setState({
                  loading: false,
                  showReplaceModal: true,
                  serverToReplace: server
                });
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

  handleDoneReplaceServer = (server, wipeDisk, installOS) => {
    this.replaceServer(server, wipeDisk, installOS);
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
    return (
      <div className='wizard-page'>
        <LoadingMask show={this.state.wizardLoading || this.state.loading}/>
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
      </div>
    );
  }
}

export default UpdateServers;
