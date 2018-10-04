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
import EditServerDetails from './EditServerDetails.js';
import ViewServerDetails from './ViewServerDetails.js';
import ReplaceServerDetails from './ReplaceServerDetails.js';
import ContextMenu from './ContextMenu.js';
import { BaseInputModal, ConfirmModal } from './Modals.js';
import { List, Map } from 'immutable';
import { byServerNameOrId } from '../utils/Sort.js';
import { getAllOtherServerIds } from '../utils/ModelUtils.js';
import { isProduction } from '../utils/ConfigHelper.js';

class CollapsibleTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showEditServerModal: false,
      showServerDetailsModal: false,
      activeRowData: undefined,
      model: this.props.model,
      showReplaceServerModal: false,
      showMenu: false,
      menuItems: [],
      menuLocation: undefined
    };
  }

  componentWillReceiveProps(newProps) {
    if (this.state.model !== newProps.model) {
      this.setState({model: newProps.model});
    }
  }

  handleDoneEditServer = (server, originId) => {
    this.props.saveEditServer(server, originId);
    this.setState({showEditServerModal: false, activeRowData: undefined});
  }

  handleCancelEditServer = () => {
    this.setState({showEditServerModal: false, activeRowData: undefined});
  }

  handleShowEditServer = (rowData) => {
    this.setState({showEditServerModal: true, activeRowData: rowData});
  }

  handleCancelServerDetails = () => {
    this.setState({showServerDetailsModal: false, activeRowData: undefined});
  }

  handleShowServerDetails = (rowData) => {
    this.setState({showServerDetailsModal: true, activeRowData: rowData});
  }

  handleShowMenuServerDetails = () => {
    this.setState({showServerDetailsModal: true, showMenu: false});
  }

  handleDoneReplaceServer = (server, wipeDisk, installOS) => {
    this.props.replaceServer(server, wipeDisk, installOS);
    this.setState({showReplaceServerModal: false, activeRowData: undefined});
  }

  handleCancelReplaceServer = () => {
    this.setState({showReplaceServerModal: false, activeRowData: undefined});
  }

  handleShowMenuReplaceServer = () => {
    this.setState({showReplaceServerModal: true, showMenu: false});
  }

  handleShowMenuServerDetails = () => {
    this.setState({showServerDetailsModal: true, showMenu: false});
  }

  handleShowMenuDeleteServer = () => {
    //TODO
  }

  handleShowMenuActivateServer = () => {
    //TODO
  }

  handleShowMenuDeactivateServer = () => {
    //TODO
  }

  handleShowMenu = (event, rowData) => {
    let role = rowData.role;
    let items = [];
    if (role.indexOf('COMPUTE') === -1) { //not compute node
      items = [{
        show: true, key: 'common.details', handleShowModal: this.handleShowMenuServerDetails,
      }];

      //if the UI is not in production mode, include menu options that aren't completed yet
      if(!isProduction()) {
        items.push({
          show: true, key: 'common.replace', handleShowModal: this.handleShowMenuReplaceServer
        });
      }
    }
    else { //TODO need dynamically show or not show based on the rowData status
      items = [
        {
          show: true, key: 'common.details', handleShowModal: this.handleShowMenuServerDetails
        }
      ];

      if (!isProduction()) {
        // show replace button when there is no process operation going on
        let showReplaceMenu = !this.props.processOperation;
        items.push(
          {
            show: false, key: 'common.activate', handleShowModal: this.handleShowMenuActivateServer
          }, {
            show: false, key: 'common.deactivate', handleShowModal: this.handleShowMenuDeactivateServer
          }, {
            show: false, key: 'common.delete', handleShowModal: this.handleShowMenuDeleteServer
          }, {
            show: showReplaceMenu, key: 'common.replace', handleShowModal: this.handleShowMenuReplaceServer
          }
        );
      }
    }

    this.setState({
      showMenu: true, activeRowData: rowData, menuItems: items,
      menuLocation: {x: event.pageX, y: event.pageY}
    });
  }

  toggleShowHide(event, clickedGroup, wasExpanded) {
    if (wasExpanded) {
      this.props.removeExpandedGroup(clickedGroup);
    } else {
      this.props.addExpandedGroup(clickedGroup);
    }
  }

  getSeverData = (server) => {
    let retData = {};
    this.props.tableConfig.columns.forEach((colDef) => {
      retData[colDef.name] = server.get(colDef.name);
    });

    return retData;
  }

  formatServerObjects = () => {
    const servers = this.state.model.getIn(['inputModel','servers']);
    // Create a map of role names to list of servers in each, e.g.
    //   { 'COMPUTE':[{name:'one',...},{name:'two',...},  'CONTROLLER': [...]}
    let groupMap = Map();
    servers.sort((a,b) => byServerNameOrId(a.toJS(),b.toJS())).forEach(server => {
      groupMap = groupMap.update(server.get('role'),
        new List(),           // create a new list if role is not in groupMap
        list => list.push(    // append this server to the role's list
          this.getSeverData(server)
        ));
    });

    // Convert the map to a list of objects and return it, e.g.
    //  [ {groupName:'COMPUTE', members:[{name:'one',...},{name:'two',...},
    //    {groupName:'CONTROLLER', members:[..]}... ]
    return groupMap.keySeq().sort()         // get a sorted list of keys
      .map(g => new Map({
        'groupName': g,
        'members': groupMap.get(g),
        'isExpanded': this.props.expandedGroup && this.props.expandedGroup.includes(g)}))
      .toJS();                              // return as JavaScript objects
  }

  isRoleGroupValid = (group) => {
    if(this.props.checkInputs) {
      return group.members.every((server) =>
        this.props.checkInputs.every(key => (server[key] ? true : false))
      );
    }
    return true;
  }

  isDataRowValid = (member) => {
    let isValid = true;
    let badInput = undefined;
    if(this.props.checkInputs) {
      badInput = this.props.checkInputs.find((key) => {
        return (member[key] === undefined || member[key] === '');
      });
    }
    if(badInput) {
      isValid = false;
    }
    return isValid;
  }

  renderEditAction = (server) => {
    return (
      <span className='edit collapsible'
        onClick={() => this.handleShowEditServer(server)}>
        <i className="material-icons collapsible">edit</i>
      </span>
    );
  }

  renderViewAction = (server) => {
    return (
      <span className="detail-info collapsible"
        onClick={() => this.handleShowServerDetails(server)}>
        <i className="material-icons collapsible">info</i>
      </span>
    );
  }

  renderMenuAction = (server) => {
    return (
      <span className='menu-icon' onClick={(event) => this.handleShowMenu(event, server)}>
        <i className='material-icons'>more_vert</i>
      </span>
    );
  }

  renderServerDataCols(server) {
    let count = 0;
    let cols = [];
    this.props.tableConfig.columns.forEach((colDef) => {
      if(!colDef.hidden) {
        cols.push(<td key={server['id'] + count++}><div>{server[colDef.name]}</div></td>);
      }
    });

    cols.push(
      <td key='action-buttons'>
        {this.props.saveEditServer && this.renderEditAction(server)}
        {this.props.saveEditServer && this.renderViewAction(server)}
        {this.props.replaceServer && this.renderMenuAction(server)}
      </td>
    );
    return cols;
  }

  renderGroup(group) {
    let icon = group.isExpanded ? 'expand_more' : 'expand_less';

    let fillerTds = [];
    for (let i=0; i<Object.keys(group.members[0]).length - 7; i++) {
      fillerTds.push(<td key={i}></td>);
    }

    let groupRowClass = 'group-row';
    groupRowClass = this.isRoleGroupValid(group) ? groupRowClass : groupRowClass + ' has-error';

    let groupRows = [<tr className={groupRowClass} key={group.groupName}
      onClick={(event) => this.toggleShowHide(event, group.groupName, group.isExpanded)}>
      <td>{group.groupName}</td>
      {fillerTds}
      <td></td>
      <td className='group-count-col'>{group.members.length}
        <span className='expand-collapse-icon'><i className='material-icons'>{icon}</i></span></td></tr>];
    group.members.forEach((member) => {
      let cols = this.renderServerDataCols(member);
      let memberRowClassName = 'member-row';
      memberRowClassName =
        this.isDataRowValid(member) ? memberRowClassName : memberRowClassName + ' required-update';
      memberRowClassName += group.isExpanded ? ' show-row' : ' hide-row';
      groupRows.push(<tr className={memberRowClassName} key={member['id']}>{cols}</tr>);
    });

    return groupRows;
  }

  renderEditServerModal() {
    let theProps = {};
    // check against all the server ids to make sure
    // whatever changes on id won't conflict with other
    // ids.
    let ids =
      getAllOtherServerIds(
        this.props.model, this.props.autoServers,
        this.props.manualServers, this.state.activeRowData.id);
    theProps.ids = ids;
    return (
      <BaseInputModal
        show={this.state.showEditServerModal} className='edit-details-dialog'
        onHide={this.handleCancelEditServer} title={translate('edit.server.details.heading')}>
        <EditServerDetails
          cancelAction={this.handleCancelEditServer} doneAction={this.handleDoneEditServer}
          model={this.props.model} updateGlobalState={this.props.updateGlobalState}
          data={this.state.activeRowData} {...theProps}>
        </EditServerDetails>
      </BaseInputModal>
    );
  }

  renderReplaceServerModal() {
    let title = translate('server.replace.heading', this.state.activeRowData.id);
    let newProps = { ...this.props };
    newProps.knownServers = [].concat(this.props.manualServers || []).concat(this.props.autoServers || []);

    return (
      <BaseInputModal
        show={this.state.showReplaceServerModal} className='edit-details-dialog'
        onHide={this.handleCancelReplaceServer} title={title}>
        <ReplaceServerDetails
          cancelAction={this.handleCancelReplaceServer} doneAction={this.handleDoneReplaceServer}
          data={this.state.activeRowData} { ...newProps }>
        </ReplaceServerDetails>
      </BaseInputModal>
    );
  }

  renderServerDetailsModal() {
    return (
      <ConfirmModal
        show={this.state.showServerDetailsModal} className='view-details-dialog' hideFooter
        onHide={this.handleCancelServerDetails} title={translate('view.server.details.heading')}>
        <ViewServerDetails data={this.state.activeRowData}/>
      </ConfirmModal>
    );
  }

  renderActionItemsMenu() {
    return (
      <ContextMenu
        show={this.state.showMenu} items={this.state.menuItems} close={() => this.setState({showMenu: false})}
        location={this.state.menuLocation}>
      </ContextMenu>
    );
  }

  render() {
    // data should be in this following format:
    // [{"groupName": "Group A", members: [{"id": "Server1", "addr": "192.168.2.2"}, {..}]},
    //  {"groupName": "Group B", members: [{..}, {..}, {..}]]
    // Keywords are "groupName" and "members", where group is the name of the collapsible category
    // and members are the category's members which will be displayed under the category
    let data = this.formatServerObjects();
    let rows = data.map((group) => {return this.renderGroup(group);});
    return (
      <div className='collapsible-table'>
        <div className='rounded-corner'>
          <table className='full-width'><tbody>{rows}</tbody></table>
        </div>
        {this.props.saveEditServer && this.state.activeRowData && this.renderEditServerModal()}
        {this.props.replaceServer && this.state.activeRowData && this.renderReplaceServerModal()}
        {this.state.activeRowData && this.renderServerDetailsModal()}
        {this.state.showMenu && this.renderActionItemsMenu()}
      </div>
    );
  }
}

export default CollapsibleTable;
