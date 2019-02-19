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
import React, { Component } from 'react';
import { translate } from '../localization/localize.js';
import { fetchJson, postJson } from '../utils/RestUtils.js';
import { setAuthToken, clearAuthToken } from '../utils/Auth.js';
import { navigateTo, wasRedirectedToLogin } from '../utils/RouteUtils.js';
import { ErrorMessage } from '../components/Messages.js';
import { LoadingMask } from '../components/LoadingMask.js';
import { GetSshPassphraseModal } from '../components/Modals.js';

import '../styles/pages/login.less';

class LoginPage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      errorMsg: '',
      showPasswordMask: true,
      showLoadMask: false,
      showSshPassphraseModal: false
    };
  }

  handleUsernameChange = (e, valid, props) => {
    let value = e.target.value;
    this.setState({username: value});
  }

  handlePasswordChange = (e, valid, props) => {
    let value = e.target.value;
    this.setState({password: value});
  }

  navigate = () => {
    const search = new URLSearchParams(window.location.search);
    if (search.get('start')?.startsWith('installer')) {
      navigateTo('/', undefined, search.toString());
    } else {
      navigateTo('/services/info');
    }
  }

  handlePassphrase = () => {
    this.setState({showSshPassphraseModal: false});
    this.navigate();
  }

  handleLogin = (e, valid, props) => {
    e.preventDefault();

    clearAuthToken();
    const payload = {
      'username': this.state.username,
      'password': this.state.password
    };

    this.setState({showLoadMask: true});

    postJson('/api/v2/login', payload, undefined, false)
      .then(response => {

        // Capture the returned token and use it for subsequent calls. If it
        // turns out to have insufficient privileges, it will be removed
        const expires = new Date(response.expires);
        setAuthToken(response.token, expires);

        // Determine whether a password is requires to run playbooks
        return fetchJson('/api/v2/sshagent/requires_password');
      })
      .then(response => {
        this.setState({show: false, errorMsg: '', showLoadMask: false});
        if (response.requires_password) {
          this.setState({showSshPassphraseModal: true});
        } else {
          this.navigate();
        }
      })
      .catch((error) => {
        // Invalidate the token if it was saved above
        clearAuthToken();
        this.setState({showLoadMask: false});

        if (error.status == 401) {
          this.setState({errorMsg: translate('login.invalid')});
        } else if (error.status == 403) {
          this.setState({errorMsg: translate('login.unprivileged')});
        } else if (error.status == 503) {
          this.setState({errorMsg: translate('login.keystone.error')});
        } else {
          this.setState({errorMsg: translate('login.error', error)});
        }
      });
  }

  toggleShowHidePassword = (e) => {
    let passwordField = e.target.previousSibling;
    passwordField.type = this.state.showPasswordMask ? 'text' : 'password';
    this.setState((prevState) => {return {showPasswordMask: !prevState.showPasswordMask};});
  }

  renderErrorMessage() {
    if (this.state.errorMsg) {
      return (
        <div className='notification-message-container login'>
          <ErrorMessage
            closeAction={() => this.setState({errorMsg: ''})}
            message={this.state.errorMsg}>
          </ErrorMessage>
        </div>
      );
    }
  }

  render() {
    return (
      <div className='login-page'>
        {this.renderErrorMessage()}
        <LoadingMask show={this.state.showLoadMask}></LoadingMask>
        <div className='top-bar-container'>
          <div className='top-bar'>
            <div className='top-bar-header'>{translate('day2.product.name')}</div>
          </div>
        </div>
        <div className='login-body'>
          <div className='content-container'>
            <div className='row'>
              <div className='content-container-left col-sm-6 hidden-xs'>
                <div className='upper-left line-break'>{translate('day2.product.name')}</div>
                <div className='lower-left'>{translate('day2.product.description')}</div>
              </div>
              <div className='content-right col-sm-4 col-sm-offset-1'>
                <div className='header'>{translate('login.header')}</div>
                <form onSubmit={this.handleLogin}>
                  <input type='text' className='rounded-corner' required autoFocus
                    autoComplete='username' value={this.state.username}
                    placeholder={translate('login.placeholder.username')} onChange={this.handleUsernameChange}/>
                  <div className='password-container'>
                    <input type='password' className='rounded-corner password' required
                      autoComplete='current-password' value={this.state.password}
                      placeholder={translate('login.placeholder.password')} onChange={this.handlePasswordChange}/>
                    <i className='material-icons password-icon' onClick={this.toggleShowHidePassword}>
                      {this.state.showPasswordMask ? 'visibility': 'visibility_off'}
                    </i>
                  </div>
                  <button className="btn rounded-corner" type="submit" onClick={this.handleLogin}>
                    {translate('login')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
        <If condition={this.state.showSshPassphraseModal}>
          <GetSshPassphraseModal doneAction={this.handlePassphrase} />
        </If>
      </div>
    );
  }
}

export default LoginPage;
