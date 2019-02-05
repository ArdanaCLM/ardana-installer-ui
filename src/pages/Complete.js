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
import React from 'react';
import '../styles/deployer.less';
import { translate, translateModelName } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage';
import { fetchJson } from '../utils/RestUtils.js';
import { Modal } from 'react-bootstrap';

const linkTranslations = {
  horizon: translate('complete.message.link1'),
  opsconsole: translate('complete.message.link2'),
  'ardana-service': translate('day2.product.title')
};

class Complete extends BaseWizardPage {

  constructor() {
    super();
    this.state = {
      links: {},
      linksLoaing: true
    };
  }

  async componentDidMount() {
    try {
      this.setState({
        links: await fetchJson('/api/v2/external_urls'),
        linksLoaing: false
      });
    } catch(error) {
      console.log('Unable to retrieve external URLs'); // eslint-disable-line no-console
    }
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

    let links = Object.keys(this.state.links).filter(linkName => {
      return this.state.links[linkName]?.length > 0;
    }).map(linkName => {
      return <li className='body-link' key={linkName}>
        <a href={this.state.links[linkName]}>{linkTranslations[linkName]}</a>
      </li>;
    });

    return (
      <Modal className='complete-step' show={true} backdrop={false}>
        <Modal.Header>
          <div className='icon-container'><i className='material-icons complete-icon'>done</i></div>
          <div>{this.renderHeading(translate('complete.heading'))}</div>
          <div className='sub-heading'>{translate('complete.message.body1')}</div>
        </Modal.Header>
        <Modal.Body>
          {modelLines}
          <div className='body-header'>
            {translate(
              'complete.message.body4',
              <a href={this.state.links['ardana-service']}>{translate('day2.product.title')}</a>
            )}
          </div>
          <div className='body-header'>{translate('complete.message.link.heading')}</div>
          <If condition={this.state.linksLoaing}>
            <h4>{translate('loading.pleasewait')}</h4>
          </If>
          <If condition={!this.state.linksLoaing}>
            <ul>
              {links}
            </ul>
          </If>
        </Modal.Body>
      </Modal>
    );
  }
}

export default Complete;
