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
import { ConfirmModal, YesNoModal } from '../components/Modals.js';
import { postJson, fetchJson } from '../utils/RestUtils.js';
import { STATUS } from '../utils/constants.js';
import { PlaybookProgress } from '../components/PlaybookProcess.js';

class ServiceStatus extends Component {

  constructor() {
    super();
    this.state = {
      status: STATUS.UNKNOWN
    };
  }

//  componentWillMount() {
//    fetchJson('/api/v1/clm/model')
//      .then(responseData => {
//        this.setState({'model': responseData.inputModel});
//      });
//  }


  updatePageStatus = (status) => {
    this.setState({status: status});
  }

  render() {
    const STEP = [
      {
        label: 'my status',
        playbooks: ['keystone-status.yml']
      }
    ];
//    return (
//      <ConfirmModal show={this.props.show} title={translate('edit.cloud.settings')}
//        className={'modal'} hideFooter='true'>
//        <PlaybookProgress
//          updatePageStatus={this.updatePageStatus} steps={STEP} playbooks={['keystone-status']}/>
//      </ConfirmModal>
//    );
    return (
        <PlaybookProgress
          updatePageStatus={this.updatePageStatus} steps={STEP} playbooks={['keystone-status']}/>
    );
  }
}

export default ServiceStatus;