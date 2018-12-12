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
import React, { Component } from 'react';

import { translate } from '../localization/localize.js';
import { getAppConfig } from '../utils/ConfigHelper.js';
import { fetchJson, postJson, deleteJson } from '../utils/RestUtils.js';
import { STATUS } from '../utils/constants.js';
import { sleep } from '../utils/MiscUtils.js';
import { ActionButton } from '../components/Buttons.js';
import io from 'socket.io-client';
import { List } from 'immutable';
import debounce from 'lodash/debounce';
import { ConfirmModal, YesNoModal } from '../components/Modals.js';

const PROGRESS_UI_CLASS = {
  NOT_STARTED: 'notstarted',
  FAILED: 'fail',
  COMPLETE: 'succeed',
  IN_PROGRESS: 'progressing'
};

class LogViewer extends Component {

  constructor(props) {
    super(props);

    this.state = {
      autoScroll: true
    };
  }

  componentDidUpdate(prevProps, prevState) {
    // Scroll to the bottom whenever the component updates
    if (prevState.autoScroll) {
      this.viewer.scrollTop = this.viewer.scrollHeight - this.viewer.clientHeight;
    }
  }

  handleChange = (e) => {
    this.setState({autoScroll: e.target.checked});
  }

  render() {
    return (
      <div>
        <div className="log-viewer">
          <pre className="rounded-corner" ref={(comp) => {this.viewer = comp; }}>
            {this.props.contents.join('')}
          </pre>
        </div>
        <div className='log-viewer-control'>
          <label className='log-viewer-scroll'>
            <input type="checkbox"
              checked={this.state.autoScroll}
              onChange={this.handleChange} /> {translate('logviewer.autoscroll')}
          </label>
          <div className='log-viewer-hide'>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

class StatusModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      action: 'cancel'
    };
  }

  componentDidUpdate(prevProps, prevState) {
    // Scroll to the bottom whenever the component updates
    this.viewer.scrollTop = this.viewer.scrollHeight - this.viewer.clientHeight;
  }

  handleButton = () => {
    if (this.state.action === 'close' || this.props.playbooksComplete.length === 1 || this.props.closeModal) {
      this.props.onHide();
    } else {
      this.props.cancelPlaybook();
      this.setState({action: 'close'}, () => {
        // reset focus of the close button which for some reason gets focused on after cancel button
        document.getElementById('closePlaybookStatus').blur();
      });
    }
  }

  render() {
    // action 'close' is set: a) after user clicks on Cancel button, b) when user clicks on Close button,
    // and c) when error occurs
    const label = (this.state.action === 'close' || this.props.playbooksComplete.length === 1 ||
      this.props.closeModal) ? translate('close') : translate('services.cancel.playbook');
    const footer = <ActionButton id='closePlaybookStatus' clickAction={this.handleButton} displayLabel={label}/>;

    return (
      <ConfirmModal onHide={this.props.onHide} className='status-modal'
        title={translate('services.status.result', this.props.serviceName)} hideCloseButton
        footer={footer}>
        <div className='log-viewer'>
          <pre ref={(comp) => {this.viewer = comp; }}>
            {this.props.contents.join('')}
          </pre>
        </div>
      </ConfirmModal>
    );
  }
}

