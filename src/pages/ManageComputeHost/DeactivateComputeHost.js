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

import DisableComputeServiceNetwork from '../ReplaceServer/DisableComputeServiceNetwork';
import { translate } from '../../localization/localize';
import { NOVA_STOP_PLAYBOOK } from '../../utils/constants';
import { getHostFromCloudModel } from '../../utils/ModelUtils';
import * as constants from '../../utils/constants';

const MIGRATE_INSTANCES = 'migrate_instances',
  DISABLE_COMPUTE_SERVICE = 'nova_deactivate';

class DeactivateComputeHost extends DisableComputeServiceNetwork {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      heading: translate('server.deactivate.text', props.operationProps.oldServer.id)
    };
  }

  canMigrate() {
    return this.props.operationProps.oldServer.isReachable && this.props.operationProps.server;
  }

  getSteps() {
    let steps = [];
    if (this.canMigrate()) {
      steps.push({
        label: translate('server.deploy.progress.migrate_instances'),
        playbooks: [MIGRATE_INSTANCES]
      });
    }
    steps.push({
      label: translate('server.deploy.progress.disable_compute_service'),
      playbooks: [DISABLE_COMPUTE_SERVICE]
    },{
      label: translate('server.deactivate_services.text', this.props.operationProps.oldServer.id),
      playbooks: [`${NOVA_STOP_PLAYBOOK}.yml`],
      payload: {
        limit: this.props.operationProps.oldServer.hostname
      }
    });
    return steps;
  }

  getPlaybooks() {
    let playbooks = [];
    if (this.canMigrate()) {
      playbooks.push({
        name: MIGRATE_INSTANCES,
        action: ::this.migrateInstances
      });
    }
    playbooks.push({
      name: DISABLE_COMPUTE_SERVICE,
      action: ::this.disableCompServices
    }, {
      name: NOVA_STOP_PLAYBOOK,
      payload: {
        limit: this.props.operationProps.oldServer.hostname
      }
    });
    return playbooks;
  }

  needGetHostName() {
    return !this.props.operationProps.oldServer.hostname;
  }

  getHostName(cloudModel) {
    let oldHost =
      getHostFromCloudModel(cloudModel, this.props.operationProps.oldServer.id);
    if (oldHost) {
      let opProps = Object.assign({}, this.props.operationProps);
      // save the host names for old compute node
      opProps.oldServer['hostname'] = oldHost['hostname'];
      opProps.oldServer['ansible_hostname'] = oldHost['ansible_hostname'];
      this.props.updateGlobalState('operationProps', opProps);
      this.checkEncryptKeyAndProceed();
    }
    else { // no old or new hostname, should not happen, just in case
      this.setState({
        processErrorBanner: translate(
          'server.deactivate.progress.compute.emptyhost', this.props.operationProps.oldServer.id,
          oldHost),
        overallStatus: constants.STATUS.FAILED
      });
    }
  }
}

export default DeactivateComputeHost;
