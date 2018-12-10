// (c) Copyright 2017-2018 SUSE LLC
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
export const STATUS = {
  UNKNOWN: -1,
  NOT_STARTED: 0,
  COMPLETE: 1,
  IN_PROGRESS: 2,
  FAILED: 3
};

export const INPUT_STATUS = {
  UNKNOWN: -1,
  VALID: 1,
  INVALID: 0
};

export const MODE = {
  EDIT: 'edit',
  ADD: 'add',
  NONE: 'none'
};

export const MODEL_SERVER_PROPS =  [
  'id', 'ip-addr', 'mac-addr', 'server-group','nic-mapping', 'ilo-ip',
  'ilo-user', 'ilo-password'
];

export const REPLACE_SERVER_MAC_IPMI_PROPS =  [
  'mac-addr', 'ilo-ip', 'ilo-user', 'ilo-password'
];

export const MODEL_SERVER_PROPS_ALL = MODEL_SERVER_PROPS.concat(['role', 'uid']);

export const IS_MS_EDGE = /Edge/.test(window.navigator.userAgent);

export const IS_MS_IE = /MSIE\s|Trident\/7\./.test(window.navigator.userAgent);

export const TRUTHY = [true, 'true', 'True', 'yes', 'Yes'];

/** Playbooks **/
export const INSTALL_PLAYBOOK = 'installui-os-provision';
export const PRE_DEPLOYMENT_PLAYBOOK = 'installui-pre-deployment';
export const DAYZERO_SITE_PLAYBOOK = 'installui-wipe-and-site';
export const SITE_PLAYBOOK = 'site';
export const WIPE_DISKS_PLAYBOOK = 'wipe_disks';
export const ARDANA_GEN_HOSTS_FILE_PLAYBOOK = 'ardana-gen-hosts-file';
export const MONASCA_DEPLOY_PLAYBOOK = 'monasca-deploy';
export const ARDANA_START_PLAYBOOK = 'ardana-start';
export const NOVA_STOP_PLAYBOOK = 'nova-stop';
export const NEUTRON_STOP_PLAYBOOK = 'neutron-stop';
export const BM_POWER_DOWN_PLAYBOOK = 'bm-power-down';
export const COBBLER_DEPLOY_PLAYBOOK = 'cobbler-deploy';
export const BM_REIMAGE = 'bm-reimage';
export const BM_POWER_STATUS_PLAYBOOK = 'bm-power-status';