class PlaybookProgress extends Component {
  constructor(props) {
    super(props);

    // List for capturing messages as they are received.  The state
    // variable will be updated regularly with the contents of this
    // list.
    this.logsReceived = List();

    this.state = {
      errorMsg: '',                      // error message to display
      showLog: false,                    // controls visibility of log viewer
      playbooksStarted: [],              // list of playbooks that have started
      playbooksComplete: [],             // list of playbooks that have completed
      playbooksError: [],                // list of playbooks that have errored
      displayedLogs: List(),             // log messages to display in the log viewer
      showConfirmationDlg: false,        // show the confirmation dialog
      closeStatusPlaybookModal: false,   // set to true to close the Run Status Playbook modal
    };

    // This component expects the following values to be passed in props:
    //   updatePageStatus - function to be called whenever a playbook starts, completes, or fails
    //                      Used by callers to show an error dialog or enable navigation buttons
    //                      (sometimes an empty function is passed)
    //
    //   updateGlobalState - function (usually in the installWizard) for updating the global state. Used in this class
    //                       for updating playbookStatus, which in turn is received separately as a prop.
    //
    //   playbookStatus - array of playbooks, playIds, and statuses.  Used to track status of all playbooks
    //
    //   playbooks - EITHER:
    //       - array of playbook names to invoke (without the .yml suffix)
    //          OR
    //       - array of objects, containing:
    //            name - name of the playbook
    //            payload - payload specific to *this* playbook. This enables passing a specific payload
    //                      to this playbook
    //            action - when this is supplied, it should be a function that returns a promise, and it will
    //                     be executed instead of calling ansible to run the playbook.  In this case, the playbook
    //                     name is nothing more than a key to correlate with the corresponding step.  The action
    //                     function will be passed an argument with a logger function, which enables the action
    //                     to add messages to the log displayed to the user.
    //
    //   payload - body of REST call when invoking all playbooks.
    //
    //
    //   steps - array of objects, each of which contains:
    //     label     - string to display on the UI page
    //     playbooks - array of playbook names.  When events arrive from ansible, they contain playbook
    //                 names which will be matched against values in this array, and the steps displayed
    //                 to the user will be rendered differently depending on their status.  This works in
    //                 the same way for "playbooks" that are actions.
    //     orCondition - optional. Used in one place to indicate that a step is complete if *any* playbook
    //                   in the list completes
    //   ]
    //
  }

  getStatusCSSClass = (status) => {
    let retClass = '';
    switch (status) {
    case  STATUS.IN_PROGRESS:
      retClass = PROGRESS_UI_CLASS.IN_PROGRESS;
      break;
    case STATUS.COMPLETE:
      retClass = PROGRESS_UI_CLASS.COMPLETE;
      break;
    case STATUS.FAILED:
      retClass = PROGRESS_UI_CLASS.FAILED;
      break;
    default:
      retClass = PROGRESS_UI_CLASS.NOT_STARTED;
      break;
    }
    return retClass;
  }

  getStepCompletedPlaybooks = (step) => {
    let retPlaybooks = step.playbooks.filter((playbook) => {
      return this.state.playbooksComplete.indexOf(playbook) !== -1;
    });
    return retPlaybooks;
  }

  getProgress() {
    let progresses =  this.props.steps.map((step, index) => {
      let status = STATUS.NOT_STARTED, i = 0;

      //for each step, check if any playbooks failed
      for (i = 0; i < step.playbooks.length; i++) {
        if (this.state.playbooksError.indexOf(step.playbooks[i]) !== -1) {
          status = STATUS.FAILED ;//there is at least 1 ERROR playbook
        }
      }

      // Check if all started playbooks have finished, if a playbook is in the step but
      // never gets started, ignore it. We might include a playbook in the step which
      // is not relevant to the deployment anymore.
      if (status === STATUS.NOT_STARTED) {
        let stepCompletedPlaybooks = this.getStepCompletedPlaybooks(step);

        // if there is an or condition, it means one of the playbooks completes, the
        // step completes. For example site.yml or installui-wipe-and-site.yml
        if (step.orCondition && stepCompletedPlaybooks.length > 0) {
          status = STATUS.COMPLETE;
        }
        // check the ideal case where all the playbooks in the step ran and completed
        else if (stepCompletedPlaybooks.length === step.playbooks.length) {
          status = STATUS.COMPLETE;
        }
        // have some playbooks completed, need to check if this step completed
        else if (stepCompletedPlaybooks.length > 0) {
          // we could include playbooks which might not be relevant to the step
          // check the last step completed...if last step completed, make this step completed
          let lastStepIndex = this.props.steps.length - 1;
          let lastStepCompleted =
            this.getStepCompletedPlaybooks(this.props.steps[lastStepIndex]);
          if (lastStepCompleted.length > 0) {
            status = STATUS.COMPLETE;
          }
          else {
            status = STATUS.IN_PROGRESS;
          }
        }
      }

      // if the status has not previously been set to fail or complete,
      // check if any of the playbooks have started
      if (status === STATUS.NOT_STARTED) {
        //for each step, check if all needed playbooks are done
        //if any are not done, check if at least 1 has started
        for (i = 0; i < step.playbooks.length; i++) {
          if (this.state.playbooksStarted.indexOf(step.playbooks[i]) !== -1) {
            status = STATUS.IN_PROGRESS;
            break;//there is at least 1 started playbook
          }
        }
      }

      const statusClass = this.getStatusCSSClass(status);
      if (status === STATUS.COMPLETE) {
        return (<li key={index} className={statusClass}>{step.label}
          <i className='material-icons succeed-icon'>check_circle</i></li>);
      } else {
        return (<li key={index} className={statusClass}>{step.label}</li>);
      }
    });

    return progresses;
  }

