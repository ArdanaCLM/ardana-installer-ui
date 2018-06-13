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
import Collapsible from 'react-collapsible';
import '../Deployer.css';
import { translate } from '../localization/localize.js';
import ServerTable from './ServerTable.js';
import { isRoleAssignmentValid } from '../utils/ModelUtils.js';

export class SearchBar extends Component {
  constructor(props) {
    super(props);
  }

  handleFilterTextInputChange = (e) => {
    e.preventDefault();
    this.props.filterAction(e.target.value);
  }

  render() {
    let cName = 'search-container ';
    cName = this.props.className ? cName + this.props.className : cName;
    return (
      <div className={cName}>
        <span className='search-bar'>
          <input className='rounded-corner'
            type="text" placeholder={translate('placeholder.search.server.text')}
            value={this.props.filterText} onChange={this.handleFilterTextInputChange}/>
        </span>
        <span className='search-icon'>
          <i className='material-icons'>search</i>
        </span>
      </div>
    );
  }
}

export class ServerRolesAccordion extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accordionPosition: 0
    };
  }

  handleTriggerClick = (idx, role) => {
    this.setState({accordionPosition: idx});
  }

  renderAccordionServerTable(servers) {
    //displayed columns
    let tableConfig = {
      columns: [
        {name: 'id'},
        {name: 'uid', hidden: true},
        {name: 'ip-addr'},
        {name: 'mac-addr'},
        {name: 'role', hidden: true},
        {name: 'server-group', hidden: true},
        {name: 'nic-mapping', hidden: true},
        {name: 'ilo-ip', hidden: true},
        {name: 'ilo-user', hidden: true},
        {name: 'ilo-password', hidden: true},
        {name: 'source', hidden: true}
      ]
    };

    const serverList = this.props.serverRoles[this.state.accordionPosition].servers;

    return (
      <ServerTable
        id={this.props.tableId}
        noHeader
        tableConfig={tableConfig}
        checkInputs={this.props.checkInputs}
        checkDupIds={this.props.checkDupIds}
        tableData={serverList}
        editAction={this.props.editAction}
        viewAction={this.props.viewAction}
        deleteAction={this.props.deleteAction}/>
    );
  }

  renderSections() {
    let sections = this.props.serverRoles.map((role, idx) => {
      let optionDisplay = '';
      if(role.minCount !== undefined) {
        optionDisplay =
          translate(
            'add.server.role.min.count.display',
            role.name, role.serverRole, role.servers.length, role.minCount
          );
      }
      else {
        optionDisplay =
          translate(
            'add.server.role.member.count.display',
            role.name, role.serverRole, role.servers.length, role.memberCount
          );
      }
      let isOpen = (idx === this.state.accordionPosition);
      let valid = isRoleAssignmentValid(role);
      let triggerClass = valid ? '' : 'has-error';

      return (
        <div
          onDrop={(event) => this.props.ondropFunct(event, role.serverRole)}
          onDragOver={(event) => this.props.allowDropFunct(event, role.serverRole)}
          onDragEnter={(event) => this.props.ondragEnterFunct(event)}
          onDragLeave={(event) => this.props.ondragLeaveFunct(event)}
          className='server-dropzone'
          key={role.name}>
          <Collapsible
            open={isOpen} key={role.name}
            trigger={optionDisplay} triggerClassName={triggerClass}
            triggerOpenedClassName={triggerClass}
            handleTriggerClick={() => this.handleTriggerClick(idx, role)}
            value={role.serverRole}>
            {isOpen && this.renderAccordionServerTable()}
          </Collapsible>
        </div>
      );
    });

    return sections;
  }

  render() {
    return (
      <div className='roles-accordion'>{this.renderSections()}</div>
    );
  }
}

export function getModelIndexByName(model, key, name) {
  return model.getIn(['inputModel', key]).findIndex(e => e.get('name') === name);
}
