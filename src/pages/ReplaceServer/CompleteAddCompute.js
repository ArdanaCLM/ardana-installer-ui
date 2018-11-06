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

import CompleteAddServers from '../AddServers/CompleteAddServers.js';
import { translate } from '../../localization/localize.js';

// This is the complete page for adding compute servers
// process. It will display newly deployed server hostname,
// server ID and IP.
class CompleteAddCompute extends CompleteAddServers {
  constructor(props) {
    super(props);
  }

  getCompleteTitle = () => {
    let heading =
      this.props.operationProps.activate ?
        translate('server.deploy.activate.addcompute.complete') : translate('server.deploy.addcompute.complete');
    return heading;
  }
}

export default CompleteAddCompute;
