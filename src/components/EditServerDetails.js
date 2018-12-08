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
import { isEmpty } from 'lodash';
import { translate } from '../localization/localize.js';
import { ActionButton } from '../components/Buttons.js';
import { InputLine } from '../components/InputLine.js';
import { ListDropdown } from '../components/ListDropdown.js';
import { IpV4AddressValidator, MacAddressValidator, UniqueIdValidator,
  chainValidators, NoWhiteSpaceValidator, createExcludesValidator }
  from '../utils/InputValidators.js';
import { EditCloudSettings } from '../pages/ServerRoleSummary/EditCloudSettings.js';
import { getNicMappings, getServerGroups, genUID } from '../utils/ModelUtils.js';
import { ConfirmModal } from './Modals.js';

class EditServerDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      inputValues: this.initInputValues(props),
      isValid: this.initInputValid(props),
      showAddServerGroup: false,
      showAddNicMapping: false,
      nicMappings: getNicMappings(props.model),
      serverGroups: getServerGroups(props.model)
    };
  }

  initInputValues(props) {
    return Map({
      'id': props.data.id,
      'ip-addr': props.data['ip-addr'] || '',
      'server-group': props.data['server-group'] || '',
      'nic-mapping': props.data['nic-mapping'] || '',
      'ilo-ip': props.data['ilo-ip'] || '',
      'ilo-user': props.data['ilo-user'] || '',
      'ilo-password': props.data['ilo-password'] || '',
      'mac-addr': props.data['mac-addr'] || '',
      'uid': props.data.uid || genUID('manual'),
      'role': props.data['role']
    });
  }

  initInputValid(props) {
    return  Map({
      'id': !isEmpty(props.data.id),
      'ip-addr': !isEmpty(props.data['ip-addr']),
      'server-group': !isEmpty(props.data['server-group']),
      'nic-mapping': !isEmpty(props.data['nic-mapping']),
      'ilo-ip': !isEmpty(props.data['ilo-ip']) ? true : undefined,
      'ilo-user': !isEmpty(props.data['ilo-user']) ? true : undefined,
      'ilo-password': !isEmpty(props.data['ilo-password']) ? true : undefined,
      'mac-addr': !isEmpty(props.data['mac-addr']) ? true : undefined,
    });
  }

  isFormInputValid() {
    return this.state.isValid.every((value, key) => value === true || (value === undefined &&
      key !== 'id' && key !== 'ip-addr' && key !== 'nic-mapping' && key !== 'server-group'));
  }

  handleDone() {
    this.props.doneAction(this.state.inputValues.toJS(), this.props.data.id);
  }

  handleInputChange(value, isValid, name) {
    this.setState((prev) => ({
      isValid: prev.isValid.set(name, isValid),
      inputValues: prev.inputValues.set(name, value)
    }));
  }

  renderInput(name, type, isRequired, title, validate) {
    return (
      <InputLine
        isRequired={isRequired} inputName={name} inputType={type} label={title}
        inputValidate={validate} inputValue={this.state.inputValues.get(name)} moreClass={'has-button'}
        inputAction={(e, valid) => this.handleInputChange(e.target.value, valid, name)}/>
    );
  }

  addServerGroup(event) {
    event?.preventDefault();
    this.setState({showAddServerGroup: true});
  }

  addNicMapping(event) {
    event?.preventDefault();
    this.setState({showAddNicMapping: true});
  }

  closeAddServerGroup() {
    this.setState({showAddServerGroup: false, serverGroups: getServerGroups(this.props.model)});
  }

  closeAddNicMapping() {
    this.setState({showAddNicMapping: false, nicMappings: getNicMappings(this.props.model)});
  }

  renderAddServerGroup() {
    return (
      <EditCloudSettings model={this.props.model}
        oneTab='server-group' onHide={::this.closeAddServerGroup}
        updateGlobalState={this.props.updateGlobalState}/>
    );
  }

  renderAddNicMapping() {
    return (
      <EditCloudSettings model={this.props.model}
        oneTab='nic-mapping' onHide={::this.closeAddNicMapping}
        updateGlobalState={this.props.updateGlobalState}/>
    );
  }

  renderButtonForDropDown(addAction, buttonLabel) {
    return (
      <ActionButton type={'default'} clickAction={addAction} moreClass={'inline-button'}
        displayLabel={translate(buttonLabel) + ' ...'}/>
    );
  }

  renderDropDown(name, list, handler, isRequired, title, buttonLabel, addAction) {
    let emptyOptProps = '';
    if(isEmpty(this.state.inputValues.get(name))) {
      emptyOptProps = {
        label: translate('server.please.select'),
        value: 'noopt'
      };
    }
    return (
      <div className='detail-line'>
        <div className='detail-heading'>{translate(title) + '*'}</div>
        <div className='input-body'>
          <div className='input-with-button'>
            <ListDropdown name={this.props.name} value={this.state.inputValues.get(name)} moreClass={'has-button'}
              optionList={list} emptyOption={emptyOptProps}
              selectAction={(value)=>handler(value, true, name)}/>
            <If condition={!this.props.isUpdateMode}>
              {this.renderButtonForDropDown(addAction, buttonLabel)}
            </If>
          </div>
        </div>
      </div>
    );
  }

  renderTextLine(title, value) {
    return (
      <div className='detail-line'>
        <div className='detail-heading'>{translate(title)}</div>
        <div className='info-body'>{value}</div>
      </div>
    );
  }

  renderServerContent() {
    return (
      <div>
        <div className='server-details-container'>
          {this.renderInput(
            'id', 'text', true, 'server.id.prompt',
            chainValidators(
              NoWhiteSpaceValidator(translate('input.validator.id.spaces.error')),
              UniqueIdValidator(this.props.ids)
            )
          )}
          {this.renderTextLine('server.role.prompt', this.state.inputValues.get('role'))}
          {this.renderInput(
            'ip-addr', 'text', true, 'server.ip.prompt',
            chainValidators(
              createExcludesValidator(
                this.props.existIPAddressesModel,
                translate('input.validator.ipv4address.exist.error')
              ),
              IpV4AddressValidator
            )
          )}
          {this.renderDropDown('server-group', this.state.serverGroups, ::this.handleInputChange, true,
            'server.group.prompt', 'server.group.prompt', ::this.addServerGroup)}
          {this.renderDropDown('nic-mapping', this.state.nicMappings, ::this.handleInputChange, true,
            'server.nicmapping.prompt', 'server.nicmapping.prompt', ::this.addNicMapping)}
        </div>
        <div className='message-line'>{translate('server.ipmi.message')}</div>
        <div className='server-details-container'>
          {this.renderInput(
            'mac-addr', 'text', false, 'server.mac.prompt',
            chainValidators(
              createExcludesValidator(
                this.props.existMacAddressesModel,
                translate('input.validator.macaddress.exist.error')
              ),
              MacAddressValidator
            )
          )}
          {this.renderInput(
            'ilo-ip', 'text', false, 'server.ipmi.ip.prompt',
            chainValidators(
              createExcludesValidator(
                this.props.existIPMIAddressesModel,
                translate('input.validator.ipv4address.exist.error')
              ),
              IpV4AddressValidator)
          )}
          {this.renderInput('ilo-user', 'text', false, 'server.ipmi.username.prompt')}
          {this.renderInput('ilo-password', 'password', false, 'server.ipmi.password.prompt')}
        </div>
      </div>
    );
  }

  renderFooter() {
    return (
      <div className='btn-row input-button-container'>
        <ActionButton type='default'
          clickAction={this.props.cancelAction} displayLabel={translate('cancel')}/>
        <ActionButton
          isDisabled={!this.isFormInputValid()}
          clickAction={::this.handleDone} displayLabel={translate('done')}/>
      </div>
    );
  }

  render() {
    return (
      <ConfirmModal className={this.props.className} title={this.props.title}
        onHide={this.props.cancelAction} footer={this.renderFooter()}>
        <div className='edit-server-details'>
          <form onSubmit={::this.handleDone}>
            {this.renderServerContent()}
          </form>
          <If condition={!this.props.isUpdateMode && this.state.showAddServerGroup}>
            {this.renderAddServerGroup()}
          </If>
          <If condition={!this.props.isUpdateMode && this.state.showAddNicMapping}>
            {this.renderAddNicMapping()}
          </If>
        </div>
      </ConfirmModal>
    );
  }
}

export default EditServerDetails;
