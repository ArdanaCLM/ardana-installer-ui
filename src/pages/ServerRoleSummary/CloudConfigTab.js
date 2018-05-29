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
import { InlineAddRemoveInput } from '../../components/InlineAddRemoveFields.js';
import { ActionButton } from '../../components/Buttons.js';
import { ValidatingInput } from '../../components/ValidatingInput.js';

class CloudConfigTab extends Component {

  constructor(props) {
    super(props);
    const ntpList = props.model.getIn(['inputModel','cloud', 'ntp-servers']);
    this.origNTP = (ntpList === null) ? [] : ntpList.toJS();
    const dnsList = props.model.getIn(['inputModel','cloud', 'dns-settings']);
    this.origDNS = (dnsList === null) ? [] : dnsList.toJS().nameservers ? dnsList.toJS().nameservers : [];
    this.origNamePrefix = props.model.getIn(['inputModel','cloud', 'hostname-data', 'host-prefix']);
    this.origMemberPrefix = props.model.getIn(['inputModel','cloud', 'hostname-data', 'member-prefix']);
    this.state = {
      namePrefix: this.origNamePrefix.slice(),
      memberPrefix: this.origMemberPrefix.slice(),
      dns: JSON.parse(JSON.stringify(this.origDNS)),
      ntp: JSON.parse(JSON.stringify(this.origNTP)),
    };
  }

  handleInputChange = (e, valid, props) => {
    let value = e.target.value;
    if (valid) {
      if (props.inputName === 'namePrefix') {
        this.setState({namePrefix: value});
      } else {
        this.setState({memberPrefix: value});
      }
    }
  }

  getDNS = (list) => {
    this.setState({dns: list});
  }

  getNTP = (list) => {
    this.setState({ntp: list});
  }

  saveChanges = () => {
    let model = this.props.model;
    if (this.state.namePrefix !== this.origNamePrefix) {
      model = model.updateIn(['inputModel','cloud', 'hostname-data', 'host-prefix'],
        prefix => this.state.namePrefix);
      this.origNamePrefix = this.state.namePrefix;
    }

    if (this.state.memberPrefix !== this.origMemberPrefix) {
      model = model.updateIn(['inputModel','cloud', 'hostname-data', 'member-prefix'],
        prefix => this.state.memberPrefix);
      this.origMemberPrefix = this.state.memberPrefix;
    }

    // DNS settings can have other properties underneath such as domain, sortlist, etc. as well
    // as no property at all, so we need to consider these cases when updating the nameservers
    // property to make sure not to override the existing properties
    if (JSON.stringify(this.state.dns) !== JSON.stringify(this.origDNS)) {
      const modelDNS = model.getIn(['inputModel','cloud', 'dns-settings']);
      // add nameservers when no property exists before
      if (modelDNS === null) {
        model = model.updateIn(['inputModel','cloud', 'dns-settings'],
          dns => fromJS({nameservers: this.state.dns}));
      } else {
        let modelDNSObj = modelDNS.toJS();
        if (this.state.dns.length === 0) {
          // remove only nameservers key when there are other properties in dns-settings
          if (Object.keys(modelDNSObj).length > 1) {
            delete modelDNSObj.nameservers;
            model = model.updateIn(['inputModel','cloud', 'dns-settings'],
              dns => fromJS(modelDNSObj));
          // set dns-settings to null to remove nameservers when no other properties exist
          } else {
            model = model.updateIn(['inputModel','cloud', 'dns-settings'], dns => null);
          }
        } else {
          // update or add nameservers to existing dns-setttings
          modelDNSObj.nameservers = this.state.dns;
          model = model.updateIn(['inputModel','cloud', 'dns-settings'],
            dns => fromJS(modelDNSObj));
        }
      }
      this.origDNS = this.state.dns;
    }

    if (JSON.stringify(this.state.ntp) !== JSON.stringify(this.origNTP)) {
      if (this.state.ntp.length === 0) {
        model = model.updateIn(['inputModel','cloud', 'ntp-servers'], ntp => null);
      } else {
        model = model.updateIn(['inputModel','cloud', 'ntp-servers'], ntp => fromJS(this.state.ntp));
      }
      this.origNTP = this.state.ntp;
    }
    this.props.updateGlobalState('model', model);
  }

  isSaveAllowed = () => {
    const isChanged = this.state.namePrefix !== this.origNamePrefix ||
      this.state.memberPrefix !== this.origMemberPrefix ||
      JSON.stringify(this.state.dns) !== JSON.stringify(this.origDNS) ||
      JSON.stringify(this.state.ntp) !== JSON.stringify(this.origNTP);
    this.props.setDataChanged(this.props.tabIndex, isChanged);
    return isChanged;
  }

  render() {
    return (
      <div className='cloud-config'>
        <div className='details-section'>
          <div className='config-line'>
            <div className='config-title'>{translate('config.host.name.prefix') + ':'}</div>
            <div className='config-input'>
              <ValidatingInput inputName={'namePrefix'} inputType={'text'}
                inputAction={this.handleInputChange} inputValue={this.state.namePrefix}/>
            </div>
          </div>
          <div className='config-line'>
            <div className='config-title'>{translate('config.host.member.prefix') + ':'}</div>
            <div className='config-input'>
              <ValidatingInput inputName={'memberPrefix'} inputType={'text'}
                inputAction={this.handleInputChange} inputValue={this.state.memberPrefix}/>
            </div>
          </div>
          <div className='config-line'>
            <div className='config-title'>{translate('config.dns') + ':'}</div>
            <InlineAddRemoveInput name='dns' placeholder={translate('config.dns.placeholder')}
              values={this.state.dns} sendSelectedList={this.getDNS} editable='true'
              isRequired='false'/>
          </div>
          <div className='config-line'>
            <div className='config-title'>{translate('config.ntp') + ':'}</div>
            <InlineAddRemoveInput name='ntp' placeholder={translate('config.ntp.placeholder')}
              values={this.state.ntp} sendSelectedList={this.getNTP} editable='true'
              isRequired='false'/>
          </div>
          <div className='btn-row details-btn'>
            <div className='btn-container'>
              <ActionButton key='cancel' type='default' clickAction={this.props.closeAction}
                displayLabel={translate('cancel')}/>
              <ActionButton key='save' clickAction={this.saveChanges}
                displayLabel={translate('save')} isDisabled={!this.isSaveAllowed()}/>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CloudConfigTab;
