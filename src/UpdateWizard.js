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
import './styles/deployer.less';
import { STATUS } from './utils/constants.js';
import WizardProgress from './components/WizardProgress';
import { Map } from 'immutable';
import InstallWizard from  './InstallWizard.js';
import { isCloudConfigEncrypted } from './utils/RestUtils.js';

/**
 * The UpdateWizard component is a container for loading update pages which will launch
 * processes pages. It also managing ordering the update process pages and tracking
 * process state across them.
 * TODO
 * this is the first step to move update related processes out, more refactoring
 * will come
 */
class UpdateWizard extends InstallWizard {

  constructor(props) {
    super(props);

    this.state = {
      // The current step in the wizard
      currentStep: undefined,

      // The status and name of each step in the wizard.
      // when update, the steps are unknown to start with until user
      // startUpdate process. steps are used to record step name and step progress
      // steps are persisted
      steps: undefined,

      // the current page where user is at hopefully, in the future it can be
      // used to return to the page where user gets session timeout
      currentMenuName: props.menuName,

      // the menu name that has process in progress, this can be different from
      // currentMenuName
      processMenuName: undefined,

      // the operation name that is process in progress
      processOperation: undefined,

      // when update, the pages are dynamically assembled based on steps when
      // user startUpdate process. pages include names and page components
      // which are needed when render html pages
      // pages are not persisted
      pages: undefined,

      // operationProps record all the bits that need to run to update
      // TODO how to deal with install password
      operationProps: undefined,

      // Indicate if the cloud configuration isEncrypted. If it is true,
      // it will force user to input encryptKey.
      isEncrypted: false,
      // encryptKey from user input if isEncrypted is true otherwise it is empty.
      encryptKey: ''
    };

    // Indicate which of the above state variables are passed to wizard pages and can be set by them
    // Includes the globalStateVars from InstallWizard
    // ['playbookStatus', 'model', 'connectionInfo', 'deployConfig', 'wizardLoading', 'wizardLoadingErrors'];
    this.globalStateVars =
      this.globalStateVars.concat([
        'currentMenuName', 'processMenuName', 'processOperation', 'operationProps', 'safeMode', 'expandedGroup',
        'encryptKey', 'isEncrypted'
      ]);

    // Indicate which of the state variables will be persisted to, and loaded from, the progress API
    // Includes the persistedStateVars from InstallWizard
    // ['currentStep', 'steps', 'playbookStatus', 'connectionInfo', 'deployConfig']
    this.persistedStateVars =
      this.persistedStateVars.concat([
        'currentMenuName', 'processMenuName', 'processOperation', 'operationProps', 'safeMode'
      ]);
  }

  getIsEncrypted = async () => {
    let isEncrypted = await isCloudConfigEncrypted();
    this.setState({isEncrypted : isEncrypted});
  }

  // deal with day2 update when refresh
  loadProgress = (responseData) => {
    // TODO if refresh with default url or logout due to timeout
    // need to find a way to set the menu from navigation

    // When the update process starts, it records currentMenuName, steps
    // and other items related to the update progress in the progress.json.
    // When user does discovery, it records currentMenuName and connectionInfo
    // into the progress.json

    // If currentMenuName is present, it is related to day2UI
    // adding the check to prevent user has leftover installation
    // data
    if(responseData && responseData.currentMenuName) {
      let updateStates = responseData;

      // If steps is present, it indicates update process is still going,
      // existing processMenuName is from responseData
      // load the on going steps when the proccessMenuName matches to the menuName
      // passed in
      if(responseData.steps &&
        responseData.processMenuName === this.props.menuName) {
        let steps = responseData.steps;
        let pages =
          this.getPages(steps);
        updateStates.pages = pages;
      }
      // If steps is not present, there is no update process is going,
      // record currentMenuName where user navigates to, for example,
      // /servers/server-summary or /servers/add-server
      else {
        updateStates.currentMenuName = this.props.menuName;
      }
      this.setState(updateStates, this.persistState);
    }
  }

