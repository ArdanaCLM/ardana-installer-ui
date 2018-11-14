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
import { Map } from 'immutable';
import { translate } from '../../localization/localize.js';
import { ActionButton } from '../../components/Buttons.js';
import { LabeledDropdown } from '../../components/LabeledDropdown.js';
import { ConfirmModal } from '../../components/Modals.js';
import { InputLine } from '../../components/InputLine.js';
import { postJson, putJson } from '../../utils/RestUtils.js';
import { MODEL_SERVER_PROPS_ALL } from '../../utils/constants.js';
import { isEmpty } from 'lodash';
import { IpV4AddressValidator, MacAddressValidator, createExcludesValidator } from '../../utils/InputValidators.js';
import {
  genUID, getNicMappings, getServerGroups, getServerRoles, getAllOtherServerIds, matchRolesLimit
} from '../../utils/ModelUtils.js';


class ServersAddedManually extends Component {
  constructor(props) {
    super(props);

    // Use the values from the server given in props, if passed
    if (props.server) {
      this.state = {
        inputValue: Map({
          'source': props.server.source || 'manual',
          'id': props.server.id || '',
          'uid': props.server.uid || genUID('manual'),
          'ip-addr': props.server['ip-addr'] || '',
          'server-group': props.server['server-group'] || '',
          'nic-mapping': props.server['nic-mapping'] || '',
          'role': props.server['role'] || '',
          'ilo-user': props.server['ilo-user'] || '',
          'ilo-password': props.server['ilo-password'] || '',
          'ilo-ip': props.server['ilo-ip'] || '',
          'mac-addr': props.server['mac-addr'] || '',
        }),
        isValid: Map({
          'id': !isEmpty(props.server.id),
          'ip-addr': !isEmpty(props.server['ip-addr']),
          'ilo-user': !isEmpty(props.server['ilo-user']) ? true : undefined,
          'ilo-password': !isEmpty(props.server['ilo-password']) ? true : undefined,
          'ilo-ip': !isEmpty(props.server['ilo-ip']) ? true : undefined,
          'mac-addr': !isEmpty(props.server['mac-addr']) ? true : undefined,
        })
      };
    } else {
      this.state = this.getNewServer(props.model);
    }
  }

  // Return new server state variables with appropriate defaults
  getNewServer(model) {
    const serverGroups = getServerGroups(model);
    const nicMappings = getNicMappings(model);

    return {
      inputValue: Map({
        'source': 'manual',
        'id': '',
        'uid': genUID('manual'),
        'ip-addr': '',
        'server-group': serverGroups[0],
        'nic-mapping': nicMappings[0],
        'role': '',
        'ilo-user': '',
        'ilo-password': '',
        'ilo-ip': '',
        'mac-addr': '',
      }),
      isValid: Map({
        'id': undefined,
        'ip-addr': undefined,
        'ilo-user': undefined,
        'ilo-password': undefined,
        'ilo-ip': undefined,
        'mac-addr': undefined,
      })
    };
  }

  isFormInputValid() {
    return this.state.isValid.every((value, key) => value === true || (value === undefined &&
      key !== 'id' && key !== 'ip-addr'));
  }

  saveServer() {
    // if role is provided, add server to the model
    let model = this.props.model;

    let server = this.state.inputValue;
    if (server.get('role')) {
      // if role is set, then the server should be updated in the model
      let modelServer = server.filter((v,k) => MODEL_SERVER_PROPS_ALL.includes(k) && !isEmpty(v));
      model = model.updateIn(['inputModel', 'servers'], list => list.push(modelServer));
      this.props.updateGlobalState('model', model);
    }

    // Call the callback props and update the server list in the shim
    if (this.props.addAction) {
      postJson('/api/v1/server', [server])
        .then(() =>
          this.props.addAction(server.toJS())
        );
    } else {
      putJson('/api/v1/server', server)
        .then(() =>
          this.props.updateAction(server.toJS())
        );
    }
  }

  saveAndClose(event) {
    event?.preventDefault();
    this.saveServer();
    this.props.closeAction();
  }

  saveAndClear() {
    this.saveServer();
    this.setState(this.getNewServer(this.props.model));
  }

  handleInputChange(value, valid, name) {
    this.setState((prev) => ({
      isValid: prev.isValid.set(name, valid),
      inputValue: prev.inputValue.set(name, value)
    }));
  }

  renderInputLine = (required, title, name, type, validator) => {
    return (
      <InputLine isRequired={required} label={title} inputName={name}
        inputType={type} inputValidate={validator}
        inputAction={(e, valid) => this.handleInputChange(e.target.value, valid, name)}
        inputValue={this.state.inputValue.get(name)}/>
    );
  }

  renderDropdownLine(required, title, name, list, defaultOption) {
    return (
      <LabeledDropdown label={title} name={name} value={this.state.inputValue.get(name)} optionList={list}
        isRequired={required} selectAction={(value) => this.handleInputChange(value, true, name)}
        defaultOption={defaultOption}/>
    );
  }

  render() {
    const isValid = this.isFormInputValid();
    const serverGroups = getServerGroups(this.props.model);
    const nicMappings = getNicMappings(this.props.model);
    let roles = getServerRoles(this.props.model).map(e => e['serverRole']);
    // for update, if have rolesLimit, only show limited roles
    if(this.props.rolesLimit) {
      roles = roles.filter(role => matchRolesLimit(role, this.props.rolesLimit));
    }
    roles.unshift('');

    let defaultOption = {
      label: translate('server.none.prompt'),
      value: ''
    };

    let addOnlyButton;
    if (this.props.addAction) {
      addOnlyButton = (<ActionButton type={'default'} clickAction={::this.saveAndClear}
        displayLabel={translate('add.more')} isDisabled={!isValid}/>);
    }

    const footer = (
      <div className='btn-row'>
        <ActionButton type={'default'} clickAction={this.props.closeAction} displayLabel={translate('cancel')}/>
        {addOnlyButton}
        <ActionButton clickAction={::this.saveAndClose} displayLabel={translate('save')} isDisabled={!isValid}/>
      </div>
    );

    // Avoid re-using any existing server ids
    const existingIds = getAllOtherServerIds(
      this.props.model, this.props.rawDiscoveredServers,
      this.props.serversAddedManually, this.state.inputValue.get('id')
    );

    return (
      <ConfirmModal className={'manual-discover-modal'}
        title={this.props.addAction ? translate('add.server.add') : translate('edit.server')}
        onHide={this.props.closeAction} footer={footer}>

        <form onSubmit={::this.saveAndClose}>
          <div className='server-details-container'>
            {this.renderInputLine(true, 'server.id.prompt', 'id', 'text', createExcludesValidator(existingIds))}
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
        </form>

      </ConfirmModal>
    );
  }
}

export default ServersAddedManually;