  monitorSocket = (playbookName, playId) => {
    // Note that this function is only called after a fetch has completed, and thus
    // the application config has already completed loading, so getAppConfig can
    // be safely used here
    this.socket = io(getAppConfig('shimurl'));
    this.socket.on('playbook-start', this.playbookStarted);
    this.socket.on(
      'playbook-stop',
      (stepPlaybook) => { this.playbookStopped(stepPlaybook, playbookName, playId); });
    this.socket.on(
      'playbook-error',
      (stepPlaybook) => { this.playbookError(stepPlaybook, playbookName, playId); });
    this.socket.on('log', this.logMessage);
    this.socket.on(
      'end',
      () => { this.processEndMonitorPlaybook(playbookName); });
    this.socket.emit('join', playId);
  }

  // "Playbooks" come in a couple varieties. Originally they were just names, but
  // later improvements enhanced the concept to include a structure which contains
  // the name as well as other fields.  Return the name here.
  getPlaybookName = (playbook) => {
    if (typeof(playbook) === 'object') {
      return playbook.name;
    } else {
      return playbook;
    }
  }

  findNextPlaybook = (lastCompletedPlaybookName) => {
    // Find the next playbook in sequence after the given one.  Note that if the completed
    // playbook is not found, findIndex() will return -1, so next will be 0 (the first playbook)
    const index = this.props.playbooks.findIndex((p) => this.getPlaybookName(p) === lastCompletedPlaybookName);
    const next = index + 1;

    if (next < this.props.playbooks.length) {
      return this.props.playbooks[next];
    }
  }

  processEndMonitorPlaybook = (playbookName) => {
    if (this.socket.connected) {
      this.socket.disconnect();
      const thisPlaybook = this.globalPlaybookStatus.find(e => e.name === playbookName);
      // the global playbookStatus should be updated in playbookError or playbookStopped
      if(thisPlaybook && thisPlaybook.status === STATUS.COMPLETE) {
        const nextPlaybook = this.findNextPlaybook(thisPlaybook.name);
        if (nextPlaybook) {
          this.launchPlaybook(nextPlaybook);
        }
        else {
          this.props.updatePageStatus(STATUS.COMPLETE); //set the caller page status
        }
      } else {
        // in case of running only one playbook that has no playbook-stop tag
        if (thisPlaybook && this.globalPlaybookStatus.length === 1) {
          this.setState((prevState) => {
            return {'playbooksComplete': prevState.playbooksComplete.concat(playbookName + '.yml')};
          });
        }
      }
    }
  }

  updateGlobalPlaybookStatus = (playbookName, playId, status) => {
    const playbook = this.globalPlaybookStatus.find(e => e.name === playbookName);
    if (playbook) {
      if (playId !== undefined) {
        playbook.playId = playId;
      }
      playbook.status = status;
      if (this.props.updateGlobalState) {
        this.props.updateGlobalState('playbookStatus', this.globalPlaybookStatus);
      }
    }
  }