  setProgressLoadingError = (msg) => {
    this.setState(prev => {
      if (prev.wizardLoadingErrors) {
        return {wizardLoadingErrors: prev.wizardLoadingErrors.set('progressError', msg)};
      }
      else {
        return {wizardLoadingErrors: Map({'progressError': msg})};
      }
    });
  }

  /**
   * get the actual pages based on steps and all the possible pages in pageSet passed in
   * @param steps         the steps for the process.
   * @returns pages       assembled page components based on steps and this.props.pageSet
   */
  getPages = (steps) => {
    let pages = undefined;
    if(this.props.pageSet && steps?.length > 0) {
      pages = steps.map(step => {
        return {
          name: step.name,
          component: this.props.pageSet[step.name]
        };
      });
    }
    return pages;
  }

  /**
   * creates a react component representing the current step in the wizard based on the overall set of steps
   * and the current index
   */
  buildElement = () => {

    let props = {};

    // use dynamic pages
    let pages = this.state.pages;

    // when have pages, check for additional steps
    if(pages && this.state.currentStep !== undefined && this.state.currentStep < (pages.length - 1)) {
      props.next = this.stepForward;
    }

    // if it is update and have pages, update last page with complete page to have a
    // close button
    if(pages && this.state.currentStep !== undefined &&
      this.state.currentStep === (pages.length -1)) {
      props.close = true;
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

    props.startUpdateProcess = this.startUpdate;
    props.closeUpdateProcess = this.closeUpdate;
    props.cancelUpdateProcess = this.cancelUpdate;
    props.retryUpdateProcess = this.retryUpdate;

    // if have on going process and the processMenuName matches the menuName passed in
    // load the on going step based on the dynamic pages
    if(this.state.currentStep !== undefined && this.state.processMenuName === this.props.menuName) {
      return React.createElement(pages[this.state.currentStep].component, props);
    }
    else { // load the landing page
      return React.createElement(this.props.menuComponent, props);
    }
  }

  // this uses the infrastructure of the exiting logic to
  // dynamically render the progress pages on the fly
  // this is triggered when start the update processes
  // for example click replace button on Replace server modal
  startUpdate = (operation, pages, extraOpProps) => {
    //build steps dynamically
    let steps = pages.map(page => { return {'name': page.name}; });
    //get the first one start
    steps[0].stepProgress = STATUS.IN_PROGRESS;

    this.setState(prev => ({
      operationProps: Object.assign({}, prev.operationProps, extraOpProps),
      currentStep: 0,
      pages: pages,
      steps: steps,
      processMenuName: this.props.menuName,
      processOperation: operation,
      playbookStatus: undefined
    }),
    this.persistState);
  }

  // successfully updated, close to go back to the page where
  // the update process is originated
  closeUpdate = () => {
    this.setState({
      steps: undefined,
      currentStep : undefined,
      processMenuName: undefined,
      processOperation: undefined,
      playbookStatus: undefined,
      operationProps: undefined,
      pages: undefined
    }, this.persistState);
  }

  // has something wrong with update, cancel to go back to
  // the page where the update process is originated
  cancelUpdate = () => {
    this.closeUpdate();
  }

  retryUpdate = async() => {
    // Remove the playbook status 3 and playId
    if (this.state.playbookStatus) {
      let playStatus = this.state.playbookStatus.slice();
      // Should have just one failure since deploy stops
      // when error occurs
      playStatus.forEach((play) => {
        if (play.status === STATUS.FAILED) {
          play.playId = '';
          play.status = '';
        }
      });
      await  this.updateGlobalState('playbookStatus', playStatus);
      // Refresh the current page
      window.location.reload();
    }
  }

  renderProgressBar() {
    if(this.state.processMenuName === this.props.menuName &&
         this.state.currentStep !== undefined  &&
         this.state.steps?.length > 1) {
      return (<WizardProgress steps={this.state.steps}/>);
    }
  }

  renderTitle() {
    return null;
  }

  renderLoadingMask() {
    return null;
  }
}

export default UpdateWizard;
