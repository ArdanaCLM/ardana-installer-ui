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
import { IpV4AddressValidator, MacAddressValidator } from '../utils/InputValidators.js';
import { INPUT_STATUS } from '../utils/constants.js';
import {
  genUID, getAvailableServerIds, maskPassword, getModelMacAddresses,
  getModelIPMIAddresses, getMacIPMIAddrObjs }
  from '../utils/ModelUtils.js';
import HelpText from '../components/HelpText.js';
import { Map, fromJS } from 'immutable';
import {fetchJson} from '../utils/RestUtils.js';

const Fragment = React.Fragment;

class ReplaceServerDetails extends Component {
  constructor(props) {
    super(props);

    this.replaceInputsStatus = {
      'ilo-user': INPUT_STATUS.UNKNOWN,
      'ilo-password': INPUT_STATUS.UNKNOWN,
      'ilo-ip': INPUT_STATUS.UNKNOWN,
      'mac-addr': INPUT_STATUS.UNKNOWN
    };

    this.state = {
      isInstallOsChecked: false,
      isWipeDiskChecked: false,
      isUseAvailServersChecked: false,
      replaceData: Map(),
      selectedServerId: undefined,
      osInstallUsername: undefined,
      osInstallPassword: undefined
    };
  }

  componentWillMount() {
    if(this.props.data) {
      this.availableServerIds =
        getAvailableServerIds(this.props.model, this.props.autoServers, this.props.manualServers);
      // the original data
      this.data = JSON.parse(JSON.stringify(this.props.data));

      this.existMacAddressesModel = getModelMacAddresses(this.props.model);
      this.existIPMIAddressesModel = getModelIPMIAddresses(this.props.model);
      this.existMacIPMIAddrObjAvailServers =
        getMacIPMIAddrObjs(this.props.autoServers, this.props.manualServers);
    }

    fetchJson('/api/v1/clm/user')
      .then(responseData => {
        this.setState({
          osInstallUsername: responseData['username']
        });
      });
  }

  isFormInputValid = () => {
    let isAllValid = true;
    let values = Object.values(this.replaceInputsStatus);
    isAllValid =
      (values.every((val) => val === INPUT_STATUS.VALID));
    //also check osInstall checked and need password
    if(this.state.isInstallOsChecked) {
      isAllValid =
        isAllValid && this.state.osInstallPassword && this.state.osInstallPassword !== '';
    }

    return isAllValid;
  }

  updateFormValidity = (props, isValid) => {
    this.replaceInputsStatus[props.inputName] = isValid ? INPUT_STATUS.VALID : INPUT_STATUS.INVALID;
  }

  handleDone = () => {
    this.data['mac-addr'] = this.state.replaceData.get('mac-addr');
    this.data['ilo-ip'] = this.state.replaceData.get('ilo-ip');
    this.data['ilo-user'] = this.state.replaceData.get('ilo-user');
    this.data['ilo-password'] = this.state.replaceData.get('ilo-password');

    let theProps = {
      wipeDisk : this.state.isWipeDiskChecked,
      installOS : this.state.isInstallOsChecked
    };
    if(this.state.isInstallOsChecked) {
      theProps.osInstallUsername = this.state.osInstallUsername;
      theProps.osInstallPassword = this.state.osInstallPassword; //TODO where to store
    }

    //TODO the whole use available servers need further work
    // picked from available server, this is used to
    // update the available servers or manual servers list
    if(this.state.selectedServerId) {
      theProps.selectedServerId = this.state.selectedServerId;
      // if it is an existing server discovered or added, use its uid
      this.data['uid'] = this.state.replaceData.get('uid');
    }
    else {
      // user input new mac-addr and ilo info
      // generate a new uid
      this.data.uid = genUID();
    }

    this.props.doneAction(this.data, theProps);
  }

  handleCancel = () => {
    this.props.cancelAction();
  }

