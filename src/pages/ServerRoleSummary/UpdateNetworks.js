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
import { LabeledDropdown } from '../../components/LabeledDropdown.js';
import { InputLine } from '../../components/InputLine.js';
import { ActionButton } from '../../components/Buttons.js';
import { ValidatingInput } from '../../components/ValidatingInput.js';
import { alphabetically } from '../../utils/Sort.js';
import {
  IpV4AddressValidator, VLANIDValidator, CidrValidator, UniqueNameValidator, AddressesValidator, NoWhiteSpaceValidator,
  chainValidators
} from '../../utils/InputValidators.js';
import { MODE, INPUT_STATUS } from '../../utils/constants.js';
import HelpText from '../../components/HelpText.js';

class UpdateNetworks extends Component {
  constructor(props) {
    super(props);
    this.networkGroups = this.getNetworkGroups(props);
    this.allInputsStatus = {
      'name': INPUT_STATUS.UNKNOWN,
      'vlanid': INPUT_STATUS.UNKNOWN,
      'cidr': INPUT_STATUS.UNKNOWN,
      'gateway-ip': INPUT_STATUS.UNKNOWN
    };

    this.allAddressesStatus = [];

    let networks = props.mode === MODE.EDIT ? this.getNetworkData(props) : {};
    networks.addresses = this.initAddresses(networks);
    this.state = {
      isFormValid: false,
      data: networks,
    };

    this.origData = networks;
  }

  resetData = () => {
    this.setState({
      isFormValid: false,
      data: {addresses: []},
    });
  }

  initAddresses(networks) {
    // for UI state addresses
    let retAddresses = networks['addresses'] ? networks['addresses'] : [];

    // init validation status
    this.allAddressesStatus = retAddresses.map((addr) => {
      return INPUT_STATUS.VALID;
    });
    return retAddresses;
  }

  getNetworkData(props) {
    const name = props.networkName;
    let network =
      props.model.getIn(['inputModel','networks']).find(net => net.get('name') === name);
    return JSON.parse(JSON.stringify(network));
  }

  isFormTextInputValid() {
    let isAllValid = true;
    let values = Object.values(this.allInputsStatus);
    isAllValid =
      (values.every((val) => {return val === INPUT_STATUS.VALID || val === INPUT_STATUS.UNKNOWN;})) &&
      this.allInputsStatus['name'] !== INPUT_STATUS.UNKNOWN &&
      this.allInputsStatus['vlanid'] !== INPUT_STATUS.UNKNOWN && (
        this.allAddressesStatus.length === 0 || this.allAddressesStatus.every((val) => {
          return val === INPUT_STATUS.VALID;
        })
      );

    return isAllValid;
  }

  isFormDropdownValid() {
    let isValid = true;
    if(this.state.data['network-group'] === '' || this.state.data['network-group'] === undefined) {
      isValid = false;
    }
    return isValid;
  }

  updateFormValidity = (props, isValid) => {
    this.allInputsStatus[props.inputName] = isValid ? INPUT_STATUS.VALID : INPUT_STATUS.INVALID;
    this.setState({isFormValid: this.isFormTextInputValid() && this.isFormDropdownValid()});
  }

  handleSelectNetworkGroup = (groupName) => {
    this.setState(prevState => {
      const newData = JSON.parse(JSON.stringify(prevState.data));
      newData['network-group'] = groupName;
      return {
        data: newData,
        isFormValid: this.isFormTextInputValid() && this.isFormDropdownValid()
      };
    });
  }

  handleInputChange = (e, isValid, props) => {
    let value = e.target.value;
    this.updateFormValidity(props, isValid);
    if (isValid) {
      if(props.inputName === 'vlanid') {
        value = parseInt(value);
      }

      this.setState(prevState => {
        const newData = JSON.parse(JSON.stringify(prevState.data));
        newData[props.inputName] = value;
        return {data: newData};
      });
    }
  }

  handleAddressChange = (e, isValid, props, idx) => {
    let value = e.target.value;
    if (isValid) {
      this.allAddressesStatus[idx] = INPUT_STATUS.VALID;

      this.setState(prevState => {
        const newData = JSON.parse(JSON.stringify(prevState.data));
        newData.addresses[idx] = value;
        return {data: newData};
      });
    }
    else {
      this.allAddressesStatus[idx] = INPUT_STATUS.INVALID;
    }

    this.updateFormValidity(props, isValid);
  }

