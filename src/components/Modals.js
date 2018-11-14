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
import { Modal } from 'react-bootstrap';
import { ActionButton, SubmitButton } from '../components/Buttons.js';
import { translate } from '../localization/localize.js';
import { InputLine } from '../components/InputLine.js';
import { fetchJson, postJson } from '../utils/RestUtils.js';
import { getAuthToken, setAuthToken, clearAuthToken } from '../utils/Auth.js';
import { ErrorMessage } from '../components/Messages.js';
import { ValidatingInput } from '../components/ValidatingInput.js';
import HelpText from '../components/HelpText.js';
import '../styles/deployer.less';

function ConfirmModal(props) {
  return (
    <Modal
      className='modals'
      show={true}
      onHide={props.onHide}
      backdrop={'static'}
      dialogClassName={props.className}>

      <Modal.Header closeButton={!props.hideCloseButton}>
        <Modal.Title className='title'>{props.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {props.children}
      </Modal.Body>
      <Modal.Footer className={props.hideFooter ? 'hide' : ''}>
        {props.footer ||
          <ActionButton clickAction={props.onHide} displayLabel={translate('ok')}/>}
      </Modal.Footer>
    </Modal>
  );
}

function YesNoModal(props) {
  const footer = (
    <div className="btn-row">
      <ActionButton type='default' clickAction={props.noAction} displayLabel={translate('no')}/>
      <ActionButton clickAction={props.yesAction} displayLabel={translate('yes')}/>
    </div>
  );

  return (
    <ConfirmModal title={props.title} onHide={props.noAction} footer={footer}
      hideFooter={props.hideFooter}>
      {props.children}
    </ConfirmModal>
  );
}

function BaseInputModal(props) {

  //won't render footer, but implement footers in the body
  //to have control over the input contents changes.
  return (
    <Modal
      className='modals'
      show={true}
      onHide={props.onHide}
      backdrop={'static'}
      dialogClassName={props.className}>

      <Modal.Header closeButton>
        <Modal.Title className='title'>{props.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {props.children}
      </Modal.Body>
    </Modal>
  );
}

class GetSshPassphraseModal extends Component {

  constructor(props) {
    super(props);

    this.state = {
      passphrase: '',
      error: ''
    };
  }

  setPassphrase = () => {
    let password = {'password': this.state.passphrase};
    postJson('/api/v1/clm/sshagent/key', JSON.stringify(password), undefined, false)
      .then(this.props.doneAction)
      .catch((error) => {
        this.props.cancelAction();
        if (error.status === 401) {
          this.setState({error: translate('get.passphrase.invalid'), passphrase: ''});
        } else {
          this.setState({error: translate('get.passphrase.error', error.value['error_msg']), passphrase: ''});
        }
      });
  }

  isValidPassphrase = () => {
    if (this.state.passphrase) {
      return true;
    }
    return false;
  }

  renderErrorMessage = () => {
    if (this.state.error) {
      return (
        <div className='notification-message-container'>
          <ErrorMessage closeAction={() => this.setState({error: ''})} title={this.state.error.title}
            message={this.state.error}/>
        </div>
      );
    }
  }

  render() {
    const footer = (
      <div className="btn-row">
        <ActionButton type='default' clickAction={this.props.cancelAction} displayLabel={translate('cancel')}/>
        <ActionButton clickAction={this.setPassphrase} displayLabel={translate('ok')}
          isDisabled={!this.isValidPassphrase()}/>
      </div>
    );

    return (
      <div>
        {this.renderErrorMessage()}
        <ConfirmModal title={translate('get.passphrase')}
          onHide={this.props.cancelAction} footer={footer}>
          <div>{translate('get.passphrase.description')}</div>
          <div className='passphrase-line'>
            <div className='passphrase-heading'>
              {translate('validate.config.sshPassphrase') + '*'}
              <HelpText tooltipText={translate('validate.config.sshPassphrase.tooltip')}/>
            </div>
            <div className='passphrase-input'>
              <ValidatingInput isRequired='true' inputName='sshPassphrase'
                inputType='password' inputValue={this.state.passphrase}
                inputAction={(e) => {this.setState({passphrase: e.target.value});}}/>
            </div>
          </div>
        </ConfirmModal>
      </div>
    );
  }
}

class LoginModal extends Component {

  constructor(props) {
    super(props);

    this.title = props.title || translate('login.header');

    this.state = {
      username: '',
      password: '',
      errorMsg: '',
      show: (getAuthToken() === undefined)
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

  handleLogin = (e, valid, props) => {
    e.preventDefault();

    clearAuthToken();
    const payload = {
      'username': this.state.username,
      'password': this.state.password
    };

    postJson('/api/v1/clm/login', payload)
      .then(response => {

        // Capture the returned token and use it for subsequent calls. If it
        // turns out to have insufficient privileges, it will be removed
        const expires = new Date(response.expires);
        setAuthToken(response.token, expires);

        // Attempt a typical operation to validate the token against the policy
        return fetchJson('/api/v1/clm/user');
      })
      .then(response => {
        this.setState({show: false, errorMsg: ''});
      })
      .catch((error) => {
        // Invalidate the token if it was saved above
        clearAuthToken();

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

  render() {
    let errorMsgPanel = '';
    if (this.state.errorMsg) {
      // TODO: This needs some additional styling
      errorMsgPanel = <div className="errorMsgPanel">{this.state.errorMsg}</div>;
    }
    // Note the use of the form surrounding the body and footer permits
    // hitting enter to submit the dialog box
    return (
      <Modal
        className='modals'
        show={this.state.show}
        onHide={this.props.onHide}
        backdrop={'static'}
        restoreFocus={true}>

        <Modal.Header>
          <Modal.Title className='title'>{this.title}</Modal.Title>
        </Modal.Header>
        <form onSubmit={this.handleLogin}>
          <Modal.Body>
            <div className='server-details-container'>
              <InputLine isRequired={true}
                label='server.user.prompt'
                inputName='username'
                inputType='text'
                placeholder={translate('server.user.prompt')}
                inputValue={this.state.username}
                inputAction={this.handleUsernameChange}
                autoFocus="true" />
              <InputLine isRequired={true}
                label='server.pass.prompt'
                inputName='password'
                inputType='password'
                placeholder={translate('server.pass.prompt')}
                inputValue={this.state.password}
                inputAction={this.handlePasswordChange} />
            </div>
            {errorMsgPanel}
          </Modal.Body>
          <Modal.Footer>
            <SubmitButton displayLabel={translate('login')}/>
          </Modal.Footer>
        </form>
      </Modal>
    );
  }
}

export { ConfirmModal, YesNoModal, BaseInputModal, LoginModal, GetSshPassphraseModal };
