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
import { translate } from '../localization/localize.js';
import BaseWizardPage from './BaseWizardPage.js';
import CollapsibleTable from './ServerRoleSummary/CollapsibleTable.js';
import { ActionButton } from '../components/Buttons.js';
import { EditCloudSettings } from './ServerRoleSummary/EditCloudSettings.js';
import { getServerRoles, isRoleAssignmentValid, updateServersInModel, getMergedServer } from '../utils/ModelUtils.js';
import { MODEL_SERVER_PROPS_ALL, MODEL_SERVER_PROPS } from '../utils/constants.js';
import { fetchJson, putJson } from '../utils/RestUtils.js';

class ServerRoleSummary extends BaseWizardPage {

  constructor(props) {
    super(props);

    this.checkInputs = ['nic-mapping', 'server-group'];
    this.state = {
      autoServers: undefined,
      manualServers: undefined
    };

    // expand COMPUTE-ROLE if available, otherwise expand the first group
    const allGroups = this.props.model.getIn(['inputModel','server-roles']).map(e => e.get('name')).toJS();
    if (allGroups.includes('COMPUTE-ROLE')) {
      this.state = {expandedGroup: ['COMPUTE-ROLE']};
    } else {
      this.state = {expandedGroup: [allGroups[0]]};
    }
  }

  componentWillMount() {
    fetchJson('/api/v1/server?source=sm,ov')
      .then((rawServerData) => {
        if(rawServerData) {
          this.setState({autoServers : rawServerData});
        }
      });

    // get manually added servers
    fetchJson('/api/v1/server?source=manual')
      .then((responseData) => {
        if (responseData.length > 0) {
          this.setState({manualServers : responseData});
        }
      });
  }

  expandAll() {
    const allGroups = this.props.model.getIn(['inputModel','server-roles']).map(e => e.get('name'));
    this.setState({expandedGroup: allGroups});
  }

  collapseAll() {
    this.setState({expandedGroup: []});
  }

  removeExpandedGroup = (groupName) => {
    this.setState(prevState => {
      return {'expandedGroup': prevState.expandedGroup.filter(e => e != groupName)};
    });
  }

  addExpandedGroup = (groupName) => {
    this.setState((prevState) => {
      return {'expandedGroup': prevState.expandedGroup.concat(groupName)};
    });
  }

  updateServerForEditServer = (server, originalId) => {
    for (let list of ['autoServers', 'manualServers']) {
      let idx = this.state[list].findIndex(s => originalId === s.id);
      if (idx >= 0) {
        let updated_server;
        let tempList = this.state[list].slice();
        updated_server = getMergedServer(tempList[idx], server, MODEL_SERVER_PROPS);
        updated_server.origId = originalId;
        putJson('/api/v1/server', JSON.stringify(updated_server));
        break;
      }
    }
  }

  saveEditServer = (server, originalId) =>  {
    let model =
      updateServersInModel(server, originalId, this.props.model, MODEL_SERVER_PROPS_ALL);
    this.props.updateGlobalState('model', model);

    // update saved servers in case user goes back to assign
    // server role page and drag the server back
    this.updateServerForEditServer(server, originalId);
  }

  isPageValid = () => {
    return getServerRoles(this.props.model).every(role => {
      return isRoleAssignmentValid(role, this.checkInputs);
    });
  }

  setNextButtonDisabled = () => !this.isPageValid();

  renderCollapsibleTable() {
    let tableConfig = {
      columns: [
        {name: 'id'},
        {name: 'ip-addr',},
        {name: 'server-group'},
        {name: 'nic-mapping'},
        {name: 'mac-addr'},
        {name: 'ilo-ip', hidden: true},
        {name: 'ilo-user', hidden: true},
        {name: 'ilo-password', hidden: true},
        {name: 'role', hidden: true}
      ]
    };
    return (
      <CollapsibleTable
        addExpandedGroup={this.addExpandedGroup} removeExpandedGroup={this.removeExpandedGroup}
        model={this.props.model} tableConfig={tableConfig} expandedGroup={this.state.expandedGroup}
        saveEditServer={this.saveEditServer} checkInputs={this.checkInputs}
        autoServers={this.state.autoServers} manualServers={this.state.manualServers}
        updateGlobalState={this.props.updateGlobalState}/>
    );
  }

  render() {
    return (
      <div className='wizard-page'>
        <EditCloudSettings
          show={this.state.showCloudSettings}
          onHide={() => this.setState({showCloudSettings: false})}
          model={this.props.model}
          updateGlobalState={this.props.updateGlobalState}/>
        <div className='content-header'>
          <div className='titleBox'>
            {this.renderHeading(translate('server.role.summary.heading'))}
          </div>
          <div className='buttonBox'>
            <div className='btn-row'>
              <ActionButton displayLabel={translate('edit.cloud.settings')} type='default'
                clickAction={() => this.setState({showCloudSettings: true})} />
              <ActionButton type='default'
                displayLabel={translate('collapse.all')} clickAction={() => this.collapseAll()} />
              <ActionButton type='default'
                displayLabel={translate('expand.all')} clickAction={() => this.expandAll()} />
            </div>
          </div>
        </div>
        <div className='wizard-content'>{this.renderCollapsibleTable()}</div>
        {this.renderNavButtons()}
      </div>
    );
  }
}

export default ServerRoleSummary;
