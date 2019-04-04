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
import React, { Component } from 'react';
import './styles/deployer.less';
import { translate, translateModelName } from './localization/localize.js';
import { STATUS } from './utils/constants.js';
import WizardProgress from './components/WizardProgress';
import { LoadingMask } from './components/LoadingMask.js';
import { Map, fromJS } from 'immutable';
import { fetchJson, postJson, deleteJson } from './utils/RestUtils.js';

/**
 * The InstallWizard component is a container for ordering the install pages and tracking
 * state across them.
 */
class InstallWizard extends Component {

  constructor(props) {
    super(props);

    this.state = {
      // The current step in the wizard
      currentStep: undefined,

      // The status and name of each step in the wizard.  If a user has an error in a step
      // and then returns to the previous step, this array will track the fact that the
      // later step had an error even though it is no longer the current step.
      //
      // when install, the steps are derived from the static pages
      steps: props.pages,

      // The remaining values capture the state of the user's progress through the wizard.  A primary
      // function of these values is so that if the user were to close the browser and then re-open it,
      // then the session should look nearly identical, including:
      // - the user should be on the same step in the wizard
      // - values entered by the user that are not stored anywhere else.  This includes values
      //   like credentials for remote systems, and so on.  Information that is already stored
      //   in the model, such as its name or which servers are assigned to which roles, should
      //   not be duplicated here since it is already being persisted in the model
      // playbookStatus structure example is like
      // [{
      //  name: 'installui-os-provision', status: '', playId: ''
      // }, {
      //  name: 'installui-pre-deployment', status: '', playId: ''
      // }, {
      //  name: 'installui-wipe-and-site', status: '', playId: ''
      // }]
      //
      playbookStatus: undefined,
      model: Map(),           // immutable model
      connectionInfo: undefined, // config info for external discovery services
      deployConfig: undefined, // cloud deployment configuration

      // errors during wizard loading
      wizardLoadingErrors: undefined,
      // indicate wizard is loading
      wizardLoading: undefined
    };

    // Indicate which of the above state variables are passed to wizard pages and can be set by them
    this.globalStateVars = [
      'model', 'playbookStatus', 'connectionInfo', 'deployConfig',
      'wizardLoading', 'wizardLoadingErrors', 'usefulLinks'
    ];

    // Indicate which of the state variables will be persisted to, and loaded from, the progress API
    this.persistedStateVars = [
      'currentStep', 'steps', 'playbookStatus', 'connectionInfo',
      'deployConfig', 'usefulLinks'
    ];
  }

  loadProgress = (responseData, forcedReset) => {
    if (! forcedReset && responseData.steps &&
        this.areStepsInOrder(responseData.steps, this.props.pages)) {
      this.setState(responseData);
    }
    else {
      // Set the currentStep to 0 and update its stepProgress to inprogress
      this.setState((prevState) => {
        var newSteps = prevState.steps.slice();
        newSteps.splice(0, 1, {
          name: prevState.steps[0].name,
          stepProgress: STATUS.IN_PROGRESS
        });

        return {
          currentStep: 0,
          steps: newSteps
        };
      }, this.persistState);
    }
  }

  setProgressLoadingError = (msg) => {
    this.setState({currentStep: 0}, this.persistState);
  }

  componentDidMount = () => {
    // Note: if no progress data can be found, responseData is an empty string
    const forcedReset =
      this.IS_UPDATE ? false : window.location.search.indexOf('reset=true') !== -1;

    this.setState({wizardLoading: true});
    // Load the current state information from the backend
    fetchJson('/api/v2/model')
      .then(responseData => {
        this.setState({'model': fromJS(responseData)});
      })
      .catch((error) => {
        const ErrorMsg = JSON.stringify(error);
        // wizardLoadingErrors are only handled in update at this point
        this.setState({wizardLoadingErrors: Map({modelError: ErrorMsg})});
        console.log('Unable to retrieve saved model . ' + ErrorMsg);// eslint-disable-line no-console
      })
      .then(::this.getIsEncrypted)
      .then(() => fetchJson('/api/v2/progress')
        .then((responseData) => {
          this.loadProgress(responseData, forcedReset);
          this.setState({wizardLoading: false});
        })
        .catch((error) => {
          const errorMsg = JSON.stringify(error);
          this.setProgressLoadingError(errorMsg);
          this.setState({wizardLoading: false});
          console.log(errorMsg); // eslint-disable-line no-console
        })
      )
      .then(() => {
        if (forcedReset) {
          return deleteJson('/api/v2/server?source=sm,ov,manual');
        }
      });
  }

