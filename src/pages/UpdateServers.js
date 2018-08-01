// (c) Copyright 2018 SUSE LLC
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
import CollapsibleTable from '../components/CollapsibleTable.js';
import { ActionButton } from '../components/Buttons.js';
import { updateServersInModel, getMergedServer } from '../utils/ModelUtils.js';
import { MODEL_SERVER_PROPS_ALL, MODEL_SERVER_PROPS } from '../utils/constants.js';
import { fetchJson, putJson } from '../utils/RestUtils.js';
import { UpdateServerPages } from './ReplaceServer/UpdateServerPages.js';
import BaseWizardPage from './BaseWizardPage.js';

class UpdateServers extends BaseWizardPage {

  constructor(props) {
    super(props);
    this.state = {
      model: this.props.model
    };
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      model : newProps.model,
    });
    if(newProps.model.getIn(['inputModel', 'server-roles'])) {
      const allGroups =
        newProps.model.getIn(['inputModel', 'server-roles']).map(e => e.get('name')).toJS();
      if (allGroups.includes('COMPUTE-ROLE')) {
        this.setState({expandedGroup: ['COMPUTE-ROLE']});
      } else {
        this.setState({expandedGroup: [allGroups[0]]});
      }
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
    const allGroups =
      this.state.model.getIn(['inputModel','server-roles']).map(e => e.get('name'));
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
      if(prevState.expandedGroup) {
        return {'expandedGroup': prevState.expandedGroup.concat(groupName)};
      }
      else {
        return {'expandedGroup': [groupName]};
      }
    });
  }

  updateServerForReplaceServer = (server) => {
    for (let list of ['autoServers', 'manualServers']) {
      if(this.state[list]) {
        this.state[list].filter(s => server.uid === s.uid).forEach(match => {
          const updated_server = getMergedServer(match, server, MODEL_SERVER_PROPS);
          putJson('/api/v1/server', JSON.stringify(updated_server));
        });
      }
    }
  }

  assembleProcessPages = (theProps) => {
    let pages = [];

    pages.push({
      name: 'PrepareReplace',
      component: UpdateServerPages.PrepareReplace
    });

    //TODO other pages based on the theProps

    if(theProps.installOS) {
      pages.push({
        name: "InstallOS",
        component: UpdateServerPages.InstallOS
      });
    }

    pages.push({
      name: 'UpdateComplete',
      component: UpdateServerPages.UpdateComplete
    });
    return pages;
  }

  replaceServer = (server, theProps) =>  {
    // update model
    let model =
      updateServersInModel(server, this.state.model, MODEL_SERVER_PROPS_ALL, server.id);
    this.props.updateGlobalState('model', model);

    // the new server is from discovered servers or manual servers
    // need to update
    // TODO what to update if use available servers to replace existing
    // server?
    // if(theProps.selectedServerId) {
    //   this.updateServerForReplaceServer(server);
    // }

    // TODO record only pass id and ip for now, not really used
    // at this point. might be in the future. If it turns out no
    // no use at all, remove it
    theProps.server = {id : server.id, 'ip': server['ip-addr']};

    let pages = this.assembleProcessPages(theProps);

    // trigger update process to start which calls the startUpdate in
    // InstallWizard
    this.props.startUpdateProcess('ReplaceServer', pages, theProps);
  }

  renderCollapsibleTable() {
    let tableConfig = {
      columns: [
        {name: 'id'},
        {name: 'uid', hidden: true},
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
        model={this.state.model} tableConfig={tableConfig} expandedGroup={this.state.expandedGroup}
        replaceServer={this.replaceServer} updateGlobalState={this.props.updateGlobalState}
        autoServers={this.state.autoServers} manualServers={this.state.manualServers}/>
    );
  }

  render() {
    return (
      <div className='wizard-page'>
        <div className='content-header'>
          <div className='titleBox'>
            {this.renderHeading(translate('common.servers'))}
          </div>
          <div className='buttonBox'>
            <div className='btn-row'>
              <ActionButton type='default'
                displayLabel={translate('collapse.all')} clickAction={() => this.collapseAll()} />
              <ActionButton type='default'
                displayLabel={translate('expand.all')} clickAction={() => this.expandAll()} />
            </div>
          </div>
        </div>
        <div className='wizard-content unlimited-height'>
          {this.state.model && this.state.model.size > 0 && this.renderCollapsibleTable()}</div>
      </div>
    );
  }
}

export default UpdateServers;
