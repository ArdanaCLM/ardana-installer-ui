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
import {translate} from "../../localization/localize";

// This is the deployment page for adding a compute server
// for replace a compute server
class DeployAddCompute extends DeployAddServers {

  constructor(props) {
    super(props);
  }

  getDeployServerTitle = () => {
    return translate('server.addcompute.deploy');
  }

  getDeployFailureMsg = () => {
    return translate('server.addcompute.deploy.failure');
  }

  getAddedComputeHosts = (cloudModel) => {
    // get new hostname for new compute host
    let hosts = cloudModel['internal']['servers'];
    let host = hosts.find(host => {
      return host.id === this.props.operationProps.server.id;
    });

    let newServers = [];
    if(host) {
      // should just have one new compute server
      newServers = [{
        // generated hostname by ardana, this will be used
        // to set --limit during deployment
        // for example, ardana-cp1-comp0004
        hostname: host['ardana_ansible_host'],
        id: host['id'],
        ip: host['addr'],
        // generated display hostname , for example, ardana-cp1-comp0004-mgmt
        // this will be used for complete message
        display_hostname: host['hostname']
      }];
    }

    return newServers;
  }

}

export default DeployAddCompute;
