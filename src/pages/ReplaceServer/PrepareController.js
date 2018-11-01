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
import { STATUS } from '../../utils/constants.js';
import BaseUpdateWizardPage from '../BaseUpdateWizardPage.js';
import { PlaybookProgress } from '../../components/PlaybookProcess.js';
import { ErrorBanner } from '../../components/Messages.js';
import { fetchJson, postJson, deleteJson } from '../../utils/RestUtils.js';

class PrepareController extends BaseUpdateWizardPage {

  constructor(props) {
    super(props);

    this.state = {
      overallStatus: STATUS.UNKNOWN, // overall status of entire playbook and commit
      invalidMsg: '',
    };
  }

  setNextButtonDisabled = () => this.state.overallStatus != STATUS.COMPLETE;

  updatePageStatus = (status) => {
    this.setState({overallStatus: status});
    if (status === STATUS.FAILED) {
      this.setState({invalidMsg: translate('server.replace.prepare.failure')});
    }
  }

  renderPlaybookProgress () {
    const steps = [
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
      },
      {
        label: translate('server.deploy.progress.cobbler-deploy'),
        playbooks: ['cobbler-deploy.yml']
        // TODO:
        //    cobbler-deploy *might* prompt for a password, although the logs on the QE system
        //       ardana@10.84.81.17 indicate that none was supplied and it succesfully ran. Hmmmm
      },
    ];

    const playbooks = [
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
                e.name === this.props.operationProps.server.name);
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
          return deleteJson('/api/v1/clm/known_hosts/' + this.props.operationProps.server.id)
            .then((response) => {
              logger('Host removed from known_hosts\n');
            })
            .catch((error) => {
              const message = translate('update.known_hosts.failure', error.toString());
              logger(message+'\n');
              throw new Error(message);
            });
        }),
      },
      {
        name: 'cobbler-deploy',
      },
    ];

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
      <div className='wizard-page'>
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
