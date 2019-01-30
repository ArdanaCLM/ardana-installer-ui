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
import './styles/deployer.less';
import InstallWizard from './InstallWizard';
import NavMenu from './components/NavMenu.js';
import { pages } from './utils/WizardDefaults.js';
import { HashRouter as Router, Switch, Redirect } from 'react-router-dom';
import Route from 'react-router-dom/Route';
import { translate } from './localization/localize.js';
import LoginPage from './pages/Login.js';
import { fetchJson } from './utils/RestUtils.js';
import { getAuthToken } from './utils/Auth.js';
import { routes } from './utils/RouteConfig.js';
import { ErrorBanner } from './components/Messages.js';

class Deployer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSecured: undefined
    };
  }

  async componentDidMount() {
    try {
      let response = await fetchJson('/api/v2/is_secured');
      this.setState({ isSecured: response['isSecured'] });
    } catch(error) {
      console.error(`Could not get \`is_secured\` flag (${error})`); // eslint-disable-line no-console
      this.setState({ isSecuredError: error});
    }
  }

  render() {

    // Decide which path that / should route to depending on whether
    //    the ardana service is running in secured mode and whether
    //    we have a valid auth token

    const search = new URLSearchParams(window.location.search),
      path = window.location.hash.replace('#', '');

    let defaultPath;
    let isInstall = true;

    if(this.state.isSecuredError) {
      return <ErrorBanner message={this.state.isSecuredError.toString?.()} show={true}/>;
    }

    if (this.state.isSecured === undefined) {
      // If the REST call has not yet completed, then show a loading page (briefly)
      defaultPath = (
        <div className="loading-message">{translate('loading.pleasewait')}</div>
      );
    } else if (this.state.isSecured) {
      if (! getAuthToken()) {
        // If a login is required, Redirect to the login page
        defaultPath = <Redirect to='/login'/> ;
        isInstall = false;
      } else {

        // Go to NavMenu unless the url specifically requests the installer
        if (search.get('start')?.startsWith('installer')) {
          defaultPath = <InstallWizard pages={pages}/>;
        } else {
          isInstall = false;
          defaultPath = <>
            <NavMenu routes={routes}/>
            {/* redirect to the default page, when already logged in a blank page is shown otherwise */}
            <If condition={path === '/'}>
              <Redirect to='/services/info'/>
            </If>
          </>;
        }
      }
    } else {
      // Go to installer unless the url specifically requests the menu
      if (search.get('start')?.startsWith('menu')) {
        // If in secured (post-install) mode with a valid auth token, display menu
        defaultPath = <NavMenu routes={routes}/>;
        isInstall = false;
      } else {
        // Initial, unsecured mode.  Display the InstallWizard
        defaultPath = <InstallWizard pages={pages}/>;
      }
    }

    // overwrite default tab title to use branding title
    if(isInstall) {
      document.title = translate('openstack.cloud.deployer.title');
    } else {
      // overwrite default tab title to use branding title
      document.title = translate('day2.product.title');
    }

    return (
      <Router>
        <Switch>
          <Route path='/login' component={LoginPage}/>
          <Route path='/about' render={() => (
            <div>{translate('openstack.cloud.deployer.title.version')}</div>
          )}/>
          <Route path='/' render={() => defaultPath} />

        </Switch>
      </Router>
    );
  }
}

export default Deployer;