  // To get or initialize this.globalPlaybookStatus from the saved state
  // playbookStatus
  getGlobalPlaybookStatus = () => {
    let retStatus = this.props.playbookStatus; //passed global in InstallWizards
    // don't have playbookStatus, initialize it based on current playbooks
    let playbookNames = this.props.playbooks.map(p => this.getPlaybookName(p));
    if (!retStatus) {
      retStatus = playbookNames.map((playbookName) => {
        return {name: playbookName, status: undefined, playId: undefined};
      });
    }
    else { // have playbook status
      let exitStatus = retStatus.find((play) => playbookNames.includes(play.name));
      if (!exitStatus) {
        //need init for this.props.playbooks
        let initPlayStatus = playbookNames.map((playbookName) => {
          return {name: playbookName, status: undefined, playId: undefined};
        });
        retStatus = retStatus.concat(initPlayStatus);
      }
    }
    return retStatus;
  }

  // return playbooks with the given status
  getPlaybooksWithStatus = (status) => {
    // If called before globalPlaybookStatus is created (comoonentDidMount), return an empty array
    if (!this.globalPlaybookStatus) {
      return [];
    }

    let playbookNames = this.props.playbooks.map(p => this.getPlaybookName(p));
    return this.globalPlaybookStatus.filter(play =>
      (playbookNames.includes(play.name) && play.playId !== undefined && play.status === status));
  }

  processAlreadyDonePlaybook = (playbook) => {

    if (! playbook.playId) {
      // When it is a non-playbook action, instead of retrieving logs and events, just
      // set the status according to what was saved in the progress file
      if (playbook.status === STATUS.COMPLETE) {
        this.playbookStopped(playbook.name);
      } else if (playbook.status === STATUS.FAILED) {
        this.playbookError(playbook.name);
      }

      return;
    }

    // go get logs
    fetchJson('/api/v2/plays/' + playbook.playId + '/log')
      .then(response => {
        const message = response.trimRight('\n');
        this.logsReceived = List(message);
        this.setState((prevState) => {
          return {displayedLogs: prevState.displayedLogs.concat(this.logsReceived)}; });
      })
      .catch((error) => {
        this.showErrorMessage(translate('deploy.get.log.error',
          playbook.name + '.yml', playbook.playId, error.toString()));
        this.props.updatePageStatus(STATUS.FAILED);
      });

    // update the UI status
    fetchJson('/api/v2/plays/' + playbook.playId + '/events')
      .then(response => {
        for (let evt of response) {
          if (evt.event === 'playbook-stop')
            this.playbookStopped(evt.playbook);
          else if (evt.event === 'playbook-start')
            this.playbookStarted(evt.playbook);
          else if (evt.event === 'playbook-error')
            this.playbookError(evt.playbook);
        }
      })
      .catch((error) => {
        this.showErrorMessage(translate('deploy.get.event.error',
          playbook.name + '.yml', playbook.playId, error.toString()));
        this.props.updatePageStatus(STATUS.FAILED);
      });
  }

