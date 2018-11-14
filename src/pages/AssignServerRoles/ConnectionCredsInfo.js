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
import { translate } from '../../localization/localize.js';
import { InputLine } from '../../components/InputLine.js';
import { ActionButton, ItemHelpButton } from '../../components/Buttons.js';
import { postJson } from '../../utils/RestUtils.js';
import {
  IpV4AddressHostValidator, PortValidator
} from '../../utils/InputValidators.js';
import { ErrorMessage, SuccessMessage } from '../../components/Messages.js';
import { LoadingMask } from '../../components/LoadingMask.js';
import { isEmpty } from 'lodash';
import { INPUT_STATUS } from '../../utils/constants.js';
import { fromJS } from 'immutable';

const TEST_STATUS = INPUT_STATUS;

const ERROR_MSG = 0;
const SUCCESS_MSG = 1;

class ConnectionCredsInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      smTestStatus: TEST_STATUS.UNKNOWN,
      ovTestStatus: TEST_STATUS.UNKNOWN,
      loading: false,

      // Set the inputValue and isValid maps based on the incoming this.props.data, if any
      inputValue: fromJS({
        sm: {
          checked: this.props.data?.sm?.checked || false,
          secured: (this.props.data?.sm?.secured === true),
          sessionKey: this.props.data?.sm?.sessionKey,
          host: this.props.data?.sm?.creds?.host,
          port: this.props.data?.sm?.creds?.port || 443,
          username: this.props.data?.sm?.creds?.username,
        },
        ov: {
          checked: this.props.data?.ov?.checked || false,
          secured: (this.props.data?.ov?.secured === true),
          sessionKey: this.props.data?.ov?.sessionKey,
          host: this.props.data?.ov?.creds?.host,
          username: this.props.data?.ov?.creds?.username,
        },
      }),

      isValid: fromJS({
        sm: {
          host: this.props.data?.sm?.creds?.host !== undefined || undefined,
          username: this.props.data?.sm?.creds?.username !== undefined || undefined,
          password: undefined,
          port: true,
        },
        ov: {
          host: this.props.data?.ov?.creds?.host !== undefined || undefined,
          username: this.props.data?.ov?.creds?.username !== undefined || undefined,
          password: undefined,
        },
      }),

      messages: []
    };
  }

  isFormValid () {
    // At least one of the two types must be selected
    if (!this.state.inputValue.getIn(['ov','checked']) &&
        !this.state.inputValue.getIn(['sm','checked'])) {
      return false;
    }

    for (const category of ['sm','ov']) {
      if(this.state.inputValue.getIn([category,'checked'])) {
        // Require that all fields are valid
        if (! this.state.isValid.get(category).every(val => val)) {
          return false;
        }
      }
    }

    return true;
  }

  isDoneEnabled() {
    return this.isFormValid() &&
      (this.state.smTestStatus != TEST_STATUS.INVALID || ! this.state.inputValue.getIn(['sm','checked'])) &&
      (this.state.ovTestStatus != TEST_STATUS.INVALID || ! this.state.inputValue.getIn(['ov','checked']));
  }

  testSm() {
    this.setState(prev => ({inputValue: prev.inputValue.removeIn(['sm','sessionKey'])}));
    const sm = this.state.inputValue.get('sm');

    let hostport = sm.get('host');
    if (sm.has('port')) {
      hostport += ':' + sm.get('port');
    }

    return (
      postJson('/api/v1/sm/connection_test', sm, {
        headers: {
          'Secured': sm.get('secured')
        },
      }, false)
        .then((responseData) => {
          let msg = translate('server.test.sm.success', hostport);

          this.setState(prev => ({
            inputValue: prev.inputValue.setIn(['sm','sessionKey'], responseData),
            messages: prev.messages.concat([{msg: msg, messageType: SUCCESS_MSG}]),
            smTestStatus: TEST_STATUS.VALID
          }));
        })
        .catch((error) => {
          let msg = translate('server.test.sm.error', hostport);
          if(error.status === 404) {
            msg = translate('server.test.sm.error.hostport', hostport);
          }
          else if(error.status === 401) {
            msg = translate('server.test.sm.error.userpass', hostport, sm.get('username'));
          }
          else if(error.status === 403) {
            msg = translate('server.test.sm.error.secured', hostport);
          }
          this.setState(prev => {
            return {
              messages: prev.messages.concat([{msg: [msg, error.value.error], messageType: ERROR_MSG}]),
              smTestStatus: TEST_STATUS.INVALID
            };
          });
        })
    );
  }

  testOv() {
    const host = this.state.inputValue.getIn(['ov', 'host']);
    this.setState(prev => ({inputValue: prev.inputValue.removeIn(['ov','sessionKey'])}));
    return (
      postJson('/api/v1/ov/connection_test', this.state.inputValue.get('ov'), {
        headers: {
          'Secured': this.state.inputValue.getIn(['ov', 'secured'])
        }
      }, false)
        .then((responseData) => {
          let msg = translate('server.test.ov.success', host);
          this.setState(prev => ({
            inputValue: prev.inputValue.setIn(['ov','sessionKey'], responseData.sessionID),
            messages: prev.messages.concat([{msg: msg, messageType: SUCCESS_MSG}]),
            ovTestStatus: TEST_STATUS.VALID
          }));
        })
        .catch((error) => {
          let msg = translate('server.test.ov.error', host);
          this.setState(prev => {
            return {
              messages: prev.messages.concat([{msg: [msg, error.value.error], messageType: ERROR_MSG}]),
              ovTestStatus: TEST_STATUS.INVALID
            };
          });
        })
    );
  }

  async handleTest(event) {
    event?.preventDefault();
    this.setState({
      messages: [],
      loading: true
    });

    let tests = [];

    if(this.state.inputValue.getIn(['sm','checked'])) {
      tests.push(this.testSm());
    }

    if(this.state.inputValue.getIn(['ov','checked'])) {
      tests.push(this.testOv());
    }

    // Perform all tests
    await Promise.all(tests);
    this.setState({ loading: false });
  }

  handleInputChange = (e, valid, name, category) => {
    const target = e.target;
    let value;
    if (target.type == 'checkbox') {
      value = target.checked;
    } else {
      value = target.value;
    }

    this.setState((prevState) => ({
      inputValue: prevState.inputValue.setIn([category, name], value),
      isValid: prevState.isValid.setIn([category, name], valid),
    }));
  }

  handleCancel() {
    this.props.cancelAction();
  }

  handleDone() {

    // Create the data structure needed for the callback
    let callbackData = {};
    for (const category of ['sm','ov']) {
      callbackData[category] = {};

      if (this.state.inputValue.getIn([category,'checked'])) {
        // Move secured, checked, and sessionKey to he top level
        callbackData[category].secured = this.state.inputValue.getIn([category,'secured']);
        callbackData[category].checked = this.state.inputValue.getIn([category,'checked']);
        callbackData[category].sessionKey = this.state.inputValue.getIn([category,'sessionKey']);

        let creds = this.state.inputValue.get(category)
          .remove('secured')
          .remove('checked')
          .remove('sessionKey');

        callbackData[category].creds = creds.toJS();
      }
      else {
        callbackData[category].checked = false;
      }
    }

    if(this.state.inputValue.getIn(['sm','checked']) && this.state.smTestStatus === TEST_STATUS.UNKNOWN ||
      this.state.inputValue.getIn(['ov','checked']) && this.state.ovTestStatus === TEST_STATUS.UNKNOWN) {
      this.handleTest().then(() => {
        this.setState({loading: false});
        if(this.state.smTestStatus !== TEST_STATUS.INVALID &&
          this.state.ovTestStatus !== TEST_STATUS.INVALID) {
          this.props.doneAction(callbackData);
        }
      });
    }
    else {
      this.props.doneAction(callbackData);
    }
  }

  handleCloseMessage = (ind) => {
    this.setState((prevState) => {
      let msgs = prevState.messages.slice();
      msgs.splice(ind, 1);
      return {messages: msgs};
    });
  }

  handleShowSslHelp = (type) => {
    // TODO: Open links that are specific to sm/ov, if any
    window.open('https://www.suse.com/documentation/cloud');
  }

  renderMessage() {
    if (!isEmpty(this.state.messages)) {
      let msgList = [];
      this.state.messages.map((msgObj, ind) => {
        if (msgObj.messageType === ERROR_MSG) {
          msgList.push(
            <ErrorMessage key={ind} closeAction={() => this.handleCloseMessage(ind)}
              message={msgObj.msg}/>);
        } else {
          msgList.push(
            <SuccessMessage key={ind} closeAction={() => this.handleCloseMessage(ind)}
              message={msgObj.msg}/>);
        }
      });
      return (<div>{msgList}</div>);
    }
  }

  renderLoadingMask() {
    return (
      <LoadingMask className='input-modal-mask' show={this.state.loading}></LoadingMask>
    );
  }

  renderCredentials(category) {
    return (
      <div>
        <input className='creds-category' type='checkbox' value={category}
          checked={this.state.inputValue.getIn([category, 'checked'])}
          onChange={(e) => this.handleInputChange(e,true,'checked',category)}/>
        {translate('server.'+category)}
        <If condition={this.state.inputValue.getIn([category, 'checked'])}>
          <div className='server-details-container'>
            <InputLine
              isRequired={true} inputName='host' label='server.host1.prompt'
              inputValidate={IpV4AddressHostValidator}
              inputValue={this.state.inputValue.getIn([category, 'host'], '')}
              inputAction={(e,v,props) => this.handleInputChange(e,v,props.inputName,category)}/>
            <If condition={category === 'sm'}>
              <InputLine
                isRequired={false} inputType='number' min='0' max='65535'
                inputName='host' label='server.port.prompt'
                inputValidate={PortValidator}
                inputValue={this.state.inputValue.getIn([category, 'port'], '')}
                inputAction={(e,v,props) => this.handleInputChange(e,v,props.inputName,category)}/>
            </If>
            <InputLine
              isRequired={true} inputName='username' label='server.user.prompt'
              inputValue={this.state.inputValue.getIn([category, 'username'], '')}
              inputAction={(e,v,props) => this.handleInputChange(e,v,props.inputName,category)}/>
            <InputLine
              isRequired={true} inputType='password'inputName='password' label='server.pass.prompt'
              inputValue={this.state.inputValue.getIn([category, 'password'], '')}
              inputAction={(e,v,props) => this.handleInputChange(e,v,props.inputName,category)}/>
            <input className='secured' type='checkbox' value='secured'
              checked={this.state.inputValue.getIn([category, 'secured'])}
              onChange={(e) => this.handleInputChange(e,true,'secured',category)}/>
            {translate('server.secure')}
            <ItemHelpButton clickAction={(e) => this.handleShowSslHelp(category)}/>
            <div className='message-line'></div>
          </div>
        </If>
      </div>
    );
  }

  renderFooter() {
    return (
      <div className='btn-row input-button-container'>
        <ActionButton type='default'
          clickAction={::this.handleCancel} displayLabel={translate('cancel')}/>
        <ActionButton type='default'
          isDisabled={!this.isFormValid()}
          clickAction={::this.handleTest}
          displayLabel={translate('test')}/>
        <ActionButton
          isDisabled={!this.isDoneEnabled()}
          clickAction={::this.handleDone} displayLabel={translate('common.save.continue')}/>
      </div>
    );
  }

  render() {
    return (
      <div className='connection-creds-info'>
        {this.renderMessage()}
        <form onSubmit={::this.handleTest}>
          {this.renderCredentials('sm')}
          {this.renderCredentials('ov')}
        </form>
        {this.renderFooter()}
        {this.renderLoadingMask()}
      </div>
    );
  }
}

export default ConnectionCredsInfo;
