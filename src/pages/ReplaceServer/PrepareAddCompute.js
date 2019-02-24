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

import { translate } from '../../localization/localize.js';
import  PrepareAddServers from '../AddServers/PrepareAddServers.js';

// This is the prepare page for adding a compute server
// process during replace compute server.
// It will first commit the model changes and start
// the playbook to do pre-deployment.
class PrepareAddCompute extends PrepareAddServers {
  getPrepareServerFailureMsg = () => {
    return translate('server.addcompute.prepare.failure');
  }

  getPrepareServerTitle = () => {
    return translate('server.addcompute.prepare');
  }

  renderFooterButtons (showCancel, showRetry) {
    // Will have a specific cancel confirmation message when user clicks
    // cancel button.
    let cancelMsg = translate(
      'server.replace.compute.failure.cancel.confirm', this.props.operationProps.server.id);
    return this.renderNavButtons(showCancel, showRetry, cancelMsg);
  }
}

export default PrepareAddCompute;
