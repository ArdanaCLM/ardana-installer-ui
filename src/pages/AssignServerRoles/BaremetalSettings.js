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
import { IPv4CidrValidator } from '../../utils/InputValidators.js';
import { toSubnetNetmask, toCidr } from '../../utils/IPAddress.js';
import { InputLine } from '../../components/InputLine.js';
import { ActionButton } from '../../components/Buttons.js';
import { Map } from 'immutable';

class BaremetalSettings extends Component {

  constructor(props) {
    super(props);
    const baremetal = props.model.getIn(['inputModel', 'baremetal']).toJS();
    this.origCidr = toCidr(baremetal.subnet, baremetal.netmask);

    this.state = {
      cidr: this.origCidr,
      valid: true,
      maskingError: ''
    };
  }

  handleInputChange = (e, valid, props) => {
    let value = e.target.value;
    let key = props.inputName;
    this.setState({[key]: value, valid: valid});
  }

  checkSettingsChanged = () => this.state.valid && this.state.cidr != this.origCidr;

  cancelBaremetalSettings = () => {
    this.props.cancelAction();
  }

  saveBaremetalSettings = () => {
    const [subnet, netmask] = toSubnetNetmask(this.state.cidr);
    const newSettings = Map({
      subnet: subnet,
      netmask: netmask,
    });
    const model = this.props.model.updateIn(['inputModel', 'baremetal'], settings => newSettings);
    this.props.updateGlobalState('model', model);
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
      <ConfirmModal
        title={translate('add.server.set.network')}
        onHide={this.props.cancelAction}
        footer={footer}
        size="lg"
      >
        <div className='description-line'>{translate('add.server.set.network.description')}</div>
        <div className='server-details-container'>
          <InputLine isRequired={true} label={'add.server.set.network.cidr'}
            inputName={'cidr'} inputType={'text'}
            inputValidate={IPv4CidrValidator}
            inputAction={this.handleInputChange} inputValue={this.state.cidr}/>
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
