// (c) Copyright 2019 SUSE LLC
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

import { ValidateConfigFiles } from './ValidateConfigFiles';

class ModelConfiguration extends Component {
  noop() {
    // Do nothing because we are not using any of these values
    return () => undefined;
  }

  render() {
    return <div className='menu-tab-content'>
      <ValidateConfigFiles disableTab={this.noop()} showNavButtons={this.noop()} enableBackButton={this.noop()}
        enableNextButton={this.noop()} setRequiresPassword={this.noop()} loadModel={this.noop()}
        requiresPassword={false} sshPassphrase={undefined} allowsDeploy={false} />
    </div>;
  }
}

export default ModelConfiguration;
