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
import { ActionButton } from '../components/Buttons.js';
import { translate } from '../localization/localize.js';
import { postJson } from '../utils/RestUtils.js';
import { ErrorMessage } from '../components/Messages.js';
import { ValidatingInput } from '../components/ValidatingInput.js';
import HelpText from '../components/HelpText.js';

export function ConfirmModal(props) {
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

export function YesNoModal(props) {
  const footer = (
    <div className="btn-row">
      <ActionButton
        type='default' clickAction={props.noAction} displayLabel={translate('no')} isDisabled={props.disableNo}/>
      <ActionButton
        clickAction={props.yesAction} displayLabel={translate('yes')} isDisabled={props.disableYes}/>
    </div>
  );

  return (
    <ConfirmModal title={props.title} onHide={props.noAction} footer={footer}
      hideFooter={props.hideFooter}>
      {props.children}
    </ConfirmModal>
  );
}

export function BaseInputModal(props) {

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

export class GetSshPassphraseModal extends Component {

  constructor(props) {
    super(props);

    this.state = {
      passphrase: '',
      error: ''
    };
  }

  setPassphrase(event) {
    event?.preventDefault();
    let password = {'password': this.state.passphrase};
    postJson('/api/v2/sshagent/key', JSON.stringify(password), undefined, false)
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

  isValidPassphrase() {
    if (this.state.passphrase) {
      return true;
    }
    return false;
  }

  renderErrorMessage() {
    if (this.state.error) {
      return (
        <div className='notification-message-container'>
          <ErrorMessage closeAction={() => this.setState({error: ''})} title={this.state.error.title}
            message={this.state.error}/>
        </div>
      );
    }
  }

  handleValueChange(event) {
    this.setState({
      passphrase: event.target.value
    });
  }

  render() {
    const footer = (
      <div className="btn-row">
        <ActionButton type='default' clickAction={this.props.cancelAction} displayLabel={translate('cancel')}/>
        <ActionButton clickAction={::this.setPassphrase} displayLabel={translate('ok')}
          isDisabled={!this.isValidPassphrase()}/>
      </div>
    );

    return (
      <div>
        {this.renderErrorMessage()}
        <ConfirmModal title={translate('get.passphrase')}
          onHide={this.props.cancelAction} footer={footer}>
          <form onSubmit={::this.setPassphrase}>
            <div>{translate('get.passphrase.description')}</div>
            <div className='passphrase-line'>
              <div className='passphrase-heading'>
                {translate('validate.config.sshPassphrase') + '*'}
                <HelpText tooltipText={translate('validate.config.sshPassphrase.tooltip')}/>
              </div>
              <div className='passphrase-input'>
                <ValidatingInput isRequired='true' inputName='sshPassphrase'
                  inputType='password' inputValue={this.state.passphrase}
                  inputAction={::this.handleValueChange}/>
              </div>
            </div>
          </form>
        </ConfirmModal>
      </div>
    );
  }
}
