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
import { Map, List } from 'immutable';
import { isEmpty } from 'lodash';
import { translate } from '../../localization/localize.js';
import { LabeledDropdown } from '../../components/LabeledDropdown.js';
import { InputLine } from '../../components/InputLine.js';
import { ActionButton } from '../../components/Buttons.js';
import { ValidatingInput } from '../../components/ValidatingInput.js';
import { alphabetically } from '../../utils/Sort.js';
import {
  IpV4AddressValidator, VLANIDValidator, CidrValidator, UniqueNameValidator, AddressesValidator,
  NoWhiteSpaceValidator, chainValidators
} from '../../utils/InputValidators.js';
import { MODE } from '../../utils/constants.js';
import HelpText from '../../components/HelpText.js';

const MIN_VLANID = 1;
const MAX_VLANID = 4094;

class UpdateNetworks extends Component {
  constructor(props) {
    super(props);

    let network = this.getNetwork(props);
    let initInputs = this.initInputValues(network);
    let initAddresses = network.get('addresses') || List();
    // get a copy of original data
    this.originInputs = Map(initInputs);
    this.originAddresses = List(initAddresses);

    this.state = {
      inputValues: initInputs,
      isInputValid: this.initInputValid(initInputs),
      addresses: initAddresses,
      isAddressValid: this.initAddressValid(initAddresses)
    };
    this.networkGroups = this.getNetworkGroups(props);
  }

  getNetwork(props) {
    return (
      props.mode === MODE.EDIT ? this.getNetworkData(props) : this.getNewNetworkData()
    );
  }

  getNewNetworkData() {
    return Map({
      'name': '', //required
      'vlanid': 1, //required
      'cidr': '',
      'gateway-ip':'',
      'network-group': '', //required
      'tagged-vlan': false
    });
  }

  getNetworkData(props) {
    let network =
      props.model.getIn(['inputModel','networks']).find(
        net => net.get('name') === props.networkName);
    return network;
  }

  initInputValues(network) {
    return Map({
      'name': network.get('name'),
      'vlanid': network.get('vlanid'),
      'cidr': network.get('cidr') || '',
      'gateway-ip': network.get('gateway-ip') || '',
      'network-group': network.get('network-group'),
      'tagged-vlan': network.get('tagged-vlan') || false
    });
  }

  initInputValid(initData) {
    return Map({
      'name': !isEmpty(initData.get('name')),
      'vlanid': initData.get('vlanid') >= MIN_VLANID && initData.get('vlanid') <= MAX_VLANID,
      'cidr': !isEmpty(initData.get('cidr')) ? true : undefined,
      'gateway-ip': !isEmpty(initData.get('gateway-ip')) ? true : undefined,
      'network-group': !isEmpty(initData.get('network-group')),
      'tagged-vlan': true //always valid
    });
  }

  initAddressValid(addresses) {
    if(addresses.size === 0) {
      return List();
    }

    let retList = List();
    for (let i = 0; i < addresses.size; i++) {
      retList = retList.push(true);
    }
    return retList;
  }

  getNetworkGroups = (props) => {
    return props.model.getIn(['inputModel','network-groups']).map(e => e.get('name'))
      .toJS()
      .sort(alphabetically);
  }

  handleUpdateNetwork = () => {
    let model = this.props.model;
    let updateData = Map(this.state.inputValues);
    // remove any key with empty value
    for (let key in updateData.toJS()) {
      if(!updateData.get(key)) {
        updateData = updateData.delete(key);
      }
    }

    // add addresses to save
    if (this.state.addresses.size > 0) {
      let cleanAddrs = this.state.addresses.filter(addr => !isEmpty(addr));
      if (cleanAddrs.size > 0) {
        updateData = updateData.set('addresses', cleanAddrs);
      }
    }

    if(this.props.mode === MODE.ADD) {
      model = model.updateIn(
        ['inputModel', 'networks'], net => net.push(updateData));
      this.props.updateGlobalState('model', model);
    }
    else {
      model = model.updateIn(['inputModel', 'networks'],
        list => list.map(net => {
          if (net.get('name') === this.props.networkName) {
            return updateData;
          }
          else {
            return net;
          }
        })
      );
      this.props.updateGlobalState('model', model);
    }
    this.closeAction();
  }

  handleInputChange = (value, isValid, name) => {
    this.setState((prev) => {
      if(name === 'vlanid') {
        value = parseInt(value);
      }
      return {
        isInputValid: prev.isInputValid.set(name, isValid),
        inputValues: prev.inputValues.set(name, value)
      };
    });
  }

  handleAddressChange = (value, isValid, idx) => {
    this.setState((prev) => {
      return {
        isAddressValid: prev.isAddressValid.set(idx, isValid),
        addresses: prev.addresses.set(idx, value)
      };
    });
  }

  removeAddress = (idx) => {
    this.setState(prevState => {
      return {
        addresses: prevState.addresses.delete(idx),
        isAddressValid: prevState.isAddressValid.delete(idx)
      };
    });
  }

  addAddress = () => {
    this.setState(prevState => {
      return {
        addresses: prevState.addresses.push(''),
        isAddressValid: prevState.isAddressValid.push(undefined)
      };
    });
  }

  isFormValid = () => {
    let isInputValid =
      this.state.isInputValid.every((value, key) =>  value === true ||
        value === undefined && key !== 'name' && key !== 'server-group');
    let isAddressValid = true;
    if(this.state.isAddressValid.size > 0) {
      isAddressValid =
        this.state.isAddressValid.every((value) => value === true || value === undefined);
    }
    return isInputValid && isAddressValid;
  }

  resetData = () => {
    this.setState({
      inputValues: Map(),
      isInputValid: Map(),
      addresses: List(),
      isAddressValid: List()
    });
  }

