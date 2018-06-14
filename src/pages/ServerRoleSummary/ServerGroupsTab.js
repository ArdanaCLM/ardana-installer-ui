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
import { alphabetically } from '../../utils/Sort.js';
import { YesNoModal } from '../../components/Modals.js';
import ServerGroupDetails from './ServerGroupDetails.js';
import { getModelIndexByName } from '../../components/ServerUtils.js';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';

class ServerGroupsTab extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      showServerGroupDetails: false,
      showRemoveConfirmation: false,
      serverGroupToRemove: ''
    };
  }

  resetData = () => {
    this.setState({
      value: '',
      showServerGroupDetails: false,
      showRemoveConfirmation: false,
      serverGroupToRemove: ''
    });
    if (this.serverGroupDetails) {
      this.serverGroupDetails.resetData();
    }
  }

  addServerGroup = () => {
    if (!this.state.showServerGroupDetails) {
      this.setState({showServerGroupDetails: true, value: ''});
    }
  }

  editServerGroup = (selected) => {
    if (!this.state.showServerGroupDetails) {
      this.setState({showServerGroupDetails: true, value: selected});
    }
  }

  confirmRemoveServerGroup = (name) => {
    if (!this.state.showServerGroupDetails) {
      this.setState({showRemoveConfirmation: true, serverGroupToRemove: name});
    }
  }

  removeServerGroup = (name) => {
    this.setState({showRemoveConfirmation: false, serverGroupToRemove: ''});
    const index = getModelIndexByName(this.props.model, 'server-groups', name);
    if (index !== -1) {
      const model = this.props.model.removeIn(['inputModel','server-groups', index]);
      this.props.updateGlobalState('model', model);
    }
  }

  hideServerGroupDetails = () => {
    this.setState({showServerGroupDetails: false, value: ''});
  }

  render() {
    const rows = this.props.model.getIn(['inputModel','server-groups'])
      .sort((a,b) => alphabetically(a.get('name'), b.get('name')))
      .map((m,idx) => {
        let numNetworks = '-';
        if (m.has('networks')) {
          const tooltipText = m.get('networks').join(',\n');
          const tooltip = (<Tooltip id='network' className='cell-tooltip'>{tooltipText}</Tooltip>);
          numNetworks = (
            <OverlayTrigger placement='right' overlay={tooltip}>
              <span>{m.get('networks').size}</span>
            </OverlayTrigger>);
        }

        let numServerGroups = '-';
        if (m.has('server-groups')) {
          const tooltipText = m.get('server-groups').join(',\n');
          const tooltip = (<Tooltip id='server-groups' className='cell-tooltip'>{tooltipText}</Tooltip>);
          numServerGroups = (
            <OverlayTrigger placement='right' overlay={tooltip}>
              <span>{m.get('server-groups').size}</span>
            </OverlayTrigger>);
        }

        const name = m.get('name');
        const selected = {
          name: name,
          networks: m.has('networks') ? m.get('networks').toJS() : [],
          serverGroups: m.has('server-groups') ? m.get('server-groups').toJS() : [],
        };

        let editClass = 'material-icons edit-button';
        let removeClass = 'material-icons remove-button';
        if (this.state.showServerGroupDetails) {
          editClass = editClass + ' disabled';
          removeClass = removeClass + ' disabled';
        }

        return (
          <tr key={idx}>
            <td>{name}</td>
            <td>{numNetworks}</td>
            <td>{numServerGroups}</td>
            <td>
              <div className='row-action-container'>
                <span onClick={() => this.editServerGroup(selected)}>
                  <i className={editClass}>edit</i>
                </span>
                <span onClick={() => this.confirmRemoveServerGroup(name)}>
                  <i className={removeClass}>delete</i>
                </span>
              </div>
            </td>
          </tr>);
      });

    let addClass = 'material-icons add-button';
    addClass = this.state.showServerGroupDetails ? addClass + ' disabled' : addClass;
    let addTextClass = 'add-text';
    addTextClass = this.state.showServerGroupDetails ? addTextClass + ' disabled' : addTextClass;
    let actionRow = (
      <tr key='serverGroupAction' className='action-row'>
        <td><i className={addClass} onClick={this.addServerGroup}>add_circle</i>
          <span className={addTextClass} onClick={this.addServerGroup}>{translate('add.server.group')}</span></td>
        <td colSpan='3'/>
      </tr>
    );

    let detailsSection = '';
    if (this.state.showServerGroupDetails) {
      detailsSection = (<ServerGroupDetails model={this.props.model}
        value={this.state.value} updateGlobalState={this.props.updateGlobalState}
        setDataChanged={this.props.setDataChanged} closeAction={this.hideServerGroupDetails}
        tabIndex={this.props.tabIndex} ref={instance => {this.serverGroupDetails = instance;}}/>);
    }

    let confirmRemoveSection = '';
    if (this.state.showRemoveConfirmation) {
      confirmRemoveSection = (
        <YesNoModal show={this.state.showRemoveConfirmation} title={translate('warning')}
          yesAction={() => this.removeServerGroup(this.state.serverGroupToRemove) }
          noAction={() => this.setState({showRemoveConfirmation: false})}>
          {translate('details.server.group.confirm.remove', this.state.serverGroupToRemove)}
        </YesNoModal>
      );
    }

    return (
      <div className='extended-one'>
        <div className={this.state.showServerGroupDetails ? 'col-xs-8 verticalLine' : 'col-xs-12'}>
          <table className='table'>
            <thead>
              <tr>
                <th>{translate('server.group.name')}</th>
                <th>{translate('number.networks')}</th>
                <th>{translate('number.server.groups')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows}
              {actionRow}
            </tbody>
          </table>
        </div>
        {detailsSection}
        {confirmRemoveSection}
      </div>
    );
  }
}

export default ServerGroupsTab;
