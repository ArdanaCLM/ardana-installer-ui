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

import React, { Component } from 'react';
import { isEmpty } from 'lodash';
import { translate } from '../localization/localize.js';
import { ActionButton } from '../components/Buttons.js';
import { postJson, isCloudConfigEncrypted } from '../utils/RestUtils.js';
import { ErrorMessage } from '../components/Messages.js';
import { PlaybookProgress } from '../components/PlaybookProgress.js';
import * as constants from '..//utils/constants.js';
import ServiceTemplatesTab from './ValidateConfigFiles/ServiceTemplatesTab.js';
import { getCachedEncryptKey, setCachedEncryptKey } from '../utils/MiscUtils.js';

// services that have corresponding -reconfigure.yml and -status.yml files
const UPDATEABLE_SERVICES = [
  'barbican', 'bind', 'cassandra', 'ceilometer', 'cinder', 'designate', 'freezer', 'glance', 'heat',
  'ironic', 'keystone', 'magnum', 'manila', 'monasca', 'monasca-transform', 'neutron', 'nova',
  'octavia', 'percona', 'powerdns', 'rabbitmq', 'ses', 'spark', 'swift', 'zookeeper'
];

class ServiceConfiguration extends Component {

  constructor() {
    super();
    this.state = {
      showActionButtons: true,
      showUpdateProgress: false,
      isChanged: false,
      updateCompleted: false,
      error: undefined,
      // deal with encryptKey
      isEncrypted: false,
      encryptKey: getCachedEncryptKey() || '' // need it to change the update button
    };
    this.playbooksToRun = undefined;
  }

  async componentDidMount() {
    let isEncrypted = await isCloudConfigEncrypted();
    this.setState({isEncrypted : isEncrypted});
  }

  startConfigUpdate = () => {
    // remove original files and commit configuration changes
    this.serviceTemplatesTab.removeOrigFiles();
    const commitMessage = {'message': 'Committed via CLM Admin Console'};
    postJson('/api/v2/model/commit', commitMessage)
      .then(() => {
        this.setState({showUpdateProgress: true, updateCompleted: false});
      })
      .catch((error) => {
        this.setState({
          error: {
            title: translate('default.error'),
            messages: [translate('service.configuration.update.commit.failure', error.toString())]
          }
        });
      });
  }

  renderErrorMessage() {
    if (this.state.error) {
      return (
        <div className='notification-message-container'>
          <ErrorMessage
            closeAction={() => this.setState({error: undefined})}
            title={this.state.error.title}
            message={this.state.error.messages}>
          </ErrorMessage>
        </div>
      );
    }
  }

  showActionButtons = (show) => {
    this.setState({showActionButtons: show});
  }

  handleChange = (change) => {
    this.setState({isChanged: change});
  }

  handleEncryptKey = (key) => {
    this.setState({encryptKey: key});
    setCachedEncryptKey(key);
  }

  updateProgressStatus = (msg, playbooks) => {
    let done = true;
    for (const playbook of playbooks) {
      if (playbook.status) {
        if (playbook.status === constants.STATUS.FAILED) {
          done = true;
          break;
        } else {
          done = done && (playbook.status === constants.STATUS.COMPLETE);
        }
      } else {
        done = false;
      }
    }

    if (done) {
      this.setState({updateCompleted: true, isChanged: false});
    }
  }