  handleInputChange = (e, isValid, props) => {
    this.updateFormValidity(props, isValid);
    let value = e.target.value;
    let newData = this.state.replaceData.set(props.inputName, value);
    this.setState({replaceData: newData});
  }

  //this is called when select and deselect available server
  updateAutoFillFormValidity = (newJSData) => {
    for (let key in newJSData) {
      if(newJSData[key]) {
        this.replaceInputsStatus[key] = INPUT_STATUS.VALID;
      }
      else {
        this.replaceInputsStatus[key] = INPUT_STATUS.INVALID;
      }
    }
  }

  handleOsPasswordChange = (e) => {
    const password = e.target.value;
    this.setState({osInstallPassword: password});
  }

  handleInstallOsCheck = () => {
    this.setState({isInstallOsChecked: !this.state.isInstallOsChecked});
  }

  handleWipeDiskCheck = () => {
    this.setState({isWipeDiskChecked: !this.state.isWipeDiskChecked});
  }

  handleUseAvailServersCheck = () => {
    let checked = !this.state.isUseAvailServersChecked;
    this.setState({isUseAvailServersChecked: checked});
    // clean the inputs when check or uncheck
    let cleanJSData = {
      'ilo-ip' : '',
      'ilo-user': '',
      'ilo-password': '',
      'mac-addr': ''
    };
    this.updateAutoFillFormValidity(cleanJSData);
    this.setState({replaceData: fromJS(cleanJSData)});
    if (!checked) {
      this.setState({selectedServerId: ''});
    }
  }

  handleSelectAvailableServer = (serverId) => {
    //TODO need to find a way to show the details of the available server
    //selected
    this.setState({selectedServerId: serverId});
    let allAvailableServers = [];
    if(this.props.autoServers && this.props.autoServers.length > 0) {
      allAvailableServers = this.props.autoServers;
    }
    if(this.props.manualServers && this.props.manualServers.length > 0) {
      allAvailableServers = allAvailableServers.concat(this.props.manualServers);
    }

    let theServer = allAvailableServers.find(server => server.id === serverId);
    let newJSData = {};
    if(theServer) {
      newJSData['ilo-ip'] = theServer['ilo-ip'] || '';
      newJSData['ilo-user'] = theServer['ilo-user'] || '';
      newJSData['ilo-password'] = theServer['ilo-password'] || '';
      newJSData['mac-addr'] = theServer['mac-addr'] || '';
      // record server uid from ov or id from sm, so it can be filtered out for available
      // servers later
      newJSData['uid'] = theServer['uid'] || (theServer['id'] || '');
      this.updateAutoFillFormValidity(newJSData);
      this.setState({replaceData: fromJS(newJSData)});
    }
  }

  renderInput(name, type, isRequired, title, validate) {
    let extraProps = {};
    // if user doesn't select the server from available server and enter the same
    // mac-addr or ilo-ip as the one in the available servers
    // show error
    if(!this.state.isUseAvailServersChecked || this.state.selectedServerId === '') {
      if (name === 'mac-addr') {
        extraProps['exist_mac_addresses'] = this.existMacAddressesModel;
        extraProps['exist_availservers_mac_addr_objs'] = this.existMacIPMIAddrObjAvailServers;
      }
      if (name === 'ilo-ip') {
        extraProps['exist_ip_addresses'] = this.existIPMIAddressesModel;
        extraProps['exist_availservers_ip_addr_objs'] = this.existMacIPMIAddrObjAvailServers;
      }
    }
    return (
      <InputLine
        isRequired={isRequired} inputName={name} inputType={type} label={title}
        inputValidate={validate}
        inputValue={this.state.replaceData.get(name) || ''}
        inputAction={this.handleInputChange} updateFormValidity={this.updateFormValidity}
        {...extraProps}/>
    );
  }

  renderAvailableServersDropDown() {
    let emptyOptProps = {
      label: translate('server.please.select'),
      value: 'noopt'
    };

    return (
      <div className='detail-line'>
        <div className='detail-heading'>{translate('server.available.prompt')}
        </div>
        <div className='input-body'>
          <ListDropdown name='id' value={this.state.selectedServerId || ''}
            optionList={this.availableServerIds} emptyOption={emptyOptProps}
            selectAction={this.handleSelectAvailableServer}/>
        </div>
      </div>
    );
  }

