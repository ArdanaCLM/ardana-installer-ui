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

import ReplaceController from './ReplaceController.js';
import InstallOS from './InstallOS.js';
import PrepareAddCompute from './PrepareAddCompute.js';
import DeployAddCompute from './DeployAddCompute.js';
import DisableComputeServiceNetwork from './DisableComputeServiceNetwork.js';
import CompleteReplaceCompute from './CompleteReplaceCompute.js';

// potential pages for all kinds of server replacement pages
export const UpdateServerPages = {
  'ReplaceController': ReplaceController,
  'InstallOS': InstallOS,
  'PrepareAddCompute': PrepareAddCompute,
  'DeployAddCompute': DeployAddCompute,
  'DisableComputeServiceNetwork': DisableComputeServiceNetwork,
  'CompleteReplaceCompute': CompleteReplaceCompute
};
