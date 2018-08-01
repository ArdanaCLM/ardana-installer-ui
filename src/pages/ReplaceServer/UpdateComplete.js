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

import React from 'react';
import { translate } from '../../localization/localize.js';
import BaseWizardPage from '../BaseWizardPage.js';

// TODO this is a placeholder
class UpdateComplete extends BaseWizardPage {

  constructor() {
    super();
  }

  render() {
    return (
      <div className='wizard-page'>
        <div className='content-header'/>
        <div className='wizard-content'>
          <div>{this.renderHeading(translate('server.replace.complete.heading'))}</div>
        </div>
        {this.renderNavButtons(true)}
      </div>
    );
  }
}

export default UpdateComplete;
