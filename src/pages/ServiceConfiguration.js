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
import ServiceTemplatesTab from './ValidateConfigFiles/ServiceTemplatesTab.js';
import { ActionButton } from '../components/Buttons.js';

class ServiceConfiguration extends Component {

  constructor() {
    super();
    this.state = {
      showActionButtons: true
    };
  }

  handleUpdateConfig() {
  }

  showActionButtons = (show) => {
    this.setState({showActionButtons: show});
  }

  renderActionButtons = () => {
    return (
      <div className='btn-row right-btn-group'>
        <ActionButton type='default'
          displayLabel={translate('cancel')}
          clickAction={() => this.serviceTemplatesTab.revertChanges()}/>
        <ActionButton
          displayLabel={translate('update')}
          clickAction={() => this.handleUpdateConfig()}/>
      </div>
    );
  }

  render() {
    return (
      <div>
        <div className='menu-tab-content'>
          <div className='column-layout'>
            <div className='header'>{translate('services.configuration.update')}</div>
            <ServiceTemplatesTab revertable disableTab={() => {}}
              showNavButtons={this.showActionButtons}
              ref={instance => {this.serviceTemplatesTab = instance;}}/>
            {this.state.showActionButtons ? this.renderActionButtons() : ''}
          </div>
        </div>
      </div>
    );
  }
}

export default ServiceConfiguration;
