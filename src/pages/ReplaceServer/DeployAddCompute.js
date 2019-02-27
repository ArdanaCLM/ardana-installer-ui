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

import DeployAddServers from '../AddServers/DeployAddServers.js';
import { translate } from '../../localization/localize.js';
import { getHostFromCloudModel } from '../../utils/ModelUtils.js';


// This is the deployment page for adding a compute server
// for replace a compute server.
class DeployAddCompute extends DeployAddServers {
  getDeployServerTitle = () => {
    return translate('server.addcompute.deploy');
  }

  getDeployFailureMsg = () => {
    return translate('server.addcompute.deploy.failure');
  }

  getAddedComputeHosts = (cloudModel) => {
    let host =
      getHostFromCloudModel(cloudModel, this.props.operationProps.server.id);
    if(host) {
      return [host];
    }

    return [];
  }

  getOldServerHost = (cloudModel, opProps) => {
    // When this component is used in replace compute flow.
    // Have a old server and old server is not reachable
    // need find out the old host name
    let retProps = Object.assign({}, opProps);
    if (!this.props.operationProps.oldServer.isReachable) {
      let oldHost =
        getHostFromCloudModel(cloudModel, this.props.operationProps.oldServer.id);
      // save the host names for old compute node
      retProps.oldServer['hostname'] = oldHost['hostname'];
      retProps.oldServer['ansible_hostname'] = oldHost['ansible_hostname'];
    }
    return retProps;
  }

  excludeOldServerForGenHostFile = (book) => {
    let retBook = Object.assign({}, book);
    if(!this.props.operationProps.oldServer.isReachable) {
      retBook.payload =
        {limit: 'all:!' + this.props.operationProps.oldServer.ansible_hostname};
    }
    return retBook;
  }

  renderFooterButtons (showCancel, showRetry) {
    // Will have a specific cancel confirmation message when user clicks
    // cancel button.
    let cancelMsg = translate(
      'server.replace.compute.failure.add.cancel.confirm', this.props.operationProps.server.id);
    return this.renderNavButtons(showCancel, showRetry, cancelMsg);
  }
}

export default DeployAddCompute;
