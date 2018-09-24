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
      <ConfirmModal show={this.props.showModal} onHide={this.props.onHide} className='status-modal'
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

  findNextPlaybook = (lastCompletedPlaybookName) => {
    // Find the next playbook in sequence after the given one.  Note that if the completed
    // playbook is not found, indexOf() will return -1, so next will be 0 (the first playbook)
    let thePlaybooks = this.props.playbooks;
    if (this.props.isUpdateMode) {
      thePlaybooks = this.props.playbooks.map(playbook => playbook.name);
    }
    const next = thePlaybooks.indexOf(lastCompletedPlaybookName) + 1;

    if (next < thePlaybooks.length) {
      return thePlaybooks[next];
    }
  }

  processEndMonitorPlaybook = (playbookName) => {
    this.socket.disconnect();
    const thisPlaybook = this.globalPlaybookStatus.find(e => e.name === playbookName);
    // the global playbookStatus should be updated in playbookError or playbookStopped
    if(thisPlaybook && thisPlaybook.status === STATUS.COMPLETE) {
      let nextPlaybookName = this.findNextPlaybook(thisPlaybook.name);
      if (nextPlaybookName) {
        this.launchPlaybook(nextPlaybookName);
      }
      else {
        this.props.updatePageStatus(STATUS.COMPLETE); //set the caller page status
      }
    } else {
      // in case of running only one playbook that has no playbook-stop tag
      if (thisPlaybook && this.globalPlaybookStatus.length === 1 && thisPlaybook.status === STATUS.IN_PROGRESS) {
        this.setState((prevState) => {
          return {'playbooksComplete': prevState.playbooksComplete.concat(playbookName + '.yml')};
        });
      }
    }
  }

  updateGlobalPlaybookStatus = (playbookName, playId, status) => {
    const playbook = this.globalPlaybookStatus.find(e => e.name === playbookName);
    if (playbook) {
      if (playId && playId !== '') {
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
    let thePlaybooks = this.props.playbooks;
    if (this.props.isUpdateMode) {
      thePlaybooks = this.props.playbooks.map(playbook => playbook.name);
    }
    if (!retStatus) {
      retStatus = thePlaybooks.map((playbookName) => {
        return {name: playbookName, status: undefined, playId: undefined};
      });
    }
    else { // have playbook status
      let exitStatus = retStatus.find((play) => thePlaybooks.includes(play.name));
      if (!exitStatus) {
        //need init for this.props.playbooks
        let initPlayStatus =thePlaybooks.map((playbookName) => {
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

    let thePlaybooks = this.props.playbooks;
    if (this.props.isUpdateMode) {
      thePlaybooks = this.props.playbooks.map(playbook => playbook.name);
    }

    return this.globalPlaybookStatus.filter(play =>
      (thePlaybooks.includes(play.name) && play.playId && play.status === status));
  }

  processAlreadyDonePlaybook = (playbook) => {
    // go get logs
    fetchJson('/api/v1/clm/plays/' + playbook.playId + '/log')
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
    fetchJson('/api/v1/clm/plays/' + playbook.playId + '/events')
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
      fetchJson('/api/v1/clm/plays/' + progressPlay.playId, {
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
              let nextPlaybookName = this.findNextPlaybook(progressPlay.name);
              if(nextPlaybookName) {
                this.launchPlaybook(nextPlaybookName);
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
      let nextPlaybookName = this.findNextPlaybook(lastCompletedName);
      if (nextPlaybookName) {
        // launch the next playbook if there is more to run
        this.launchPlaybook(nextPlaybookName);
      }
      else {
        // No more playbooks to run.  Consider this page to be complete
        this.props.updatePageStatus(STATUS.COMPLETE);
      }
    }
  }

  launchPlaybook = (playbookName) => {
    // install
    let payload =  JSON.stringify(this.props.payload || '');

    // update, could have different payload for each playbook
    if (this.props.isUpdateMode) {
      let book = this.props.playbooks.find(playbook => {
        return playbook.name === playbookName;
      });
      // TODO need handle extraVars for day2
      // for now hardcode default
      let temp = {extraVars: {automate: 'true', encrypt: '', rekey: ''}};
      if(book.payload) {
        Object.keys(book.payload).forEach(key => temp[key] = book.payload[key]);
      }
      payload = JSON.stringify(temp);
    }

    postJson('/api/v1/clm/playbooks/' + playbookName, payload)
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

  cancelRunningPlaybook = () => {

    this.setState({showConfirmationDlg: false});
    const running = this.getPlaybooksWithStatus(STATUS.IN_PROGRESS)[0];
    if (running) {
      deleteJson('/api/v1/clm/plays/' + running.playId)
        .then(response => {
          if (this.props.modalMode) {
            this.logMessage(translate('deploy.cancel.message'));
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

  renderShowLogButton() {
    const logButtonLabel = translate('progress.show.log');

    return (
      <ActionButton type='link'
        displayLabel={logButtonLabel}
        clickAction={() => this.setState((prev) => { return {'showLog': !prev.showLog}; }) } />
    );
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
      <StatusModal showModal={this.props.showModal} serviceName={this.props.serviceName}
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
            <div className='col-xs-4'>
              <ul>{this.getProgress()}</ul>
              <div>
                {this.renderCancelButton()}
                {!this.state.errorMsg && !this.state.showLog && this.renderShowLogButton()}
                <YesNoModal show={this.state.showConfirmationDlg}
                  title={translate('warning')}
                  yesAction={this.cancelRunningPlaybook}
                  noAction={() => this.setState({showConfirmationDlg: false})}>
                  {translate('deploy.cancel.confirm')}
                </YesNoModal>
              </div>
            </div>
            <div className='col-xs-8'>
              {this.state.errorMsg ? errorDiv : this.state.showLog && this.renderLogViewer()}
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
      complete = completedPlaybooks.includes(playbookName + '.yml');
      return {'playbooksComplete': completedPlaybooks};
    });
    if (complete && playbookName) {
      this.updateGlobalPlaybookStatus(playbookName, playId, STATUS.COMPLETE);

      // playbook completes, check if it is in the last step
      // handle the case when can not receive end event for playbook
      let lastStepPlaybooks = this.props.steps[this.props.steps.length - 1].playbooks;
      if(lastStepPlaybooks.indexOf(playbookName + '.yml') !== -1) {
        this.processEndMonitorPlaybook(playbookName);
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
  playbookError = (stepPlaybook, playbookName, playId) => {
    let failed = false;

    this.setState((prevState) => {
      const errorPlaybooks = prevState.playbooksError.concat(stepPlaybook);
      failed = errorPlaybooks.includes(playbookName + '.yml');
      return {'playbooksError': errorPlaybooks};
    });

    if (failed) {
      if(playbookName) {
        this.updateGlobalPlaybookStatus(playbookName, playId, STATUS.FAILED);
      }
      // if failed update caller page immediately
      this.props.updatePageStatus(STATUS.FAILED);
    }
  }

  logMessage = (message) => {
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
