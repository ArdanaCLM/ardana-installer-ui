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
import { genUID, maskPassword } from '../utils/ModelUtils.js';
import HelpText from '../components/HelpText.js';
import { Map, List, fromJS } from 'immutable';
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

    let data = {};

    data['mac-addr'] = this.state.replaceData.get('mac-addr');
    data['ilo-ip'] = this.state.replaceData.get('ilo-ip');
    data['ilo-user'] = this.state.replaceData.get('ilo-user');
    data['ilo-password'] = this.state.replaceData.get('ilo-password');

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
      data['uid'] = this.state.replaceData.get('uid');
    }
    else {
      // user input new mac-addr and ilo info
      // generate a new uid
      data.uid = genUID();
    }

    this.props.doneAction(data, theProps);
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
    let theServer = this.props.knownServers.find(server => server.id === serverId);
    if(theServer) {
      let newJSData = {};
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

    const existMacIPMIAddrObjAvailServers = this.props.knownServers.map(server => ({
      'serverId': server.id,
      'mac-addr': server['mac-addr'],
      'ilo-ip': server['ilo-ip']
    }));

    const existMacAddressesModel = this.props.model.getIn(['inputModel','servers'])
      .map(server => server.get('mac-addr'));

    const existIPMIAddressesModel = this.props.model.getIn(['inputModel','servers'])
      .map(server => server.get('ilo-ip'));

    // if user doesn't select the server from available server and enter the same
    // mac-addr or ilo-ip as the one in the available servers
    // show error
    if(!this.state.isUseAvailServersChecked || this.state.selectedServerId === '') {
      if (name === 'mac-addr') {
        extraProps['exist_mac_addresses'] = existMacAddressesModel;
        extraProps['exist_availservers_mac_addr_objs'] = existMacIPMIAddrObjAvailServers;
      }
      if (name === 'ilo-ip') {
        extraProps['exist_ip_addresses'] = existIPMIAddressesModel;
        extraProps['exist_availservers_ip_addr_objs'] = existMacIPMIAddrObjAvailServers;
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

  // Helper function to create a pair of th and td entries with the given name
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
          <tr>{this.labelField('mac-addr')}{this.labelField('ip-addr')}</tr>
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
    const knownServerIds = List(this.props.knownServers.map(server => server.id));

    const modelIds = this.props.model.getIn(['inputModel','servers'])
      .map(server => server.get('uid') || server.get('id'));

    const availableServerIds = knownServerIds.filterNot(id => modelIds.includes(id));

    if (! availableServerIds.isEmpty()) {

      let dropDown;
      if (this.state.isUseAvailServersChecked) {

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
            checked={this.state.isUseAvailServersChecked} onChange={this.handleUseAvailServersCheck}/>
          {translate('replace.server.details.use.availservers')}
          <HelpText tooltipText={translate('server.replace.details.select.message')}/>
          {dropDown}
        </div>
      );
    }
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
        {this.renderAvailableServers()}
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