  renderDetailsTable() {
    let rows = [];
    let sections = [
      {'role': this.data.role, 'ip-addr': this.data['ip-addr']},
      {'server-group': this.data['server-group'], 'nic-mapping': this.data['nic-mapping']},
      {'mac-addr': this.data['mac-addr'], 'ilo-ip': this.data['ilo-ip']},
      {'ilo-user': this.data['ilo-user'], 'ilo-password': this.data['ilo-password']},
    ];
    sections.forEach((section, idx) => {
      let keys = Object.keys(section);
      rows.push(
        <tr key={idx}>
          <th>{translate('replace.server.details.' + keys[0])}</th>
          <td>{keys[0].indexOf('password') !== -1  ? maskPassword(section[keys[0]]) : section[keys[0]]}</td>
          <th>{translate('replace.server.details.' + keys[1])}</th>
          <td>{keys[1].indexOf('password') !== -1 ? maskPassword(section[keys[1]]) : section[keys[1]]}</td>
        </tr>);
    });
    return (
      <table className='table table-condensed'>
        <tbody>{rows}</tbody>
      </table>
    );
  }

  renderAvailableServers() {
    return (
      <div className='server-details-container'>
        <input className='replace-options' type='checkbox' value='availservers'
          checked={this.state.isUseAvailServersChecked} onChange={this.handleUseAvailServersCheck}/>
        {translate('replace.server.details.use.availservers')}
        <HelpText tooltipText={translate('server.replace.details.select.message')}/>
        {this.state.isUseAvailServersChecked && this.renderAvailableServersDropDown()}
      </div>
    );
  }

  renderOSUserPass() {
    if (this.state.isInstallOsChecked) {
      return (
        <Fragment>
          <div className='detail-line'>
            <div className='detail-heading'>{translate('server.user.prompt')}</div>
            <div className='info-body'>{this.state.osInstallUsername}</div>
          </div>
          <InputLine
            isRequired={this.state.isInstallOsChecked} inputName={'osInstallPassword'}
            inputType={'password'} label={'server.pass.prompt'}
            inputValue={this.state.osInstallPassword || ''}
            inputAction={this.handleOsPasswordChange}/>
        </Fragment>);
    }
  }


  renderServerContent() {
    return (
      <div>
        <div className='server-details-container'>
          {this.renderDetailsTable()}
        </div>
        <div className='message-line'>{translate('server.replace.details.message')}</div>
        <div className='server-details-container'>
          {this.renderInput('mac-addr', 'text', true, 'server.mac.prompt', MacAddressValidator)}
          {this.renderInput('ilo-ip', 'text', true, 'server.ipmi.ip.prompt', IpV4AddressValidator)}
          {this.renderInput('ilo-user', 'text', true, 'server.ipmi.username.prompt')}
          {this.renderInput('ilo-password', 'password', true, 'server.ipmi.password.prompt')}
        </div>
        {this.availableServerIds && this.availableServerIds.length > 0 && this.renderAvailableServers()}
        <div className='server-details-container'>
          <input className='replace-options' type='checkbox' value='installos'
            checked={this.state.isInstallOsChecked} onChange={this.handleInstallOsCheck}/>
          {translate('common.installos')}
          {this.renderOSUserPass()}
        </div>
        <div className='server-details-container'>
          <input className='replace-options' type='checkbox' value='wipedisk'
            checked={this.state.isWipeDiskChecked} onChange={this.handleWipeDiskCheck}/>
          {translate('common.wipedisk')}
        </div>
      </div>
    );
  }

  renderFooter() {
    return (
      <div className='btn-row input-button-container'>
        <ActionButton type='default'
          clickAction={this.handleCancel} displayLabel={translate('cancel')}/>
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
