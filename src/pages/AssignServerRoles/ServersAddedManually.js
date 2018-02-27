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
import { fromJS } from 'immutable';
import { translate } from '../../localization/localize.js';
import { ActionButton } from '../../components/Buttons.js';
import { ConfirmModal } from '../../components/Modals.js';
import { ServerInputLine, ServerDropdownLine } from '../../components/ServerUtils.js';
import { postJson, putJson } from '../../utils/RestUtils.js';
import { INPUT_STATUS } from '../../utils/constants.js';
import { MODEL_SERVER_PROPS_ALL } from '../../utils/constants.js';
import { IpV4AddressValidator, MacAddressValidator, UniqueIdValidator } from '../../utils/InputValidators.js';
import { genUID, getNicMappings, getServerGroups, getServerRoles, getAllOtherServerIds, getCleanedServer }
  from '../../utils/ModelUtils.js';


class ServersAddedManually extends Component {
  constructor(props) {
    super(props);

    this.state = {
      validAddServerManuallyForm: false
    };

    this.newServer = {
      'source': 'manual',
      'id': '',
      'uid': genUID('manual'),
      'ip-addr': '',
      'server-group': '',
      'nic-mapping': '',
      'role': '',
      'ilo-ip': '',
      'ilo-user': '',
      'ilo-password': '',
      'mac-addr': ''
    };

    this.allManualInputsStatus = {
      'id': INPUT_STATUS.UNKNOWN,
      'ip-addr': INPUT_STATUS.UNKNOWN,
      'ilo-user': INPUT_STATUS.UNKNOWN,
      'ilo-password': INPUT_STATUS.UNKNOWN,
      'ilo-ip': INPUT_STATUS.UNKNOWN,
      'mac-addr': INPUT_STATUS.UNKNOWN
    };
  }

  componentWillReceiveProps(nextProps) {
    // set server info in edit mode
    if (nextProps.server) {
      this.setNewServer(nextProps.server);
    }
  }

  isManualFormTextInputValid = () => {
    let isAllValid = true;
    let keys = Object.keys(this.allManualInputsStatus);
    keys.forEach(key => {
      let isValid = (this.allManualInputsStatus[key] === INPUT_STATUS.VALID) ||
        // force id and ip-addr to be filled for new server
        (key !== 'id' && key !== 'ip-addr' && this.allManualInputsStatus[key] === INPUT_STATUS.UNKNOWN);
      isAllValid = isAllValid && isValid;
    });

    return isAllValid;
  }

  isServerInfoChanged = () => {
    const changedList = [];
    for (let key in this.props.server) {
      changedList.push(this.props.server[key] !== this.newServer[key]);
    }
    const changed = changedList.filter(change => change === true);
    return changed.length > 0;
  }

  updateManualFormValidity = (props, isValid) => {
    this.allManualInputsStatus[props.inputName] = isValid ? INPUT_STATUS.VALID : INPUT_STATUS.INVALID;
    this.setState({validAddServerManuallyForm: this.isManualFormTextInputValid()});
  }

  resetNewServer = () => {
    this.newServer = {
      'source': 'manual',
      'id': '',
      'uid': genUID('manual'),
      'ip-addr': '',
      'server-group': '',
      'nic-mapping': '',
      'role': '',
      'ilo-ip': '',
      'ilo-user': '',
      'ilo-password': '',
      'mac-addr': ''
    };
    this.setState({validAddServerManuallyForm: false});
  }

  setNewServer(server) {
    this.newServer = {
      'source': 'manual',
      'id': server.id,
      'uid': server.uid,
      'ip-addr': server['ip-addr'],
      'server-group': server['server-group'],
      'nic-mapping': server['nic-mapping'],
      'role': server.role,
      'ilo-ip': server['ilo-ip'],
      'ilo-user': server['ilo-user'],
      'ilo-password': server['ilo-password'],
      'mac-addr': server['mac-addr']
    };
  }

  cancelAddServerManuallyModal = () => {
    this.resetNewServer();
    this.props.closeAction();
  }

  saveServersAddedManually = (serverList) => {
    // if role is provided, add server to the model
    let model = this.props.model;

    serverList.forEach(server => {
      if (server.role) {
        // empty value can cause validation problem
        let modelServer = getCleanedServer(server, MODEL_SERVER_PROPS_ALL);
        model = model.updateIn(['inputModel', 'servers'], list => list.push(fromJS(modelServer)));
      }
    });
    this.props.updateGlobalState('model', model);

    if (this.props.addAction) {
      postJson('/api/v1/server', JSON.stringify(serverList));
      this.props.addAction(serverList);
    } else {
      const server = serverList[0];
      putJson('/api/v1/server', JSON.stringify(server));
      this.props.updateAction(server);
    }

    this.resetNewServer();
  }