  getPlaybooks = () => {
    let playbooksToRun = {playbooks: []};
    const changedServices = this.serviceTemplatesTab.getChangedServices();
    if (changedServices?.length > 0) {
      playbooksToRun.steps = [{
        label: translate('deploy.progress.config-processor-run'),
        playbooks: [constants.CONFIG_PROCESSOR_RUN_PLAYBOOK + '.yml']
      }, {
        label: translate('deploy.progress.ready-deployment'),
        playbooks: [constants.READY_DEPLOYMENT_PLAYBOOK + '.yml']
      }];
      playbooksToRun.playbooks.push(constants.PRE_DEPLOYMENT_PLAYBOOK);
      if(this.state.sesEnabled) {
        playbooksToRun.steps.push({
          label: translate('deploy.ses'),
          playbooks: [`${constants.DEPLOY_SES_PLAYBOOK}.yml`]
        });
        changedServices.push('cinder', 'glance', 'nova'); // we want to be sure ardana-reconfigure is triggered.
        playbooksToRun.playbooks.push(constants.DEPLOY_SES_PLAYBOOK);
      }
      const serviceName = changedServices[0];
      if (changedServices.length === 1 && UPDATEABLE_SERVICES.includes(serviceName)) {
        playbooksToRun.playbooks.push(serviceName + '-reconfigure', serviceName + '-status');
        playbooksToRun.steps.push({
          label: translate('deploy.progress.update'),
          playbooks: [serviceName + '-reconfigure.yml']
        }, {
          label: translate('deploy.progress.run.status'),
          playbooks: [serviceName + '-status.yml']
        });
      } else {
        playbooksToRun.playbooks.push(constants.ARDANA_RECONFIGURE_PLAYBOOK);
        playbooksToRun.steps.push({
          label: translate('deploy.progress.update'),
          playbooks: [constants.ARDANA_RECONFIGURE_PLAYBOOK + '.yml']
        });
      }
    }
    return playbooksToRun;
  }

  toDisableUpdate = () => {
    return !this.state.isChanged || (this.state.isEncrypted && isEmpty(this.state.encryptKey));
  }

  setSesEnabled(sesEnabled) {
    this.setState({ sesEnabled });
  }

  renderContent = () => {
    if (this.state.showUpdateProgress) {
      if (!this.playbooksToRun) {
        this.playbooksToRun = this.getPlaybooks();
      }
      const payload = {'extra-vars': {encrypt: this.state.encryptKey || ''}};

      return (
        <div className='column-layout'>
          <div className='header'>{translate('services.configuration.update.progress')}</div>
          <PlaybookProgress steps={this.playbooksToRun.steps} playbooks={this.playbooksToRun.playbooks}
            hideCancel={true}
            payload={payload} updatePageStatus={() => {}} updateGlobalState={this.updateProgressStatus}/>
          {this.state.showActionButtons ? this.renderActionButtons() : ''}
        </div>
      );
    } else {
      let handleEncryption = {};
      if(this.state.isEncrypted) {
        handleEncryption.handleEncryptKey = this.handleEncryptKey;
      }
      return (
        <div className='column-layout'>
          <div className='header'>{translate('services.configuration.update')}</div>
          <ServiceTemplatesTab revertable disableTab={() => {}}
            enableSes={::this.setSesEnabled}
            showNavButtons={this.showActionButtons} hasChange={this.handleChange}
            {...handleEncryption}
            ref={instance => {this.serviceTemplatesTab = instance;}}/>
          {this.state.showActionButtons ? this.renderActionButtons() : ''}
        </div>
      );
    }
  }

  renderActionButtons = () => {
    if (this.state.showUpdateProgress) {
      return (
        <div className='btn-row right-btn-group'>
          <ActionButton displayLabel={translate('back')} isDisabled={!this.state.updateCompleted}
            clickAction={() => this.setState({showUpdateProgress: false})}/>
        </div>
      );
    } else {
      return (
        <div className='btn-row right-btn-group'>
          <ActionButton type='default' displayLabel={translate('cancel')} isDisabled={!this.state.isChanged}
            clickAction={() => this.serviceTemplatesTab.revertChanges()}/>
          <ActionButton displayLabel={translate('update')} isDisabled={this.toDisableUpdate()}
            clickAction={() => this.startConfigUpdate()}/>
        </div>
      );
    }
  }

  render() {
    return (
      <div>
        <div className='menu-tab-content'>
          {this.renderContent()}
          {this.renderErrorMessage()}
        </div>
      </div>
    );
  }
}

export default ServiceConfiguration;
