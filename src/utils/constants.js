// (c) Copyright 2017-2019 SUSE LLC
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

export const MODEL_SERVER_PROP_CHECK_NULL = ['nic-mapping', 'server-group', 'ip-addr'];

export const IS_MS_EDGE = /Edge/.test(window.navigator.userAgent);

export const IS_MS_IE = /MSIE\s|Trident\/7\./.test(window.navigator.userAgent);

export const TRUTHY = [true, 'true', 'True', 'yes', 'Yes'];

/** Playbooks **/
export const INSTALL_PLAYBOOK = 'installui-os-provision';
export const PRE_DEPLOYMENT_PLAYBOOK = 'installui-pre-deployment';
export const DAYZERO_SITE_PLAYBOOK = 'installui-wipe-and-site';
export const SITE_PLAYBOOK = 'site';

export const COBBLER_DEPLOY_PLAYBOOK = 'cobbler-deploy';
export const CONFIG_PROCESSOR_RUN_PLAYBOOK = 'config-processor-run';
export const OSCONFIG_RUN_PLAYBOOK = 'osconfig-run';
export const READY_DEPLOYMENT_PLAYBOOK = 'ready-deployment';
export const WIPE_DISKS_PLAYBOOK = 'wipe_disks';

export const ARDANA_DEPLOY_PLAYBOOK = 'ardana-deploy';
export const ARDANA_GEN_HOSTS_FILE_PLAYBOOK = 'ardana-gen-hosts-file';
export const ARDANA_RECONFIGURE_PLAYBOOK = 'ardana-reconfigure';
export const ARDANA_SSH_KEYSCAN_PLAYBOOK = 'ardana-ssh-keyscan';
export const ARDANA_START_PLAYBOOK = 'ardana-start';
export const ARDANA_STATUS_PLAYBOOK = 'ardana-status';

export const BM_POWER_DOWN_PLAYBOOK = 'bm-power-down';
export const BM_POWER_UP_PLAYBOOK = 'bm-power-up';
export const BM_REIMAGE_PLAYBOOK = 'bm-reimage';
export const BM_POWER_STATUS_PLAYBOOK = 'bm-power-status';
export const BM_WAIT_FOR_SSH_PLAYBOOK = 'bm-wait-for-ssh';

export const CEILOMETER_RECONFIGURE_PLAYBOOK = 'ceilometer-reconfigure';
export const CEPH_DEPLOY_PLAYBOOK = 'ceph-deploy';
export const CINDER_DEPLOY_PLAYBOOK = 'cinder-deploy';
export const IRONIC_DEPLOY_PLAYBOOK = 'ironic-deploy';
export const MAGNUM_DEPLOY_PLAYBOOK = 'magnum-deploy';
export const NEUTRON_STOP_PLAYBOOK = 'neutron-stop';
export const NETWORK_INTERFACE_DEPLOY_PLAYBOOK = 'network_interface-deploy';
export const NOVA_DEPLOY_PLAYBOOK = 'nova-deploy';
export const NOVA_STOP_PLAYBOOK = 'nova-stop';
export const SWIFT_DEPLOY_PLAYBOOK = 'swift-deploy';

export const MONASCA_DEPLOY_PLAYBOOK = 'monasca-deploy';
export const MONASCA_AGENT_DEPLOY_PLAYBOOK = 'monasca-agent-deploy';
export const MONASCA_REBUILD_PRETASKS_PLAYBOOK = 'monasca-rebuild-pretasks';
export const MONASCA_TRANSFORM_DEPLOY_PLAYBOOK = 'monasca-transform-deploy';

export const NOVA_HOST_EVACUATE_PLAYBOOK ='nova-host-evacuate';

export const COMMIT_MODEL_CHANGE_ACTION = 'commit_model_change';
export const DISABLE_COMPUTE_SERVICE_ACTION = 'disable_compute_service';
export const REMOVE_FROM_AGGREGATES_ACTION = 'remove_from_aggregates';
export const MIGRATE_INSTANCES_ACTIOIN = 'migrate_instances';
export const DISABLE_NETWORK_AGENTS_ACTION = 'disable_network_agents';

// Model validation status
export const INVALID = 0;
export const VALID = 1;
export const UNKNOWN = -1;
export const VALIDATING = 2;

export const DEPLOY_SES_PLAYBOOK = 'ses-deploy';