  addOneServer = () => {
    this.saveServersAddedManually([this.newServer]);
    this.props.closeAction();
  }

  addMoreServer = () => {
    this.saveServersAddedManually([this.newServer]);
  }

  updateServer = () => {
    this.saveServersAddedManually([this.newServer]);
    this.props.closeAction();
  }

  updateNewServer = (value, key) => {
    this.newServer[key] = value;
    if (this.props.updateAction) {
      this.setState({validAddServerManuallyForm: this.isServerInfoChanged()});
    }
  }

  handleInputLine = (e, valid, props) => {
    let value = e.target.value;
    this.updateManualFormValidity(props, valid);
    if (valid) {
      this.updateNewServer(value, props.inputName);
    }
  }

  renderInputLine = (required, title, name, type, validator) => {
    let theProps = {};
    if (name === 'id' && this.props.show) {
      theProps.ids =
        getAllOtherServerIds(
          this.props.model, this.props.rawDiscoveredServers,
          this.props.serversAddedManually, this.newServer['id']
        );
    }

    return (
      <ServerInputLine isRequired={required} label={title} inputName={name} {...theProps}
        inputType={type} inputValidate={validator} inputAction={this.handleInputLine}
        inputValue={this.newServer[name]}/>
    );
  }

  renderDropdownLine(required, title, name, list, defaultOption) {
    return (
      <ServerDropdownLine label={title} name={name} value={this.newServer[name]} optionList={list}
        isRequired={required} selectAction={(value) => this.updateNewServer(value, name)}
        defaultOption={defaultOption}/>
    );
  }

  render() {
    const serverGroups = getServerGroups(this.props.model);
    const nicMappings = getNicMappings(this.props.model);
    let roles = getServerRoles(this.props.model).map(e => e['serverRole']);
    roles.unshift('');
    if (!this.newServer.role) {
      this.newServer.role = '';
    }
    if (!this.newServer['server-group']) {
      this.newServer['server-group'] = serverGroups[0];
    }
    if (!this.newServer['nic-mapping']) {
      this.newServer['nic-mapping'] = nicMappings[0];
    }
    let defaultOption = {
      label: translate('server.none.prompt'),
      value: ''
    };

    const footer = this.props.addAction ?
      (<div className='btn-row'>
        <ActionButton type={'default'} clickAction={this.cancelAddServerManuallyModal}
          displayLabel={translate('cancel')}/>
        <ActionButton type={'default'} clickAction={this.addMoreServer} displayLabel={translate('add.more')}
          isDisabled={!this.state.validAddServerManuallyForm}/>
        <ActionButton clickAction={this.addOneServer} displayLabel={translate('save')}
          isDisabled={!this.state.validAddServerManuallyForm}/>
      </div>) :
      (<div className='btn-row'>
        <ActionButton type={'default'} clickAction={this.cancelAddServerManuallyModal}
          displayLabel={translate('cancel')}/>
        <ActionButton clickAction={this.updateServer} displayLabel={translate('save')}
          isDisabled={!this.state.validAddServerManuallyForm}/>
      </div>);

    return (
      <ConfirmModal show={this.props.show} className={'manual-discover-modal'}
        title={this.props.addAction ? translate('add.server.add') : translate('edit.server')}
        onHide={this.cancelAddServerManuallyModal} footer={footer}>

        <div className='server-details-container'>
          {this.renderInputLine(true, 'server.id.prompt', 'id', 'text', UniqueIdValidator)}
          {this.renderInputLine(true, 'server.ip.prompt', 'ip-addr', 'text', IpV4AddressValidator)}
          {this.renderDropdownLine(true, 'server.group.prompt', 'server-group', serverGroups)}
          {this.renderDropdownLine(true, 'server.nicmapping.prompt', 'nic-mapping', nicMappings)}
          {this.renderDropdownLine(false, 'server.role.prompt', 'role', roles, defaultOption)}
        </div>
        <div className='message-line'>{translate('server.ipmi.message')}</div>
        <div className='server-details-container'>
          {this.renderInputLine(false, 'server.mac.prompt', 'mac-addr', 'text', MacAddressValidator)}
          {this.renderInputLine(false, 'server.ipmi.ip.prompt', 'ilo-ip', 'text', IpV4AddressValidator)}
          {this.renderInputLine(false, 'server.ipmi.username.prompt', 'ilo-user', 'text')}
          {this.renderInputLine(false, 'server.ipmi.password.prompt', 'ilo-password', 'password')}
        </div>

      </ConfirmModal>
    );
  }

}

export default ServersAddedManually;
