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
import React from 'react';
import { translate, translateModelName } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage';
import { fetchJson } from '../utils/RestUtils.js';
import { Modal } from 'react-bootstrap';

class Complete extends BaseWizardPage {

  constructor() {
    super();
    this.state = {
      horizon: '',
      opsconsole: ''
    };

    fetchJson('/api/v2/external_urls')
      .then(responseData => {
        if (responseData.horizon) {
          this.setState({horizon: responseData.horizon});
        }
        if (responseData.opsconsole) {
          this.setState({opsconsole: responseData.opsconsole});
        }
      })
      .catch((error) => {
        console.log('Unable to retrieve external URLs');// eslint-disable-line no-console
      });
  }

  render() {
    const modelName = translateModelName(this.props.model.get('name'));
    let modelLines = [];
    if (modelName && modelName !== '') {
      modelLines.push(<div className='body-header' key='modelLine1'>
        {translate('complete.message.body2')}</div>);
      modelLines.push(<div className='body-line' key='modelLine2'>
        {translate('complete.message.body3', modelName)}</div>);
    }

    let linkSection = '';
    if (this.state.horizon !== '' || this.state.opsconsole !== '') {
      let links = [];
      if (this.state.horizon !== '') {
        links.push(<li className='body-link' key='horizon'>
          <a href={this.state.horizon}>{translate('complete.message.link1')}</a></li>);
      }
      if (this.state.opsconsole !== '') {
        links.push(<li className='body-link' key='ops'>
          <a href={this.state.opsconsole}>{translate('complete.message.link2')}</a></li>);
      }
      linkSection = (
        <div>
          <div className='body-header'>{translate('complete.message.link.heading')}</div>
          <ul>
            {links}
          </ul>
        </div>
      );
    }

    return (
      <Modal className='complete-step' show={true} backdrop={false}>
        <Modal.Header>
          <div className='icon-container'><i className='material-icons complete-icon'>done</i></div>
          <div>{this.renderHeading(translate('complete.heading'))}</div>
          <div className='sub-heading'>{translate('complete.message.body1')}</div>
        </Modal.Header>
        <Modal.Body>
          {modelLines}
          <div className='body-header'>{translate('complete.message.refresh')}</div>
          {linkSection}
        </Modal.Body>
      </Modal>
    );
  }
}

export default Complete;
