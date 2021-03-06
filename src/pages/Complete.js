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
import { Modal } from 'react-bootstrap';

const linkTranslations = {
  horizon: translate('complete.message.link1'),
  opsconsole: translate('complete.message.link2'),
  'ardana-service': translate('day2.product.title'),
  'suse-documentation': translate('complete.message.docs.link')
};

class Complete extends BaseWizardPage {

  renderUsefulLinks() {
    let links = Object.keys(this.props.usefulLinks || {}).filter((name) => {
      return this.props.usefulLinks[name]?.length > 0;
    }).map((name) => {
      return {
        name: name,
        url: this.props.usefulLinks[name]
      };
    });

    links.push({
      name: 'suse-documentation',
      url: 'https://www.suse.com/documentation/suse-openstack-cloud-9/'
    });

    return links.map((link) => {
      return (
        <li className='body-link' key={link.name}>
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            {linkTranslations[link.name]}
          </a>
        </li>
      );
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

    return (
      <Modal
        className='complete-step'
        show={true}
        backdrop={false}
        centered
        size="lg"
      >
        <Modal.Header>
          <div className='icon-container'>
            <i className='material-icons complete-icon'>done</i>
          </div>
          <div>{this.renderHeading(translate('complete.heading'))}</div>
          <div className='sub-heading'>{translate('complete.message.body1')}</div>
        </Modal.Header>
        <Modal.Body>
          {modelLines}
          <div className='body-header'>
            {translate(
              'complete.message.body4',
              <a href={this.props.usefulLinks?.['ardana-service']}>
                {translate('day2.product.title')}
              </a>
            )}
          </div>
          <div className='body-header'>{translate('complete.message.link.heading')}</div>
          <ul className='body-list'>
            {this.renderUsefulLinks()}
          </ul>
        </Modal.Body>
      </Modal>
    );
  }
}

export default Complete;
