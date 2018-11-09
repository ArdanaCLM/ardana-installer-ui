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
import { Alert } from 'react-bootstrap';
import { translate } from '../localization/localize.js';

class NotificationMessage extends Component {

  render() {
    let msgs = [];
    if(Array.isArray(this.props.message)) {
      this.props.message.forEach((msg, idx) => {
        msgs.push(<p key={idx}>{msg}</p>);
      });
    }
    else if(this.props.message.includes('\n')) {
      let splits = this.props.message.split('\n');
      msgs = splits.map((ms, idx) => <p key={idx}>{ms}</p>);
    }
    else {
      msgs.push(<p key={0}>{this.props.message}</p>);
    }

    return (
      <div className='notification-message'>
        <Alert variant={this.props.type} onClose={this.props.closeAction} dismissible={true}>
          <div>
            <h4>{this.props.title}</h4>
            {msgs}
          </div>
        </Alert>
      </div>
    );
  }
}

function ErrorMessage(props) {
  return (
    <NotificationMessage
      title={props.title || translate('default.error')}
      message={props.message}
      type='danger'
      closeAction={props.closeAction}>
    </NotificationMessage>
  );
}

function SuccessMessage(props) {
  return (
    <NotificationMessage
      title={props.title || translate('default.success')}
      message={props.message}
      type='success'
      closeAction={props.closeAction}>
    </NotificationMessage>
  );
}

function WarningMessage(props) {
  return (
    <NotificationMessage
      title={props.title || translate('default.warning')}
      message={props.message}
      type='warning'
      closeAction={props.closeAction}>
    </NotificationMessage>
  );
}

function InfoBanner(props) {
  return (
    <Alert><span className='info-banner'>
      <i className='material-icons info-icon'>info</i>{props.message}</span></Alert>
  );
}

function ErrorBanner(props) {
  let banner = null;
  if (props.show) {
    banner = (
      <Alert variant="danger" dismissible={true}>
        <span className='error-banner'>
          <i className='material-icons error-icon'>error</i>{props.message}
        </span>
      </Alert>
    );
  }
  return banner;
}

export {ErrorMessage, SuccessMessage, WarningMessage, InfoBanner, ErrorBanner};