  getIsEncrypted = async () => {
    return; // do nothing in day0
  }

  /**
   * Checks two arrays of step objects against each other to make sure they're ordered the same
   * @param currentStateSteps
   * @param expectedOrder
   * @returns {boolean} true if the order matches, false otherwise
   */
  areStepsInOrder(currentStateSteps, expectedOrder) {

    if(currentStateSteps.length !== expectedOrder.length) {
      return false;
    }

    for(var i = 0; i < currentStateSteps.length; i++) {
      if(currentStateSteps[i].name !== expectedOrder[i].name) {
        return false;
      }
    }
    return true;
  }

  /**
   * creates a react component representing the current step in the wizard based on the overall set of steps
   * and the current index
   */
  buildElement = () => {
    if (this.state.currentStep === undefined) {
      return (<div className="loading-message">{translate('loading.pleasewait')}</div>);
    }

    let props = {};

    // check if first element
    if(this.state.currentStep !== 0) {
      props.back = this.stepBack;
    }

    // use dynamic pages when update, use static pages when install
    let pages =  this.props.pages;

    // when have pages, check for additional steps
    if(this.state.currentStep < (this.props.pages.length - 1)) {
      props.next = this.stepForward;
    }

    //Pass all global state vars as properties
    for (let v of this.globalStateVars) {
      props[v] = this.state[v];
    }
    //Pass the update function as a property
    props.updateGlobalState = this.updateGlobalState;

    //Pass functions to force a model save and reload
    props.saveModel = this.saveModel;
    props.loadModel = this.loadModel;

    return React.createElement(pages[this.state.currentStep].component, props);
  }


  /**
   * Writes the current install state out to persistent storage through an api in the shim
   * layer of the UI.
   */
  persistState = () => {
    let toPersist = {};
    for (let v of this.persistedStateVars) {
      toPersist[v] = this.state[v];
    }

    return postJson('/api/v2/progress', toPersist);
  }

  /**
   * Move the wizard forward one step unless there is an error
   * @param {boolean} isError - if an error has occurred, do not advance to the next step
   */
  stepForward = (isError) => {
    //TODO - update state setting logic to accept error states
    var steps = this.state.steps, stateUpdates = {};
    if(isError) {
      steps[this.state.currentStep].stepProgress = STATUS.FAILED;
    } else {
      steps[this.state.currentStep].stepProgress = STATUS.COMPLETE;

      //verify that there is a next page
      if (steps[(this.state.currentStep + 1)]) {
        //set the last step to complete if there's no error at the step before last
        if (this.state.currentStep === steps.length - 2) {
          steps[this.state.currentStep + 1].stepProgress = STATUS.COMPLETE;
        } else {
          //update the next step to in-progress
          steps[(this.state.currentStep + 1)].stepProgress = STATUS.IN_PROGRESS;
        }

        //prepared to advance to the next page
        stateUpdates.currentStep = this.state.currentStep + 1;
      }
    }

    stateUpdates.steps = steps;
    //setState is asynchronous, call the persistState function as a callback
    this.setState(stateUpdates, this.persistState);
  }

