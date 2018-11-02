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

import React from 'react';
import { translate } from '../../localization/localize.js';
import { INSTALL_PLAYBOOK, STATUS } from '../../utils/constants.js';
import BaseUpdateWizardPage from '../BaseUpdateWizardPage.js';
import { PlaybookProgress } from '../../components/PlaybookProcess.js';
import { ErrorBanner } from '../../components/Messages.js';
import { fetchJson, postJson, deleteJson } from '../../utils/RestUtils.js';
import { getInternalModel } from '../topology/TopologyUtils.js';
import { LoadingMask } from '../../components/LoadingMask.js';
import { isEmpty } from 'lodash';

class PrepareController extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);

    this.state = {
      overallStatus: STATUS.UNKNOWN, // overall status of entire playbook and commit
      invalidMsg: '',
      showLoadingMask: false,
    };
  }

  setNextButtonDisabled = () => this.state.overallStatus != STATUS.COMPLETE;

  componentWillMount() {
    this.setState({showLoadingMask: true});
    getInternalModel()
      .then((yml) => {
        // Force a re-render if the page is still shown (user may navigate away while waiting)
        if (this.refs.PrepareController) {
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

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
    if (status === STATUS.FAILED) {
      this.setState({invalidMsg: translate('server.replace.prepare.failure')});
    }
  }

  renderPlaybookProgress (doInstall) {

    const installPass = this.props.operationProps.osInstallPassword || '';
    const serverId = this.props.operationProps.server.id;

    let steps = [
      {
        label: translate('deploy.progress.commit'),
        playbooks: ['commit']
      },
      {
        label: translate('deploy.progress.config-processor-run'),
        playbooks: ['config-processor-run.yml']
      },
      {
        label: translate('deploy.progress.ready-deployment'),
        playbooks: ['ready-deployment.yml']
      },
      {
        label: translate('server.deploy.progress.rm-cobbler'),
        playbooks: ['rm-cobbler']
      },
      {
        label: translate('server.deploy.progress.rm-known-host'),
        playbooks: ['known-hosts']
      }];

    if(this.props.operationProps.installOS) {
      // The following steps will all be generated via the INSTALL_PLAYBOOK
      steps.push(
        {
          label: translate('install.progress.step1'),
          playbooks: ['bm-power-status.yml']
        },
        {
          label: translate('install.progress.step2'),
          playbooks: ['cobbler-deploy.yml']
        },
        {
          label: translate('install.progress.step3'),
          playbooks: ['bm-reimage.yml']
        },
        {
          label: translate('install.progress.step4'),
          playbooks: [INSTALL_PLAYBOOK + '.yml']
        }
      );
    }


    let playbooks = [
      {
        name: 'commit',
        action: ((logger) => {
          const commitMessage = {'message': 'Committed via Ardana Installer'};
          return postJson('/api/v1/clm/model/commit', commitMessage)
            .then((response) => {
              logger('Model committed\n');
            })
            .catch((error) => {
              const message = translate('update.commit.failure', error.toString());
              logger(message+'\n');
              throw new Error(message);
            });
        }),
      },
      {
        name: 'config-processor-run',
      },
      {
        name: 'ready-deployment',
      },
      {
        name: 'rm-cobbler',
        action: ((logger) => {
          return fetchJson('/api/v1/clm/cobbler/servers')
            .then((response) => {
              const cobbler_server = response.find((e) =>
                e.ip === this.props.operationProps.server.ip ||
                e.name === this.props.operationProps.server.id);
              if (cobbler_server) {
                const name = cobbler_server.name;

                return deleteJson('/api/v1/clm/cobbler/servers/' + name)
                  .then((response) => {
                    logger('Host removed from cobbler\n');
                  })
                  .catch((error) => {
                    const message = translate('update.remove_cobbler.failure', error.toString());
                    logger(message+'\n');
                    throw new Error(message);
                  });

              } else {
                logger('Host not present in cobbler, continuing\n');
              }
            });
        }),
      },
      {
        name: 'known-hosts',
        action: ((logger) => {
          const hostname = this.state.internalModel.internal.servers
            .filter(s => s.id == this.props.operationProps.server.id)
            .map(s => s.hostname);

          if (isEmpty(hostname)) {
            logger('No hostname found to remove from known_hosts, continuing\n');
            return Promise.resolve();
          }

          return deleteJson('/api/v1/clm/known_hosts/' + hostname)
            .then((response) => {
              logger(hostname+' removed from known_hosts\n');
            })
            .catch((error) => {
              const message = translate('update.known_hosts.failure', error.toString());
              logger(message+'\n');
              throw new Error(message);
            });
        }),
      },
    ];

    if(this.props.operationProps.installOS) {
      playbooks.push(
        {
          name: INSTALL_PLAYBOOK,
          payload: {'extra-vars': {'nodelist': [serverId], 'ardanauser_password': installPass}}
        });
    }

    return (
      <PlaybookProgress
        updatePageStatus={this.updatePageStatus}
        updateGlobalState={this.props.updateGlobalState}
        playbookStatus={this.props.playbookStatus}
        steps={steps}
        playbooks={playbooks}/>
    );
  }

  renderError () {
    return (
      <div className='banner-container'>
        <ErrorBanner message={this.state.invalidMsg}
          show={this.state.overallStatus === STATUS.FAILED}/>
      </div>
    );
  }

  render() {
    //if error happens, cancel button shows up
    let cancel =  this.state.overallStatus === STATUS.FAILED;
    return (
      <div ref="PrepareController" className='wizard-page'>
        <LoadingMask show={this.state.showLoadingMask}></LoadingMask>
        <div className='content-header'>
          {this.renderHeading(translate('server.replace.prepare'))}
        </div>
        <div className='wizard-content'>
          {this.renderPlaybookProgress()}
          {cancel && this.renderError()}
        </div>
        {this.renderNavButtons(cancel)}
      </div>
    );
  }
}

export default PrepareController;