  processPlaybooks = () => {
    const inProgressPlaybooks = this.getPlaybooksWithStatus(STATUS.IN_PROGRESS);
    const completePlaybooks = this.getPlaybooksWithStatus(STATUS.COMPLETE);
    const failedPlaybooks = this.getPlaybooksWithStatus(STATUS.FAILED);

    // Retrieve the logs and events for any completed playbooks
    for (let book of completePlaybooks) {
      this.processAlreadyDonePlaybook(book);
    }

    // if have last recorded in progress
    if (inProgressPlaybooks.length) {
      // There is a playbook in progress

      const progressPlay = inProgressPlaybooks[0];  // there will only be one playbook in progress
      // if have completes, process completed logs first
      //check the in progress one
      fetchJson('/api/v2/plays/' + progressPlay.playId, {
        // Note: Use no-cache in order to get an up-to-date response
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      })
        .then(response => {
          if ('endTime' in response || response['killed']) {
            let status = (response['code'] == 0 ? STATUS.COMPLETE : STATUS.FAILED);
            // update logs
            this.processAlreadyDonePlaybook(progressPlay);
            // update global playbookStatus
            this.updateGlobalPlaybookStatus(progressPlay.name, progressPlay.playId, status);

            if (status === STATUS.COMPLETE) {
              const nextPlaybook = this.findNextPlaybook(progressPlay.name);
              if(nextPlaybook) {
                this.launchPlaybook(nextPlaybook);
              }
              else {
                this.props.updatePageStatus(STATUS.COMPLETE);
              }
            }
            else { //failed
              this.props.updatePageStatus(STATUS.FAILED);
            }
          }
          else {
            // The play is still in progress
            this.props.updatePageStatus(STATUS.IN_PROGRESS);
            this.monitorSocket(progressPlay.name, progressPlay.playId);
          }
        })
        .catch((error) => {
          this.showErrorMessage(translate('deploy.fail.check.playbook',
            progressPlay.name + '.yml', progressPlay.playId, error.message));
          this.props.updatePageStatus(STATUS.FAILED);
        });

    } else if (failedPlaybooks.length > 0) {
      // Append the failed playbook logs
      for (let book of failedPlaybooks) {
        this.processAlreadyDonePlaybook(book);
      }

      // update the status without launching any other playbooks
      this.props.updatePageStatus(STATUS.FAILED);

    } else {
      // No playbooks running or failed, so either launch the next one or finish up

      const lastCompleted = completePlaybooks.pop();  // returns undefined if none have completed

      // if have lastCompleted, use last completed playbook name otherwise
      // leave it undefined
      let lastCompletedName = lastCompleted ? lastCompleted.name : undefined;
      const nextPlaybook = this.findNextPlaybook(lastCompletedName);
      if (nextPlaybook) {
        // launch the next playbook if there is more to run
        this.launchPlaybook(nextPlaybook);
      }
      else {
        // No more playbooks to run.  Consider this page to be complete
        this.props.updatePageStatus(STATUS.COMPLETE);
      }
    }
  }

  launchPlaybook = (playbook) => {

    // Seed the payload with defaults.  Many playbooks, including the config processor run, wipe disks,
    // various service updates, plus *any* playbooks that call those, will stop and prompt for values, effectively
    // causing the UI to hang.  Send extra-vars which avoid this to *all* playbooks.  Note that sending
    // extra vars to playbooks that do not use them has no ill effects.
    let payload = { 'extra-vars': {automate: 'true', encrypt: '', rekey: ''}};

    for (const override of [this.props.payload, playbook.payload]) {
      if (override) {
        for (const [key, value] of Object.entries(override)) {
          if (key == 'extra-vars') {
            // Merge extra vars with defaults
            Object.assign(payload['extra-vars'], value);
          } else {
            // override all other properties
            payload[key] = value;
          }
        }
      }
    }

    if (playbook.action) {
      // Handle non-playbook actions, i.e. function calls
      this.updateGlobalPlaybookStatus(playbook.name, 0, STATUS.IN_PROGRESS);
      this.props.updatePageStatus(STATUS.IN_PROGRESS);

      playbook.action(this.logMessage)
        .then(response => {
          this.playbookStopped(playbook.name, playbook.name, 0);

          const nextPlaybook = this.findNextPlaybook(playbook.name);
          if (nextPlaybook) {
            this.launchPlaybook(nextPlaybook);
          }
          else {
            this.props.updatePageStatus(STATUS.COMPLETE); //set the caller page status
          }
        })
        .catch((error) => {
          this.playbookError(playbook.name, playbook.name, 0, error);
        });

    } else {
      const playbookName = this.getPlaybookName(playbook);
      postJson('/api/v2/playbooks/' + playbookName, payload)
        .then(response => {
          const playId = response['id'];
          this.monitorSocket(playbookName, playId);
          // update local this.globalPlaybookStatus and also update global state playbookSatus
          this.updateGlobalPlaybookStatus(playbookName, playId, STATUS.IN_PROGRESS);
          // overall status for caller page
          this.props.updatePageStatus(STATUS.IN_PROGRESS);
        })
        .catch((error) => {
          // overall status for caller, if failed, just stop
          this.props.updatePageStatus(STATUS.FAILED);
          // update local this.globalPlaybookStatus and also update global state playbookSatus
          this.updateGlobalPlaybookStatus(playbookName, '', STATUS.FAILED);
          this.showErrorMessage(translate('deploy.fail.launch.playbook', playbookName + '.yml', error.message));
        });
    }
  }

