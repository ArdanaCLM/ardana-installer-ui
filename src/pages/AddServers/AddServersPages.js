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

import CompleteAddServers from './CompleteAddServers.js';
import DeployAddServers from './DeployAddServers.js';
import PrepareAddServers from './PrepareAddServers.js';
import CompleteInstallOS from './CompleteInstallOS.js';
import ProcessInstallOS from './ProcessInstallOS.js';
import SelectInstallOS from './SelectInstallOS.js';

export const AddServersPages = {
  'PrepareAddServers': PrepareAddServers,
  'DeployAddServers': DeployAddServers,
  'CompleteAddServers': CompleteAddServers,
  'SelectInstallOS': SelectInstallOS,
  'ProcessInstallOS': ProcessInstallOS,
  'CompleteInstallOS': CompleteInstallOS
};
