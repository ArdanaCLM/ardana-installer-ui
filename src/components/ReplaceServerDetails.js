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
import { translate } from '../localization/localize.js';
import { ActionButton } from '../components/Buttons.js';
import { InputLine } from '../components/InputLine.js';
import { ListDropdown } from '../components/ListDropdown.js';
import { IpV4AddressValidator, MacAddressValidator, createExcludesValidator, chainValidators }
  from '../utils/InputValidators.js';
import { genUID, maskPassword } from '../utils/ModelUtils.js';
import HelpText from '../components/HelpText.js';
import { Map, List } from 'immutable';
import {fetchJson} from '../utils/RestUtils.js';

const Fragment = React.Fragment;

class ReplaceServerDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isInstallOsSelected: false,
      isWipeDiskSelected: false,
      isUseAvailServersSelected: false,
      inputValue: Map({
        'ilo-user': '',
        'ilo-password': '',
        'ilo-ip': '',
        'mac-addr': '',
      }),

      selectedServerId: undefined,
      osInstallUsername: undefined,
      osInstallPassword: undefined,

      isValid: Map({
        'ilo-user': undefined,
        'ilo-password': undefined,
        'ilo-ip': undefined,
        'mac-addr': undefined,
      }),
      isOsInstallPasswordValid: undefined,
    };
  }

  // This should be componentDidMOunt, since reactjs has deprecated ComponentWillMount
  componentWillMount() {
    fetchJson('/api/v1/clm/user')
      .then(responseData => {
        this.setState({
          osInstallUsername: responseData['username']
        });
      });
  }

  isFormInputValid = () => {

    // The form is valid if all of the fields are valid.  The OS install password only has
    // to be valid when the OS Install checkbox is selected
    return this.state.isValid.every((value) => value === true) &&
      (this.state.isOsInstallPasswordValid || !this.state.isInstallOsSelected);
  }

  handleDone = () => {

    let data = {};

    data['mac-addr'] = this.state.inputValue.get('mac-addr');
    data['ilo-ip'] = this.state.inputValue.get('ilo-ip');
    data['ilo-user'] = this.state.inputValue.get('ilo-user');
    data['ilo-password'] = this.state.inputValue.get('ilo-password');

    let theProps = {
      wipeDisk : this.state.isWipeDiskSelected,
      installOS : this.state.isInstallOsSelected
    };
    if(this.state.isInstallOsSelected) {
      theProps.osInstallUsername = this.state.osInstallUsername;
      theProps.osInstallPassword = this.state.osInstallPassword; //TODO where to store
    }

    //TODO the whole use available servers need further work
    // picked from available server, this is used to
    // update the available servers or manual servers list
    if(this.state.selectedServerId) {
      theProps.selectedServerId = this.state.selectedServerId;
      // TODO if it is an existing server discovered or added, get its ID from availableServers
      // this.props.availableServers.find(server => server.id === this.state.selectedServerId);
      // was: data['uid'] = this.state.inputValue.get('uid');
    }
    else {
      // user input new mac-addr and ilo info
      // generate a new uid
      data.uid = genUID();
    }

    this.props.doneAction(data, theProps);
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
        newState.inputValue = Map({
          'ilo-user': '',
          'ilo-password': '',
          'ilo-ip': '',
          'mac-addr': '',
        });
        // Reset (to undefined) the validity of the fields being cleared
        newState.isValid = prev.isValid.set('ilo-user').set('ilo-password').set('ilo-ip').set('mac-addr');
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
        //   of each field depending on whether it is populated
        for (let key of ['ilo-ip', 'ilo-user', 'ilo-password', 'mac-addr']) {
          const valueToCopy = server[key] || '';
          inputValue = inputValue.set(key, valueToCopy);
          isValid = isValid.set(key, (valueToCopy.length > 0));
        }
        return {
          selectedServerId: serverId,
          inputValue: inputValue,
          isValid: isValid,
        };
      });
    }
  }

  // Helper function to create a pair of TH and TD entries with the given name
  labelField = (name) => {
    return (
      <Fragment>
        <th>{translate('replace.server.details.'+name)}</th>
        <td>{this.props.data[name]}</td>
      </Fragment>);
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
        <Fragment>
          <div className='detail-line'>
            <div className='detail-heading'>{translate('server.user.prompt')}</div>
            <div className='info-body'>{this.state.osInstallUsername}</div>
          </div>
          <InputLine
            isRequired={this.state.isInstallOsSelected} inputName={'osInstallPassword'}
            inputType={'password'} label={'server.pass.prompt'}
            inputValue={this.state.osInstallPassword || ''}
            inputAction={this.handleOsPasswordChange}/>
        </Fragment>);
    }
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
        <div className='message-line'>{translate('server.replace.details.message')}</div>
        <div className='server-details-container'>
          <InputLine
            isRequired={true} inputName='mac-addr' label='server.mac.prompt'
            inputValidate={chainValidators(MacAddressValidator, createExcludesValidator(existingMacAddreses))}
            inputValue={this.state.inputValue.get('mac-addr')}
            inputAction={this.handleInputChange} />
          <InputLine
            isRequired={true} inputName='ilo-ip' label='server.ipmi.ip.prompt'
            inputValidate={chainValidators(IpV4AddressValidator, createExcludesValidator(existingIpAddresses))}
            inputValue={this.state.inputValue.get('ilo-ip')}
            inputAction={this.handleInputChange} />
          <InputLine
            isRequired={true} inputName='ilo-user' label='server.ipmi.username.prompt'
            inputValue={this.state.inputValue.get('ilo-user')}
            inputAction={this.handleInputChange}/>
          <InputLine
            isRequired={true} inputType='password' inputName='ilo-password' label='server.ipmi.password.prompt'
            inputValue={this.state.inputValue.get('ilo-password')}
            inputAction={this.handleInputChange}/>
        </div>
        {this.renderAvailableServers()}
        <div className='server-details-container'>
          <input className='replace-options' type='checkbox' value='installos'
            checked={this.state.isInstallOsSelected} onChange={this.handleInstallOsCheck}/>
          {translate('common.installos')}
          {this.renderOSUserPass()}
        </div>
        <div className='server-details-container'>
          <input className='replace-options' type='checkbox' value='wipedisk'
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
