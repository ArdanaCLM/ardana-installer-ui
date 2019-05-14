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
import * as constants from '../../utils/constants';

class DeactivateComputeHost extends DisableComputeServiceNetwork {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      heading: translate('server.deactivate.text', props.operationProps.oldServer.id)
    };
  }

  getSteps() {
    let steps = [{
      label: translate('server.deploy.progress.disable_compute_service'),
      playbooks: [constants.DISABLE_COMPUTE_SERVICE_ACTION]
    }];

    steps = steps.concat(this.getStepsForInstances());

    if (this.props.operationProps.oldServer.isReachable) {
      steps.push({
        label: translate('server.deactivate_services.text', this.props.operationProps.oldServer.id),
        playbooks: [`${constants.NOVA_STOP_PLAYBOOK}.yml`],
        payload: {
          limit: this.props.operationProps.oldServer.hostname
        }
      });
    }
    return steps;
  }

  getPlaybooks() {
    let playbooks = [{
      name: constants.DISABLE_COMPUTE_SERVICE_ACTION,
      action: ::this.disableCompServices
    }];

    playbooks = playbooks.concat(this.getPlaybooksForInstances());

    if (this.props.operationProps.oldServer.isReachable) {
      playbooks.push({
        name: constants.NOVA_STOP_PLAYBOOK,
        payload: {
          limit: this.props.operationProps.oldServer.hostname
        }
      });
    }
    return playbooks;
  }

  needGetHostNames() {
    return false;
  }

  setCloseButtonDisabled = () => {
    // Disable the close button when playbooks/actions haven't started at all or
    // one of the playbooks or actions is still in progress
    return this.state.overallStatus === constants.STATUS.IN_PROGRESS ||
      this.state.overallStatus === constants.STATUS.UNKNOWN;
  }

  renderFooterButtons (showCancel, showRetry) {
    return this.renderNavButtons(false, showRetry);
  }
}

export default DeactivateComputeHost;