  // TODO: Handle this when it is running a non-playbook action
  cancelRunningPlaybook = () => {

    this.setState({showConfirmationDlg: false});
    const running = this.getPlaybooksWithStatus(STATUS.IN_PROGRESS)[0];
    if (running) {
      deleteJson('/api/v2/plays/' + running.playId)
        .then(response => {
          if (this.props.modalMode) {
            this.logMessage('Playbook cancelled.');
          } else {
            // update local this.globalPlaybookStatus and also update global state playbookSatus
            this.updateGlobalPlaybookStatus(running.name, running.playId, STATUS.FAILED);
            // overall status for caller page
            this.props.updatePageStatus(STATUS.FAILED);
            this.showErrorMessage(translate('deploy.cancel.message'));
          }
        })
        .catch((error) => {
          // overall status for caller, if failed, just stop
          this.props.updatePageStatus(STATUS.FAILED);
        });
    }
  }

  showErrorMessage = (msg) => {
    this.setState((prevState) => {
      return {errorMsg : prevState.errorMsg.concat(msg + '\n')};
    });
  }

  renderCancelButton() {
    if (!this.state.errorMsg &&
      this.getPlaybooksWithStatus(STATUS.IN_PROGRESS).length > 0 &&
      this.getPlaybooksWithStatus(STATUS.FAILED).length == 0) {

      return (
        <ActionButton
          displayLabel={translate('cancel')}
          clickAction={() => this.setState({
            showConfirmationDlg: true})
          } />
      );
    }
  }

  renderLogViewer() {
    const logButtonLabel = translate('progress.hide.log');
    return (
      <LogViewer contents={this.state.displayedLogs}>
        <ActionButton type='link'
          displayLabel={logButtonLabel}
          clickAction={() => this.setState((prev) => { return {'showLog': !prev.showLog}; }) } />
      </LogViewer>
    );
  }

  renderModal() {
    if (this.state.errorMsg) {
      this.logMessage(this.state.errorMsg);
      this.setState({errorMsg: '', closeStatusPlaybookModal: true});
    }
    return (
      <StatusModal serviceName={this.props.serviceName}
        onHide={this.props.onHide} contents={this.state.displayedLogs}
        closeModal={this.state.closeStatusPlaybookModal} cancelPlaybook={this.cancelRunningPlaybook}
        playbooksComplete={this.state.playbooksComplete}/>
    );
  }

