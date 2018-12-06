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

import React, { Component } from 'react';
import { isEmpty } from 'lodash';
import { MODEL_SERVER_PROPS, REPLACE_SERVER_MAC_IPMI_PROPS } from '../utils/constants.js';
import { translate } from '../localization/localize.js';
import { ActionButton } from '../components/Buttons.js';
import { InputLine } from '../components/InputLine.js';
import { ListDropdown } from '../components/ListDropdown.js';
import {
  IpV4AddressValidator, MacAddressValidator, UniqueIdValidator,
  createExcludesValidator, chainValidators, NoWhiteSpaceValidator }
  from '../utils/InputValidators.js';
import {
  maskPassword, getNicMappings, getServerGroups, getAllOtherServerIds, isComputeNode }
  from '../utils/ModelUtils.js';
import HelpText from '../components/HelpText.js';
import { Map, List } from 'immutable';
import {fetchJson} from '../utils/RestUtils.js';


class ReplaceServerDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isInstallOsSelected: false,
      isWipeDiskSelected: false,
      isUseAvailServersSelected: false,
      inputValue: this.initInputs(props),

      selectedServerId: undefined,
      osInstallUsername: undefined,
      osInstallPassword: undefined,

      isValid: this.initInputsValid(props),
      isOsInstallPasswordValid: undefined,
      nicMappings: getNicMappings(props.model),
      serverGroups: getServerGroups(props.model)
    };
  }

  componentDidMount() {
    fetchJson('/api/v2/user')
      .then(responseData => {
        this.setState({
          osInstallUsername: responseData['username']
        });
      });
  }

  initInputs = (props) => {
    let inputs = {};

    if (isComputeNode(props.data)) {
      MODEL_SERVER_PROPS.forEach(input_name => {
        inputs[input_name] = '';
      });
    }
    else {
      REPLACE_SERVER_MAC_IPMI_PROPS.forEach(input_name => {
        inputs[input_name] = '';
      });
    }

    return Map(inputs);
  }

  initInputsValid = (props) => {
    let inputValid = {};

    if (isComputeNode(props.data)) {
      MODEL_SERVER_PROPS.forEach(input_name => {
        inputValid[input_name] = undefined;
      });
    }
    else {
      REPLACE_SERVER_MAC_IPMI_PROPS.forEach(input_name => {
        inputValid[input_name] = undefined;
      });
    }

    return Map(inputValid);
  }

  isServerInputsValid = () => {
    // if it is compute node and install os is not checked
    // only check MAC and IMPI inputs when user inputs them
    if (isComputeNode(this.props.data) && !this.state.isInstallOsSelected) {
      return this.state.isValid.every((value, key) =>{
        if (REPLACE_SERVER_MAC_IPMI_PROPS.includes(key)) {
          return value === true || value === undefined;
        }
        else {
          return value === true;
        }
      });
    }

    return this.state.isValid.every((value) => value === true);
  }

  isFormInputValid = () => {

    // The form is valid if all of the fields are valid.  The OS install password only has
    // to be valid when the OS Install checkbox is selected
    return this.isServerInputsValid() &&
      (this.state.isOsInstallPasswordValid || !this.state.isInstallOsSelected);
  }

  handleDone = () => {
    let server = {};
    // if it is compute node, will take all user inputs
    // for the new compute node
    if(isComputeNode(this.props.data)) {
      MODEL_SERVER_PROPS.forEach(input_name => {
        server[input_name] = this.state.inputValue.get(input_name);
      });
    }
    else { // if it is non-compute node, only replace the mac-addr and ipmi info
      server = Object.assign({}, this.props.data);
      REPLACE_SERVER_MAC_IPMI_PROPS.forEach(input_name => {
        server[input_name] = this.state.inputValue.get(input_name);
      });
    }

    let theProps = {
      wipeDisk : this.state.isWipeDiskSelected,
      installOS : this.state.isInstallOsSelected
    };
    if(this.state.isInstallOsSelected) {
      theProps.osInstallUsername = this.state.osInstallUsername;
      theProps.osInstallPassword = this.state.osInstallPassword; //TODO where to store
    }

    // picked from available server, this is used to
    // update the available servers or manual servers list
    if(this.state.selectedServerId) {
      theProps.selectedServerId = this.state.selectedServerId;
    }

    this.props.doneAction(server, theProps);
  }

  handleInputChange = (e, valid, props) => {

    const value = e.target.value;
    const name = props.inputName;

    this.setState((prev) => ({
      isValid: prev.isValid.set(name, valid),
      inputValue: prev.inputValue.set(name, value)
    }));
  }

  handleOsPasswordChange = (e, valid, props) => {
    const value = e.target.value;
    this.setState({
      isOsInstallPasswordValid: valid,
      osInstallPassword: value,
    });
  }

  handleInstallOsCheck = (e) => {
    const selected = e.target.checked;
    this.setState({isInstallOsSelected: selected});
  }

  handleWipeDiskCheck = (e) => {
    const selected = e.target.checked;
    this.setState({isWipeDiskSelected: selected});
  }

  handleUseAvailServersCheck = (e) => {
    const selected = e.target.checked;

    this.setState((prev) => {
      let newState = {
        isUseAvailServersSelected: selected,
      };

      // If the user had previously selected an available server but is now
      // un-selecting a server, clear out all relevant fields
      if (!selected && prev.selectedServerId) {
        newState.inputValue = this.initInputs(this.props);
        // Reset (to undefined) the validity of the fields being cleared
        newState.isValid = this.initInputsValid(this.props);
        newState.selectedServerId = '';
      }

      return newState;
    });
  }

  handleSelectAvailableServer = (serverId) => {
    const server = this.props.availableServers.find(server => server.id === serverId);
    if (server) {
      this.setState((prev) => {
        let inputValue = prev.inputValue;
        let isValid = prev.isValid;

        // Copy the fields of interest from known servers, and set the validity
        // of each field depending on whether it is populated
        for (let key of this.getInputNames()) {
          const valueToCopy = server[key] || '';
          inputValue = inputValue.set(key, valueToCopy);
          // if it is compute node, not isInstallOsSelected, mac-addr and ipmpi
          // info can be empty
          if(isComputeNode(this.props.data) && !this.state.isInstallOsSelected &&
            REPLACE_SERVER_MAC_IPMI_PROPS.includes(key)) {
            isValid = isValid.set(key, (valueToCopy.length > 0) || undefined);
          }
          else {
            isValid = isValid.set(key, (valueToCopy.length > 0));
          }
        }
        return {
          selectedServerId: serverId,
          inputValue: inputValue,
          isValid: isValid,
        };
      });
    }
  }

  handleSelectGroup = (groupName) => {
    this.setState((prev) => ({
      isValid: prev.isValid.set('server-group', true),
      inputValue: prev.inputValue.set('server-group', groupName)
    }));
  }

  handleSelectNicMapping = (nicMapName) => {
    this.setState((prev) => ({
      isValid: prev.isValid.set('nic-mapping', true),
      inputValue: prev.inputValue.set('nic-mapping', nicMapName)
    }));
  }

  getInputNames = () => {
    if(isComputeNode(this.props.data)) {
      return  MODEL_SERVER_PROPS;
    }
    else {
      return REPLACE_SERVER_MAC_IPMI_PROPS;
    }
  }

  // Helper function to create a pair of TH and TD entries with the given name
  labelField = (name) => {
    return (
      <>
        <th>{translate('replace.server.details.'+name)}</th>
        <td>{this.props.data[name]}</td>
      </>);
  }

  renderDetailsTable = () => {
    return (
      <table className='table table-condensed'>
        <tbody>
          <tr>{this.labelField('role')}{this.labelField('ip-addr')}</tr>
          <tr>{this.labelField('server-group')}{this.labelField('nic-mapping')}</tr>
          <tr>{this.labelField('mac-addr')}{this.labelField('ilo-ip')}</tr>
          <tr>{this.labelField('ilo-user')}
            <th>{translate('replace.server.details.ilo-password')}</th>
            <td>{maskPassword(this.props.data['ilo-password'])}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  // If there are known servers (that have been discovered or manually added) which have not yet
  // been assigned into the model, then give the user the opportunity to select one of those
  renderAvailableServers() {

    if (this.props.availableServers.length > 0) {
      const availableServerIds = List(this.props.availableServers.map(server => server.id));

      let dropDown;
      if (this.state.isUseAvailServersSelected) {

        let emptyOptProps = {
          label: translate('server.please.select'),
          value: 'noopt'
        };

        dropDown = (
          <div className='detail-line'>
            <div className='detail-heading'>{translate('server.available.prompt')}
            </div>
            <div className='input-body'>
              <ListDropdown name='id' value={this.state.selectedServerId || ''}
                optionList={availableServerIds} emptyOption={emptyOptProps}
                selectAction={this.handleSelectAvailableServer}/>
            </div>
          </div>
        );
      }

      return (
        <div className='server-details-container'>
          <input className='replace-options' type='checkbox' value='availservers'
            checked={this.state.isUseAvailServersSelected} onChange={this.handleUseAvailServersCheck}/>
          {translate('replace.server.details.use.availservers')}
          <HelpText tooltipText={translate('server.replace.details.select.message')}/>
          {dropDown}
        </div>
      );
    }
  }

  renderOSUserPass() {
    if (this.state.isInstallOsSelected) {
      return (
        <>
          <div className='detail-line'>
            <div className='detail-heading'>{translate('server.user.prompt')}</div>
            <div className='info-body'>{this.state.osInstallUsername}</div>
          </div>
          <InputLine
            isRequired={this.state.isInstallOsSelected} inputName={'osInstallPassword'}
            inputType={'password'} label={'server.pass.prompt'}
            inputValue={this.state.osInstallPassword || ''}
            inputAction={this.handleOsPasswordChange}/>
        </>);
    }
  }

  renderDropDown(name, list, handler, title) {
    let emptyOptProps = '';
    if(isEmpty(this.state.inputValue.get(name))) {
      emptyOptProps = {
        label: translate('server.please.select'),
        value: 'noopt'
      };
    }
    return (
      <div className='detail-line'>
        <div className='detail-heading'>{translate(title) + '*'}</div>
        <div className='input-body'>
          <ListDropdown name={this.props.name} value={this.state.inputValue.get(name)}
            optionList={list} emptyOption={emptyOptProps} selectAction={handler}/>
        </div>
      </div>
    );
  }

  renderNewComputeInfo(existingIpAddresses) {
    if(isComputeNode(this.props.data)) {
      // disable the id input when user select from available servers
      let isDisabled = !isEmpty(this.state.selectedServerId);
      let previousIds =
        getAllOtherServerIds(
          this.props.model, this.props.availableServers, undefined, this.state.selectedServerId);

      return (
        <div>
          <div className='message-line'>
            {translate('server.replace.compute.details.message')}</div>
          <div className='server-details-container'>
            <InputLine
              isRequired={true} disabled={isDisabled} inputName='id' label='server.id.prompt'
              inputValidate={chainValidators(
                NoWhiteSpaceValidator(translate('input.validator.id.spaces.error')),
                UniqueIdValidator(previousIds)
              )}
              inputValue={this.state.inputValue.get('id')}
              inputAction={this.handleInputChange} />
            <InputLine
              isRequired={true} inputName='ip-addr' label='server.ip.prompt'
              inputValidate={chainValidators(IpV4AddressValidator, createExcludesValidator(existingIpAddresses))}
              inputValue={this.state.inputValue.get('ip-addr')}
              inputAction={this.handleInputChange}/>
            {this.renderDropDown('server-group', this.state.serverGroups, this.handleSelectGroup,
              'server.group.prompt')}
            {this.renderDropDown('nic-mapping', this.state.nicMappings, this.handleSelectNicMapping,
              'server.nicmapping.prompt')}
          </div>
        </div>
      );
    }
  }

  renderMACIPMIInfo(existingMacAddreses, existingIpAddresses) {
    // if it is a compute role, mac address and IPIM info is not requried
    // or it is compute role and want to install OS on the new compute
    let isRequired = !isComputeNode(this.props.data) || this.state.isInstallOsSelected;
    return (
      <div>
        <div className='message-line'>{translate('server.replace.details.message')}</div>
        <div className='server-details-container'>
          <InputLine
            isRequired={isRequired} inputName='mac-addr' label='server.mac.prompt'
            inputValidate={chainValidators(MacAddressValidator, createExcludesValidator(existingMacAddreses))}
            inputValue={this.state.inputValue.get('mac-addr')}
            inputAction={this.handleInputChange} />
          <InputLine
            isRequired={isRequired} inputName='ilo-ip' label='server.ipmi.ip.prompt'
            inputValidate={chainValidators(IpV4AddressValidator, createExcludesValidator(existingIpAddresses))}
            inputValue={this.state.inputValue.get('ilo-ip')}
            inputAction={this.handleInputChange} />
          <InputLine
            isRequired={isRequired} inputName='ilo-user' label='server.ipmi.username.prompt'
            inputValue={this.state.inputValue.get('ilo-user')}
            inputAction={this.handleInputChange}/>
          <InputLine
            isRequired={isRequired} inputType='password' inputName='ilo-password' label='server.ipmi.password.prompt'
            inputValue={this.state.inputValue.get('ilo-password')}
            inputAction={this.handleInputChange}/>
        </div>
      </div>
    );
  }

  renderServerContent() {
    const modelServers = this.props.model.getIn(['inputModel','servers']);

    const existingMacAddreses = modelServers.map(server => server.get('mac-addr'));

    // Avoid re-using any existing IP addresses
    const existingIpAddresses = modelServers.map(server => server.get('ilo-ip'))
      .concat(modelServers.map(server => server.get('ip-addr')));
    return (
      <div>
        <div className='server-details-container'>
          {this.renderDetailsTable()}
        </div>
        {this.renderNewComputeInfo(existingIpAddresses)}
        {this.renderMACIPMIInfo(existingMacAddreses, existingIpAddresses)}
        {this.renderAvailableServers()}
        <div className='server-details-container'>
          <input className='replace-options' type='checkbox' value='installos'
            checked={this.state.isInstallOsSelected} onChange={this.handleInstallOsCheck}/>
          {translate('common.installos')}
          {this.renderOSUserPass()}
        </div>
        <div className='server-details-container'>
          <input className='replace-options more-bottom-margin' type='checkbox' value='wipedisk'
            checked={this.state.isWipeDiskSelected} onChange={this.handleWipeDiskCheck}/>
          {translate('common.wipedisk')}
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
          clickAction={this.handleDone} displayLabel={translate('common.replace')}/>
      </div>
    );
  }

  render() {
    return (
      <div className='replace-server-details'>
        {this.renderServerContent()}
        {this.renderFooter()}
      </div>
    );
  }
}

export default ReplaceServerDetails;