  handleUpdateNetwork = () => {
    let model = this.props.model;
    for (let key in this.state.data) {
      if(this.state.data[key] === undefined || this.state.data[key] === '') {
        delete this.state.data[key];
      }

      if (key === 'addresses') {
        let cleanAddrs = this.state.data.addresses.filter(addr => addr !== '');
        if (cleanAddrs.length === 0) {
          delete this.state.data[key];
        }
        else {
          this.state.data[key] = cleanAddrs;
        }
      }
    }

    if(this.props.mode === MODE.ADD) {
      model = model.updateIn(
        ['inputModel', 'networks'], net => net.push(fromJS(this.state.data)));
      this.props.updateGlobalState('model', model);
    }
    else {
      let idx = model.getIn(['inputModel','networks']).findIndex(
        net => net.get('name') === this.props.networkName);
      model = model.updateIn(['inputModel', 'networks'],
        net => net.splice(idx, 1, fromJS(this.state.data)));
      this.props.updateGlobalState('model', model);
    }
    this.closeAction();
  }

  handleTaggedVLANChange = () => {
    this.setState(prevState => {
      const newData = JSON.parse(JSON.stringify(prevState.data));
      newData['tagged-vlan'] = !prevState.data['tagged-vlan'];
      return {data: newData};
    });
  }

  getNetworkGroups = (props) => {
    return props.model.getIn(['inputModel','network-groups']).map(e => e.get('name'))
      .toJS()
      .sort(alphabetically);
  }

  removeAddress = (idx) => {
    this.setState(prevState => {
      const newData = JSON.parse(JSON.stringify(prevState.data));
      newData.addresses.splice(idx, 1);
      return {data: newData};
    });
    // remove status
    this.allAddressesStatus.splice(idx, 1);
  }

  addAddress = () => {
    this.setState(prevState => {
      const newData = JSON.parse(JSON.stringify(prevState.data));
      newData.addresses.push('');
      return {data: newData};
    });
  }

  renderNewAddressInput () {
    return (
      <div key={0} className='dropdown-plus-minus network-plus-minus'>
        <div className="field-container">
          <ValidatingInput
            inputAction={(e, valid, props) => this.handleAddressChange(e, valid, props, 0)}
            inputType='text' inputValue={''} inputValidate={AddressesValidator}
            isRequired='false' placeholder={translate('network.addresses')}/>
        </div>
      </div>
    );
  }

  renderNetworkAddresses () {
    if(this.state.data.addresses.length === 0) {
      return this.renderNewAddressInput();
    }
    let addressRows = this.state.data.addresses.map((addr, idx) => {
      const lastRow = (idx === this.state.data.addresses.length -1);
      return (
        <div key={idx} className='dropdown-plus-minus network-plus-minus'>
          <div className="field-container">
            <ValidatingInput
              inputAction={(e, valid, props) => this.handleAddressChange(e, valid, props, idx)}
              inputType='text' inputValue={addr} inputValidate={AddressesValidator}
              isRequired='false' placeholder={translate('network.addresses')}/>
          </div>
          <div className='plus-minus-container'>
            { idx > 0 || (addr !== '') ?
              <span key={'address_minus'} onClick={() => this.removeAddress(idx)}>
                <i className='material-icons left-sign'>remove</i>
              </span>
              : ''}
            { lastRow && (this.allAddressesStatus[idx] !== INPUT_STATUS.INVALID && addr !== '') ?
              <span key={'address_plus'} onClick={this.addAddress}>
                <i className='material-icons right-sign'>add</i>
              </span>
              : ''}
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

    if(this.props.mode === MODE.EDIT) {
      extraProps.updateFormValidity = this.updateFormValidity;
    }

    return (
      <InputLine
        isRequired={isRequired} inputName={name} inputType={type}
        placeholder={placeholderText} inputValidate={validate}
        inputValue={this.props.mode === MODE.EDIT ? this.state.data[name] : ''} {...extraProps}
        inputAction={this.handleInputChange}/>
    );
  }

  renderNetworkGroup() {
    let emptyOptProps = '';
    if(this.state.data['network-group'] === '' || this.state.data['network-group'] === undefined) {
      emptyOptProps = {
        label: translate('network.group.please.select'),
        value: 'noopt'
      };
    }
    return (
      <LabeledDropdown value={this.state.data['network-group']}
        optionList={this.networkGroups} isRequired={true}
        emptyOption={emptyOptProps} selectAction={this.handleSelectNetworkGroup}/>
    );
  }

  renderTaggedVLAN() {
    const checked = this.state.data['tagged-vlan'] !== '' && this.state.data['tagged-vlan'] !== undefined ?
      this.state.data['tagged-vlan'] : false;
    return (
      <div className='tagged-vlan'>
        <input className='tagged' type='checkbox' value='taggedvlan'
          checked={checked} onChange={this.handleTaggedVLANChange}/>
        {translate('tagged-vlan')}
      </div>
    );
  }

  checkDataToSave = () => {
    const dataChanged = JSON.stringify(this.origData) !== JSON.stringify(this.state.data);
    this.props.setDataChanged(this.props.tabIndex, dataChanged);
    return this.state.isFormValid && dataChanged;
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
      let idx = this.props.model.getIn(['inputModel','networks']).findIndex(
        net => net.get('name') === this.props.networkName);
      names.splice(idx, 1);
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