  /**
   * Go back a step in the wizard
   * @param {boolean} isError - whether the current step has an error
   */
  stepBack = (isError) => {
    //TODO - update state setting logic to accept error states
    var steps = this.state.steps, stateUpdates = {};
    if(isError) {
      steps[this.state.currentStep].stepProgress = STATUS.FAILED;
    } else {
      steps[this.state.currentStep].stepProgress = STATUS.NOT_STARTED;
    }

    //verify that there is a previous page
    if(steps[(this.state.currentStep - 1)]) {
      //update previous step to inprogress
      steps[(this.state.currentStep - 1)].stepProgress = STATUS.IN_PROGRESS;

      //prepare to go back a page
      stateUpdates.currentStep = this.state.currentStep - 1;
    }
    stateUpdates.steps = steps;

    //setState is asynchronous, call the persistState function as a callback
    this.setState(stateUpdates, this.persistState);
  }

  /**
   * Set the wizard to a specific step in the workflow, can only be used to go to previous steps and not forward
   * @param {number} the step number to switch the wizard to
   */
  stepTo = (stepNumber) => {
    var steps = this.state.steps, stateUpdates = {};
    // sanity check the stepNumber, it must be greater than 0 and less than the current step
    if(stepNumber >= 0 && this.state.currentStep > stepNumber) {
      let i = this.state.currentStep;
      while(i > stepNumber) {
        steps[i].stepProgress = STATUS.NOT_STARTED;
        i--;
      }

      steps[stepNumber].stepProgress = STATUS.IN_PROGRESS;
      stateUpdates.currentStep = stepNumber;
      stateUpdates.steps = steps;
      this.setState(stateUpdates, this.persistState);
    }
  }

  // Return a promise that updates the global state and persist any other progress values
  updateGlobalState = (key, value) => {

    return new Promise((resolve, reject) => {

      let modelChanged = false;

      this.setState(prevState => {
        modelChanged = (key == 'model' && value !== prevState.model);
        let updatedState = {};
        updatedState[key] = value;
        return updatedState;
      }, () => {
        if (modelChanged) {
          // save the model
          this.saveModel().then(resolve, reject);
        } else if (this.persistedStateVars.includes(key)) {
          // save the other state variables
          this.persistState().then(resolve, reject);
        } else {
          // don't save it anywhere
          resolve(true);
        }
      });
    });
  }

  // Pages within the installer may request that the model be forceably loaded
  // from disk, espcially when a change is made to directly to the model files
  // to the model.  Returns a promise
  loadModel = () => {
    // If there is a pending promise to fetch the model return that promise.
    if(!this.fetchModelPromise) {
      this.fetchModelPromise = new Promise((resolve, reject) => {
        fetchJson('/api/v2/model')
          .then(responseData => {
            this.setState({'model': fromJS(responseData)}, () => {
              this.fetchModelPromise = undefined;
              resolve();
            });
          })
          .catch((error) => {
            console.log('Unable to retrieve saved model');// eslint-disable-line no-console
            this.fetchModelPromise = undefined;
            reject(error);
          });
      });
    }
    return this.fetchModelPromise;
  }

  // Pages within the installer may request that the model be saved to disk,
  // which is especially important when some significant change has been made
  // to the model.  Returns a promise
  saveModel = () => postJson('/api/v2/model', this.state.model);

  renderTitle() {
    return (
      <div className='top-line'>
        <h1>{translate('openstack.cloud.deployer.title')}</h1>
        <If condition={this.state.currentStep >= 2 && this.state.model.get('name')}>
          <h3 className='right-corner'>{translateModelName(this.state.model.get('name'))}</h3>
        </If>
      </div>
    );
  }

  renderProgressBar() {
    return (<WizardProgress steps={this.state.steps}/>);
  }

  renderLoadingMask() {
    return (
      <LoadingMask show={this.state.currentStep === undefined}></LoadingMask>
    );
  }

  /**
   * boilerplate ReactJS render function
   */
  render() {
    const progressBar = this.renderProgressBar();

    return (
      <div className={progressBar ? 'has-progress-bar' : ''}>
        <div className='wizard-header'>
          {this.renderTitle()}
          {progressBar}
        </div>
        <div className='wizard-content-container'>
          {this.renderLoadingMask()}
          {this.buildElement()}
        </div>
      </div>
    );
  }
}

export default InstallWizard;
