// (c) Copyright 2018-2019 SUSE LLC
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

import React from 'react';
import { translate } from '../../localization/localize.js';
import {
  CONFIG_PROCESSOR_RUN_PLAYBOOK, READY_DEPLOYMENT_PLAYBOOK,
  ARDANA_SSH_KEYSCAN_PLAYBOOK, BM_POWER_STATUS_PLAYBOOK,
  BM_REIMAGE_PLAYBOOK, COBBLER_DEPLOY_PLAYBOOK,
  BM_POWER_UP_PLAYBOOK, BM_WAIT_FOR_SSH_PLAYBOOK, WIPE_DISKS_PLAYBOOK,
  ARDANA_DEPLOY_PLAYBOOK, MONASCA_REBUILD_PRETASKS_PLAYBOOK,
  OSCONFIG_RUN_PLAYBOOK, CEILOMETER_RECONFIGURE_PLAYBOOK,
  INSTALL_PLAYBOOK, STATUS } from '../../utils/constants.js';
import BaseUpdateWizardPage from '../BaseUpdateWizardPage.js';
import { PlaybookProgress } from '../../components/PlaybookProgress.js';
import { ErrorBanner } from '../../components/Messages.js';
import { fetchJson, postJson, deleteJson } from '../../utils/RestUtils.js';
import { getInternalModel } from '../topology/TopologyUtils.js';
import { LoadingMask } from '../../components/LoadingMask.js';
import { isEmpty } from 'lodash';
import { ConfirmModal } from '../../components/Modals.js';
import { ActionButton } from '../../components/Buttons.js';