  checkDataToSave = () => {
    const dataChanged =
      (JSON.stringify(this.originInputs) !== JSON.stringify(this.state.inputValues) ||
      JSON.stringify(this.originAddresses) !== JSON.stringify(this.state.addresses));
    this.props.setDataChanged(this.props.tabIndex, dataChanged);
    return this.isFormValid() && dataChanged;
  }

  renderNewAddressInput () {
    return (
      <div key={0} className='dropdown-plus-minus network-plus-minus'>
        <div className="field-container">
          <ValidatingInput
            inputAction={(e, valid) => this.handleAddressChange(e.target.value, valid, 0)}
            inputType='text' inputValue={''} inputValidate={AddressesValidator}
            isRequired='false' placeholder={translate('network.addresses')}/>
        </div>
      </div>
    );
  }

  renderNetworkAddresses () {
    if(this.state.addresses.size === 0) {
      return this.renderNewAddressInput();
    }
    let addressRows = this.state.addresses.map((addr, idx) => {
      const lastRow = (idx === this.state.addresses.size -1);
      return (
        <div key={idx} className='dropdown-plus-minus network-plus-minus'>
          <div className="field-container">
            <ValidatingInput
              inputAction={(e, valid) => this.handleAddressChange(e.target.value, valid, idx)}
              inputType='text' inputValue={addr} inputValidate={AddressesValidator}
              isRequired='false' placeholder={translate('network.addresses')}/>
          </div>
          <div className='plus-minus-container'>
            <If condition={idx > 0 || !isEmpty(addr)}>
              <span key={'address_minus'} onClick={() => this.removeAddress(idx)}>
                <i className='material-icons left-sign'>remove</i>
              </span>
            </If>
            <If condition={lastRow && this.state.isAddressValid.get(idx) && !isEmpty(addr)}>
              <span key={'address_plus'} onClick={this.addAddress}>
                <i className='material-icons right-sign'>add</i>
              </span>
            </If>
          </div>
        </div>
      );
    });

    return addressRows;
  }

  renderNetworkInput(name, type, isRequired, placeholderText, validate) {
    let extraProps = {};
    //for vlanid
    if(type === 'number') {
      extraProps.min = 1;
      extraProps.max = 4094;
    }

    return (
      <InputLine
        isRequired={isRequired} inputName={name} inputType={type}
        placeholder={placeholderText} inputValidate={validate}
        inputValue={this.state.inputValues.get(name)} {...extraProps}
        inputAction={(e, valid) => this.handleInputChange(e.target.value, valid, name)}/>
    );
  }

  renderNetworkGroup() {
    let emptyOptProps = '';
    if(isEmpty(this.state.inputValues.get('network-group'))) {
      emptyOptProps = {
        label: translate('network.group.please.select'),
        value: 'noopt'
      };
    }
    return (
      <LabeledDropdown value={this.state.inputValues.get('network-group')}
        optionList={this.networkGroups} isRequired={true}
        emptyOption={emptyOptProps}
        selectAction={(value)=>this.handleInputChange(value, true, 'network-group')}/>
    );
  }

  renderTaggedVLAN() {
    const checked = this.state.inputValues.get('tagged-vlan') || false;
    return (
      <div className='tagged-vlan'>
        <input className='tagged' type='checkbox' value='taggedvlan'
          checked={checked} onChange={()=>this.handleInputChange(!checked, true, 'tagged-vlan')}/>
        {translate('tagged-vlan')}
      </div>
    );
  }

  closeAction = () => {
    this.props.setDataChanged(this.props.tabIndex, false);
    this.props.closeAction();
  }

  render() {
    let title =
      this.props.mode === MODE.EDIT ? translate('network.update') : translate('network.add');

    let names = this.props.model.getIn(['inputModel','networks'])
      .map(e => e.get('name')).toJS();
    if(this.props.mode === MODE.EDIT) {
      //remove current name so won't check against it
      names = names.filter(name => name !== this.props.networkName);
    }
    return (
      <div className='details-section network-section'>
        <div className='details-header'>{title}</div>
        <div className='details-body'>
          {this.renderNetworkInput(
            'name', 'text', true, translate('network.name') + '*',
            chainValidators(
              NoWhiteSpaceValidator(translate('input.validator.name.spaces.error')),
              UniqueNameValidator(names)
            )
          )}
          <div className='details-group-title'>{translate('vlanid') + '*:'}
            <HelpText tooltipText={translate('tooltip.network.vlanid')}/></div>
          {this.renderNetworkInput('vlanid', 'number', true, translate('vlanid'), VLANIDValidator)}
          <div className='details-group-title'>{translate('cidr') + ':'}
            <HelpText tooltipText={translate('tooltip.network.cidr')}/></div>
          {this.renderNetworkInput('cidr', 'text', false, translate('cidr'), CidrValidator)}
          <div className='details-group-title'>{translate('network.addresses') + ':'}
            <HelpText tooltipText={translate('tooltip.network.addresses')}/></div>
          {this.renderNetworkAddresses()}
          <div className='details-group-title'>{translate('network.gateway') + ':'}</div>
          {this.renderNetworkInput('gateway-ip', 'text', false, translate('network.gateway'), IpV4AddressValidator)}
          <div className='details-group-title'>{translate('network.groups') + '*:'}</div>
          {this.renderNetworkGroup()}
          {this.renderTaggedVLAN()}
          <div className='btn-row details-btn network-more-width'>
            <div className='btn-container'>
              <ActionButton key='networkCancel' type='default' clickAction={this.closeAction}
                displayLabel={translate('cancel')}/>
              <ActionButton key='networkSave' clickAction={this.handleUpdateNetwork}
                displayLabel={translate('save')} isDisabled={!this.checkDataToSave()}/>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default UpdateNetworks;
