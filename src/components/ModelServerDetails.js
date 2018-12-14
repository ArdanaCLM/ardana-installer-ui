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
import { translate } from '../localization/localize.js';
import { maskPassword } from '../utils/ModelUtils.js';

class ModelServerDetails extends Component {
  renderTextLine(title, value) {
    return (
      <div className='detail-line'>
        <div className='detail-heading configured'>{translate(title)}</div>
        <div className='info-body readonly'>{value || ''}</div>
      </div>
    );
  }

  /**
   * creates the jsx entries for the network interfaces of a server
   */
  renderNetworkBlurb(network) {
    return(
      <div className='network' key={network.name}>
        {network.name}
        <table>
          <tbody>
            <tr>
              <td>{translate('server.details.ip')}</td>
              <td>{network.ip}</td>
            </tr>
            <tr>
              <td>{translate('cidr')}:</td>
              <td>{network.cidr}</td>
            </tr>
            <tr>
              <td>{translate('gateway')}:</td>
              <td>{network.gateway}</td>
            </tr>
            <tr>
              <td>{translate('vlanid')}:</td>
              <td>{network.vlanid}</td>
            </tr>
            <tr>
              <td>{translate('tagged-vlan')}:</td>
              <td>{network.tagged}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  renderDetailsContent = () => {
    if(this.props.data) {
      let network_info;
      if(this.props.data.networks) {
        network_info = this.props.data.networks.map(network => this.renderNetworkBlurb(network));
      }
      return (
        <div className='server-details-container'>
          {this.renderTextLine('server.id.prompt', this.props.data.id)}
          {this.renderTextLine('server.ip.prompt', this.props.data['ip-addr'])}
          {this.renderTextLine('server.group.prompt', this.props.data['server-group'])}
          {this.renderTextLine('server.nicmapping.prompt', this.props.data['nic-mapping'])}
          {this.renderTextLine('server.role.prompt', this.props.data.role)}
          {this.renderTextLine('server.mac.prompt', this.props.data['mac-addr'])}
          {this.renderTextLine('server.ipmi.ip.prompt', this.props.data['ilo-ip'])}
          {this.renderTextLine('server.ipmi.username.prompt', this.props.data['ilo-user'])}
          {this.renderTextLine('server.ipmi.password.prompt', maskPassword(this.props.data['ilo-password']))}
          {network_info ? translate('network.interfaces') : ''}
          <div className='inetFaces'>
            {network_info}
          </div>
        </div>
      );
    }
  }

  render() {
    return (<div>{this.renderDetailsContent()}</div>);
  }
}

export default ModelServerDetails;