class ReplaceController extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      overallStatus: STATUS.UNKNOWN, // overall status of entire playbook and commit
      invalidMsg: '',
      showLoadingMask: false,

      ringBuilderConfirmation: undefined,
    };
  }

  setNextButtonDisabled = () => this.state.overallStatus != STATUS.COMPLETE;

  componentWillMount() {
    this.setState({showLoadingMask: true});
    getInternalModel()
      .then((yml) => {
        // Force a re-render if the page is still shown (user may navigate away while waiting)
        if (this.refs.ReplaceController) {
          // deal with refresh case
          if(this.props.isEncrypted && isEmpty(this.props.encryptKey)) {
            this.setState({showEncryptKeyModal: true});
          }
          this.setState({internalModel: yml, showLoadingMask: false});
        }
      })
      .catch((error) => {
        this.setState({
          error: {
            title: translate('default.error'),
            messages: [translate('services.services.per.role.unavailable')]
          },
          showLoadingMask: false
        });
      });
  }

  // overwrite function in parent
  handleSaveEncryptKey = async (encryptKey) => {
    this.setState({showEncryptKeyModal: false});
    await this.props.updateGlobalState('encryptKey', encryptKey);
  }

  updatePageStatus = (status, error) => {
    this.setState({overallStatus: status});
    if (status === STATUS.FAILED) {
      const errorMsg = error?.message || '';
      this.setState({invalidMsg: translate('server.replace.prepare.failure', errorMsg)});
    }
  }

  renderPlaybookProgress () {
    // Two related arrays, 'steps' and 'playbooks' are created from a single combined array for
    // sending to PlaybookProgress.  Defining them as a single array keeps their definitions
    // together, making them easier to relate to each other, and makes it easier to create a
    // function to return just a single entry that can be re-used
    //
    // Each elements of this combined array, playbook_steps contains:
    //   steps : an array of objects contaiing a label and and event , e.g.
    //      steps : [{label: translate('foo'),  event: 'playbook.yml'},
    //               {label: translate('foo'),  event: 'playbook.yml'}]
    //         (this will only be used when running site.yml, where a single playbook results in
    //          multiple noteworth events)
    //        or
    //      label : label to be shown, e.g. translate('foo').
    //
    //      playbook: name of a playbook to run. .yml suffix is optional.
    //        or
    //      action : function that returns a promise
    //
    //      payload: used when playbook is sent

    // Return without rendering if the internalModel is still loading
    // or if need input encryption key
    if (!this.state.internalModel || this.state.showEncryptKeyModal) {
      return;
    }

    const server = this.state.internalModel.internal.servers.find(s => s.id == this.props.operationProps.server.id);

    // Create an array of all playbooks/steps
    let playbook_steps = [
      {
        label: translate('deploy.progress.commit'),
        action: ((logger) => {
          const commitMessage = {'message': 'Committed via Ardana Installer'};
          return postJson('/api/v2/model/commit', commitMessage)
            .then((response) => {
              logger('Model committed');
            })
            .catch((error) => {
              const logMsg = 'Failed to commit update changes. ' + error.toString();
              logger(logMsg);
              const message = translate('update.commit.failure', error.toString());
              throw new Error(message);
            });
        }),
      },
      {
        label: translate('deploy.progress.config-processor-run'),
        playbook: CONFIG_PROCESSOR_RUN_PLAYBOOK + '.yml'
      },
      {
        label: translate('deploy.progress.ready-deployment'),
        playbook: READY_DEPLOYMENT_PLAYBOOK + '.yml'
      },
      {
        label: translate('server.deploy.progress.rm-cobbler'),
        action: ((logger) => {
          return fetchJson('/api/v2/cobbler/servers')
            .then((response) => {
              const cobbler_server = response.find((e) =>
                e.ip === this.props.operationProps.server.ip ||
                e.name === this.props.operationProps.server.id);
              if (cobbler_server) {
                const name = cobbler_server.name;

                return deleteJson('/api/v2/cobbler/servers/' + name)
                  .then((response) => {
                    logger('Host removed from cobbler');
                  })
                  .catch((error) => {
                    const logMsg = 'Unable to remove system from cobbler.' + error.toString();
                    logger(logMsg);
                    const message = translate('update.remove_cobbler.failure', error.toString());
                    throw new Error(message);
                  });

              } else {
                logger('Host not present in cobbler, continuing');
              }
            });
        }),
      },
      {
        label: translate('server.deploy.progress.rm-known-host'),
        playbook: ARDANA_SSH_KEYSCAN_PLAYBOOK + '.yml',
      },
    ];

    const serverId = this.props.operationProps.server.id;

    if (this.props.operationProps.installOS) {
      const installPass = this.props.operationProps.osPassword || '';
      // The following steps will all be performed via the INSTALL_PLAYBOOK
      playbook_steps.push(
        {
          steps: [{
            label: translate('install.progress.step1'),
            event: BM_POWER_STATUS_PLAYBOOK + '.yml'
          },
          {
            label: translate('install.progress.step2'),
            event: COBBLER_DEPLOY_PLAYBOOK + '.yml'
          },
          {
            label: translate('install.progress.step3'),
            event: BM_REIMAGE_PLAYBOOK + '.yml'
          },
          {
            label: translate('install.progress.step4'),
            event: INSTALL_PLAYBOOK + '.yml'
          }],
          playbook: INSTALL_PLAYBOOK,
          payload: {'extra-vars': {'nodelist': serverId, 'ardanauser_password': installPass}}
        },
      );
    } else {
      playbook_steps.push(
        {
          label: translate('server.deploy.progress.powerup'),
          playbook: BM_POWER_UP_PLAYBOOK + '.yml',
          payload: {'extra-vars': {'nodelist': serverId}}
        },
        {
          label: translate('server.deploy.progress.waitssh'),
          playbook: BM_WAIT_FOR_SSH_PLAYBOOK + '.yml',
          payload: {'extra-vars': {'nodelist': serverId}}
        }
      );
    }

    if (this.props.operationProps.wipeDisk) {
      playbook_steps.push(
        {
          label: translate('server.deploy.progress.wipe-disks'),
          playbook: WIPE_DISKS_PLAYBOOK + '.yml',
          payload: {limit: server.hostname}
        });
    }

    playbook_steps.push(
      {
        label: translate('server.deploy.progress.monasca-rebuild'),
        playbook: MONASCA_REBUILD_PRETASKS_PLAYBOOK + '.yml'
      },
      {
        label: translate('server.deploy.progress.os-config'),
        playbook: OSCONFIG_RUN_PLAYBOOK + '.yml',
        payload: {'extra-vars': {'rebuild': 'True'}, limit: server.hostname}
      },
    );

    // Determine whether the given node is the swift ring builder, which requires special handling
    let ring_builder;
    for (const cp of Object.values(this.state.internalModel.internal['control-planes'])) {
      try {
        // Extract a list of swift nodes from the control plane.  Note that this
        const swift_nodes =
          cp['components']['swift-ring-builder']['consumes']['consumes_SWF_ACC']['members']['private'];

        // The first swift node is the ring builder
        ring_builder = swift_nodes[0];
        break;
      }
      catch (err) {
        // Ignore any errors when the ring-builder nested object is not preset
      }
    }

    let deploy_limit = server.hostname;

    if (ring_builder.ardana_ansible_host === server.ardana_ansible_host) {
      playbook_steps.push(
        {
          label: translate('server.deploy.progress.swift-check'),
          action: ((logger) => {
            return new Promise((resolve, reject) => {
              this.setState({
                'ringBuilderConfirmation': {
                  'resolve': resolve,
                  'reject': reject,
                },
              });
            });
          }),
        },
      );
    } else if (ring_builder !== undefined) {
      // Per the operations guide, (13.1.2.1.2 Replacing a Standalone Controller Node), when the node being replaced
      // is *not* the swift ring builder, the swift ring builder host should be included in the limit switch for the
      // ardana-deploy playbook
      deploy_limit += ','+ring_builder.host;
    }

    playbook_steps.push({
      label: translate('server.deploy.progress.ardana-deploy'),
      playbook: ARDANA_DEPLOY_PLAYBOOK + '.yml',
      payload: {'extra-vars': {'rebuild': 'True'}, limit: deploy_limit}
    },{
      label: translate('server.deploy.progress.ceilometer'),
      playbook: CEILOMETER_RECONFIGURE_PLAYBOOK + '.yml',
    });

    let playbooks = [];
    let steps = [];
    let action_num = 1;

    for (const pb_step of playbook_steps) {

      let playbook_name;
      if (pb_step.action) {
        playbook_name = 'action'+action_num.toString();
        action_num++;
      } else {
        playbook_name = pb_step.playbook.replace(/.yml$/,'');
      }

      // Build the steps array
      if (pb_step.label) {
        // single playbook.  For actions, the playbook name should exactly match
        // the name in the playbook array, but for playbooks, the name here should
        // have a .yml suffix
        let event_name = pb_step.action ? playbook_name : playbook_name+'.yml';
        steps.push({label: pb_step.label, playbooks: [event_name]});
      } else {
        // multi-event playbook
        for (const entry of pb_step.steps) {
          steps.push({label: entry.label, playbooks: [entry.event]});
        }
      }

      // Build the playbooks array
      if (pb_step.action) {
        playbooks.push({name: playbook_name, action: pb_step.action});
      } else {
        playbooks.push({name: playbook_name, payload: pb_step.payload});
      }
    }
    // common_payload will be merged with individual playbook payload when luanch
    // playbook in PlaybookProgress
    let common_payload = {'extra-vars': {encrypt: this.props.encryptKey || ''}};
    return (
      <PlaybookProgress
        payload={common_payload}
        updatePageStatus={this.updatePageStatus}
        updateGlobalState={this.props.updateGlobalState}
        playbookStatus={this.props.playbookStatus}
        steps={steps}
        playbooks={playbooks}/>
    );
  }

  renderError () {
    return (
      <div className='banner-container no-margin'>
        <ErrorBanner message={this.state.invalidMsg}
          show={this.state.overallStatus === STATUS.FAILED}/>
      </div>
    );
  }

  renderRingBuilderConfirmation() {
    if (this.state.ringBuilderConfirmation) {

      const cancel = () => {
        this.state.ringBuilderConfirmation.reject();
        this.setState({ringBuilderConfirmation: undefined});
      };
      const done = () => {
        this.state.ringBuilderConfirmation.resolve();
        this.setState({ringBuilderConfirmation: undefined});
      };

      const footer = (
        <div className="btn-row">
          <ActionButton type='default' clickAction={cancel} displayLabel={translate('cancel')}/>
          <ActionButton clickAction={done} displayLabel={translate('done')}/>
        </div>
      );

      return (
        <ConfirmModal title={translate('server.deploy.progress.swift-check')}
          onHide={cancel} footer={footer}>
          {translate('server.deploy.progress.swift-manual')}
        </ConfirmModal>
      );
    }
  }

  render() {
    //if error happens, cancel button shows up
    let cancel =  this.state.overallStatus === STATUS.FAILED;
    return (
      <div ref="ReplaceController" className='wizard-page'>
        <LoadingMask show={this.state.showLoadingMask}></LoadingMask>
        <div className='content-header'>
          {this.renderHeading(translate('server.replace'))}
        </div>
        <div className='wizard-content'>
          {this.renderPlaybookProgress()}
          {cancel && this.renderError()}
          {this.renderRingBuilderConfirmation()}
          {this.renderEncryptKeyModal()}
        </div>
        {this.renderNavButtons(cancel)}
      </div>
    );
  }
}

export default ReplaceController;