  render() {
    if (this.props.modalMode) {
      return (
        <div>
          {this.renderModal()}
        </div>
      );
    } else {
      const errorDiv = (<div>{translate('progress.failure')}<br/>
        <pre className='log'>{this.state.errorMsg}</pre></div>);

      return (
        <div className='playbook-progress'>
          <div className='progress-body'>
            <div className='row'>
              <div className='col-4'>
                <ul>{this.getProgress()}</ul>
                <div>
                  {this.renderCancelButton()}
                  <If condition={!this.state.errorMsg && !this.state.showLog}>
                    <ActionButton type='link'
                      displayLabel={translate('progress.show.log')}
                      clickAction={() => this.setState((prev) => { return {'showLog': !prev.showLog}; }) } />
                  </If>
                  <If condition={this.state.showConfirmationDlg}>
                    <YesNoModal
                      title={translate('warning')}
                      yesAction={this.cancelRunningPlaybook}
                      noAction={() => this.setState({showConfirmationDlg: false})}>
                      {translate('deploy.cancel.confirm')}
                    </YesNoModal>
                  </If>
                </div>
              </div>
              <div className='col-8'>
                {this.state.errorMsg ? errorDiv : this.state.showLog && this.renderLogViewer()}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  componentDidMount() {
    this.globalPlaybookStatus = this.getGlobalPlaybookStatus();
    this.processPlaybooks();
  }

  componentWillUnmount() {
    // Disconnect from the socket to avoid receiving any further log messages
    if (this.socket) {
      this.socket.disconnect();
    }

    // Cancel any pending setState, which otherwise may generate reactjs errors about
    // calling setState on an unmounted component
    this.updateState.cancel();
  }

  /**
   * callback for when a playbook starts, the UI component will track which
   * playbooks out of the needed set have started/finished to show status
   * to the user
   * @param {String} the playbook filename
   */
  playbookStarted = (stepPlaybook) => {
    this.setState((prevState) => {
      return {'playbooksStarted': prevState.playbooksStarted.concat(stepPlaybook)};
    });
  }

  /**
   * callback for when a playbook finishes, the UI component will track which
   * playbooks out of the needed set have started/finished to show status
   * to the user
   *
   * @param stepPlaybook
   * @param playbookName
   * @param playId
   */
  playbookStopped = (stepPlaybook, playbookName, playId) => {
    let complete = false;

    this.setState((prevState) => {
      const completedPlaybooks = prevState.playbooksComplete.concat(stepPlaybook);
      complete = completedPlaybooks.includes(playbookName + '.yml') ||
        completedPlaybooks.includes(playbookName);
      return {'playbooksComplete': completedPlaybooks};
    });
    if (complete && playbookName) {
      this.updateGlobalPlaybookStatus(playbookName, playId, STATUS.COMPLETE);

      // playbook completes, check if it is in the last step
      // handle the case when can not receive end event for playbook
      let lastStepPlaybooks = this.props.steps[this.props.steps.length - 1].playbooks;
      if(lastStepPlaybooks.indexOf(playbookName + '.yml') !== -1) {
        sleep(2000).then(() => {this.processEndMonitorPlaybook(playbookName);});
      }
    }
  }

  /**
   * callback for when a playbook finishes, the UI component will track which
   * playbooks out of the needed set have started/finished to show status
   * to the user
   *
   * @param stepPlaybook
   * @param playbookName
   * @param playId
   */
  playbookError = (stepPlaybook, playbookName, playId, error) => {
    let failed = false;

    this.setState((prevState) => {
      const errorPlaybooks = prevState.playbooksError.concat(stepPlaybook);
      failed = errorPlaybooks.includes(playbookName + '.yml') ||
        errorPlaybooks.includes(playbookName);
      return {'playbooksError': errorPlaybooks};
    });

    if (failed) {
      if(playbookName) {
        this.updateGlobalPlaybookStatus(playbookName, playId, STATUS.FAILED);
      }
      // if failed update caller page immediately
      this.props.updatePageStatus(STATUS.FAILED, error);
    }
  }

  logMessage = (message, notAppendNewLine) => {
    // if have not specified not to append new line break
    // then if the message does not contain a new line
    // break append new line break
    if (!notAppendNewLine) {
      var hasNewLine = /\r|\n/.exec(message);
      if (!hasNewLine) {
        message = '\n' + message + '\n';
      }
    }
    this.logsReceived = this.logsReceived.push(message);
    this.updateState(this.logsReceived);
  }

  // Update the state.  Uses lodash.debounce to avoid getting inunadated by fast logs,
  // by avoiding repeated calls within a short amount of time
  updateState = debounce((data) => {
    this.setState({displayedLogs: data});
  }, 100)
}

export { PlaybookProgress };
