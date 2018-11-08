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
import { translate } from '../../localization/localize.js';
import { ConfirmModal } from '../../components/Modals.js';
import { IpV4AddressValidator, IpInNetmaskValidator, NetmaskValidator } from '../../utils/InputValidators.js';
import { InputLine } from '../../components/InputLine.js';
import { ActionButton } from '../../components/Buttons.js';
import { fromJS } from 'immutable';

class BaremetalSettings extends Component {

  constructor(props) {
    super(props);
    const baremetal = props.model.getIn(['inputModel', 'baremetal']).toJS();
    this.state = {
      subnet: baremetal.subnet,
      netmask: baremetal.netmask,
      valid: true,
      maskingError: ''
    };
    this.origBaremetal = JSON.parse(JSON.stringify(baremetal));
  }

  handleInputChange = (e, valid, props) => {
    let value = e.target.value;
    let checkMaskingMsg = '';
    if (valid) {
      let key = props.inputName;
      if (key === 'netmask') {
        this.setState({netmask: value});
        checkMaskingMsg = IpInNetmaskValidator(this.state.subnet, value) ? '' :
          translate('input.validator.netmask.ipinvalid.error');
      } else {
        this.setState({subnet: value});
        checkMaskingMsg = IpInNetmaskValidator(value, this.state.netmask) ? '' :
          translate('input.validator.netmask.ipinvalid.error');
      }
    }
    this.setState({maskingError: checkMaskingMsg, valid: valid && checkMaskingMsg === ''});
  }

  checkSettingsChanged = () => {
    return this.state.valid && ((this.origBaremetal.netmask !== this.state.netmask) ||
      (this.origBaremetal.subnet !== this.state.subnet));
  }

  cancelBaremetalSettings = () => {
    this.setState({netmask: this.origBaremetal.netmask, subnet: this.origBaremetal.subnet});
    this.props.cancelAction();
  }

  saveBaremetalSettings = () => {
    let newSettings = {
      subnet: this.state.subnet,
      netmask: this.state.netmask
    };
    let model = this.props.model;
    model = model.updateIn(['inputModel', 'baremetal'], settings => fromJS(newSettings));
    this.props.updateGlobalState('model', model);
    this.origBaremetal.subnet = this.state.subnet;
    this.origBaremetal.netmask = this.state.netmask;
    this.props.cancelAction();
  }

  render() {
    let footer = (
      <div className='btn-row'>
        <ActionButton type={'default'} clickAction={this.cancelBaremetalSettings}
          displayLabel={translate('cancel')}/>
        <ActionButton clickAction={this.saveBaremetalSettings} displayLabel={translate('save')}
          isDisabled={!this.checkSettingsChanged()}/>
      </div>
    );
    return (
      <ConfirmModal show={this.props.show} className={'manual-discover-modal'}
        title={translate('add.server.set.network')} onHide={this.props.cancelAction} footer={footer}>
        <div className='description-line'>{translate('add.server.set.network.description')}</div>
        <div className='server-details-container'>
          <InputLine isRequired={true} label={'add.server.set.network.subnet'}
            inputName={'subnet'} inputType={'text'} inputValidate={IpV4AddressValidator}
            inputAction={this.handleInputChange} inputValue={this.state.subnet}/>
          <InputLine isRequired={true} label={'add.server.set.network.netmask'}
            inputName={'netmask'} inputType={'text'} inputValidate={NetmaskValidator}
            inputAction={this.handleInputChange} inputValue={this.state.netmask}/>
          <div className='detail-line'>
            <div className='detail-heading'></div>
            <div className='input-body'>
              <div className='validating-input'>
                <div className='error-message'>{this.state.maskingError}</div>
              </div>
            </div>
          </div>
        </div>
      </ConfirmModal>
    );
  }
}

export default BaremetalSettings;
