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
import './Deployer.css';
import InstallWizard from './InstallWizard';
import { pages } from './utils/WizardDefaults.js';
import { HashRouter as Router, Switch } from 'react-router-dom';
import Route from 'react-router-dom/Route';
import { translate } from './localization/localize.js';

class Deployer extends Component {
  render() {
    //TODO - wrap the InstallWizard with a component that varies the wizard by task
    // and has a selection or menuing system and the login page
    return (
      <Router>
        <Switch>
          <Route path='/login' render={() => {
            return(
                <div>This will be the login component</div>
            )}
          } />

          <Route path='/about' render={() => {
              return(
                <div>{translate('openstack.cloud.deployer.title.version')}</div>
              )}
          } />

          <Route path='/' render={() => {
            return(
              <InstallWizard pages={pages} />
            )}
          } />

        </Switch>
      </Router>
    );
  }
}

export default Deployer;
