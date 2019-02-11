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
import React, { Component } from 'react';
import { translate } from '../localization/localize.js';
import EditServerDetails from './EditServerDetails.js';
import ViewServerDetails from './ViewServerDetails.js';
import ContextMenu from './ContextMenu.js';
import { ConfirmModal } from './Modals.js';
import { List, Map } from 'immutable';
import { byServerNameOrId } from '../utils/Sort.js';
import {
  getAllOtherServerIds, getModelIPAddresses, getModelIPMIAddresses, getModelMacAddresses
} from '../utils/ModelUtils.js';
import { loadServerDiskUtilization } from '../utils/MonascaUtils.js';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

class CollapsibleTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showEditServerModal: false,
      showServerDetailsModal: false,

      // The following variables are needed for rendering the context menu for a
      // given menu row. These are needed as part of state because they are populated
      // during a menu click and not used until the subsequent render phase
      showContextMenu: false,
      contextMenuRow: undefined,     // info from the row on for which the context menu is shown
      contextMenuItems: [],          // items in the context menu
      contextMenuLocation: undefined // screen coordinates where context menu is to be drawn
    };
  }

  // The details of which groups are shown and which are expanded should
  // be entirely encapsulated within this component.
  // TODO: Refactor this to track which groups are expended in THIS component's
  // state rather than requiring the caller to track them.
  toggleShowHide(event, clickedGroup, wasExpanded) {
    if (wasExpanded) {
      this.props.removeExpandedGroup(clickedGroup);
    } else {
      this.props.addExpandedGroup(clickedGroup);
    }
  }

  getServerData = (server) => {
    let retData = {};
    this.props.tableConfig.columns.forEach((colDef) => {
      if(colDef.foundInProp) {
        retData[colDef.name] = this.props[colDef.foundInProp][server.get('id')];
      } else {
        retData[colDef.name] = server.get(colDef.name);
      }
    });

    return retData;
  }

  formatServerObjects = () => {
    const servers = this.props.model.getIn(['inputModel','servers']);
    // Create a map of role names to list of servers in each, e.g.
    //   { 'COMPUTE':[{name:'one',...},{name:'two',...},  'CONTROLLER': [...]}
    let groupMap = Map();
    // TODO: Avoid converting both Maps to javascript objects for *every*
    // comparison in the sort.  Instead, either create an additional comparison function
    // for maps, or make byServerNameOrId work for both Maps and objects.
    servers.sort((a,b) => byServerNameOrId(a.toJS(),b.toJS())).forEach(server => {
      groupMap = groupMap.update(server.get('role'),
        new List(),           // create a new list if role is not in groupMap
        list => list.push(    // append this server to the role's list
          this.getServerData(server)
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
      <OverlayTrigger
        key={`${server.id}-edit-tooltip`}
        placement='bottom'
        overlay={
          <Tooltip id='edit-row'>
            {translate('common.edit')}
          </Tooltip>
        }
      >
        <span className='edit collapsible'
          onClick={() => this.setState({showEditServerModal: true, contextMenuRow: server})}>
          <i className="material-icons md-dark collapsible">edit</i>
        </span>
      </OverlayTrigger>
    );
  }

  /**
   * renders the view server action during the Day 0 mode of the install,
   * this function is not called during Day2 operations due to changes in how
   * the table handles actions after install (see getContextMenuItems)
   */
  renderViewAction = (server) => {
    return (
      <OverlayTrigger
        key={`${server.id}-details-tooltip`}
        placement='bottom'
        overlay={
          <Tooltip id='row-details'>
            {translate('common.details')}
          </Tooltip>
        }
      >
        <span className="detail-info collapsible"
          onClick={() => this.setState({showServerDetailsModal: true, contextMenuRow: server})}>
          <i className="material-icons md-dark collapsible">info</i>
        </span>
      </OverlayTrigger>
    );
  }

  /**
   * query the backend for extra server details that are not loaded by default
   * since loading them for every server would be intensive
   */
  async loadServerDetails (server, retries) {
    //the internalModel is not necessarily loaded right away,
    //check again after 1 second if not already loaded
    if(this.props.internalModel !== undefined) {
      let internalModelServers = this.props.internalModel.getIn(['internal', 'servers']).toJS();
      let fullModelServer = internalModelServers.find(s => s.id == server.id);
      let server_networks_list = [];
      for (let inet in fullModelServer.interfaces) {
        for (let network in fullModelServer.interfaces[inet].networks) {
          let net = fullModelServer.interfaces[inet].networks[network];
          server_networks_list.push({
            'name': net.name + ' (' + fullModelServer.interfaces[inet].device.name + ')',
            'ip': net.addr,
            'gateway': net['gateway-ip'],
            'cidr': net.cidr,
            'vlanid': net.vlanid,
            'tagged': (net['tagged-vlan'] === undefined ? '' : net['tagged-vlan'].toString())
          });
        }
      }
      //TODO - consider passing in the volume groups here and using the size specifications
      // from the datamodel to match up the monasca used disk values for accurate used/free
      // disk measurements in absolute size rather than just percentage
      let diskUtilization = await loadServerDiskUtilization(fullModelServer.hostname);

      let updatedMenuRow = this.state.contextMenuRow;
      updatedMenuRow.networks = server_networks_list;
      updatedMenuRow.diskUtilization = diskUtilization;
      this.setState({'contextMenuRow' : updatedMenuRow});
    } else {
      //retry up to 10 times, after that, assume the internal model isnt going to load for some reason
      if(retries < 10) {
        setTimeout(this.loadServerDetails(server, retries + 1));
      }
    }
  }


  /**
   * gets the list of action menu items for a specific row based on attributes for that row (i.e. hosts
   * that are activated cannot be activated again, etc...)
   * this method is only called during day2 operations. During the install renderViewAction is used instead
   */
  getContextMenuItems = (row) => {
    let items = [{
      key: 'common.details', action: () => this.setState(
        {showServerDetailsModal: true}, () => {this.loadServerDetails(row, 0);})
    }];

    if (row.role.includes('COMPUTE')) {
      // show replace button when there is no process operation going on
      if (!this.props.processOperation) {
        items.push({
          key: 'common.replace',
          action: this.props.replaceServer,
          callbackData: row
        });
        if (this.props.serverStatuses
            && this.props.serverStatuses[row.id]
            && typeof this.props.serverStatuses[row.id].status
              === 'boolean') {
          if (this.props.serverStatuses[row.id].status) {
            items.push({
              key: 'common.deactivate',
              action: this.props.deactivateComputeHost,
              active: true,
              callbackData: row.id
            });
          } else if (!this.props.serverStatuses[row.id].status) {
            items.push({
              key: 'common.activate',
              action: this.props.activateComputeHost,
              active: true,
              callbackData: row.id
            }, {
              key: 'common.delete',
              action: this.props.deleteComputeHost,
              active: true,
              callbackData: row.id
            });
          }
        }
      }
    } else {
      // not compute node
      items.push({
        key: 'common.replace',
        action: this.props.replaceServer,
        callbackData: row
      });
    }
    return items;
  }

  prepareContextMenu = (event, row) => {
    const items = this.getContextMenuItems(row);

    this.setState({
      showContextMenu: true,
      contextMenuRow: row,
      contextMenuItems: items,
      contextMenuLocation: {x: event.pageX, y: event.pageY}
    });
  }

  renderMenuAction = (row) => {
    return (
      <span className='menu-icon md-dark' onClick={(event) => this.prepareContextMenu(event, row)}>
        <i className='material-icons'>more_horiz</i>
      </span>
    );
  }

  renderRow(server) {
    let count = 0;
    let cols = [];
    this.props.tableConfig.columns.forEach((colDef) => {
      if(!colDef.hidden) {
        cols.push(<td key={server['id'] + count++}><div>{server[colDef.name]}</div></td>);
      }
    });

    // TODO: The criteria for rendering actions separately (as in the install wizard)
    // or as a context menu (as in the update wizard) should not have hardcoded logic
    // looking for specific items, but should either be directly controllable with a
    // flag, or determined, say, on the basis of how many items there are ; for example,
    // if there are less then 3 items, then display them is separate items, otherwise
    // use a context menu
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
    let numberOfVisbileColumns = 0;
    for (let column of this.props.tableConfig.columns) {
      if (!column.hidden) {
        numberOfVisbileColumns++;
      }
    }

    //the number of columns in the header
    const headerColumnCount = 2;
    //fill in extra td entries to match the columns from the rest of the table
    for (let i=0; i< (numberOfVisbileColumns - headerColumnCount); i++) {
      fillerTds.push(<td key={i}></td>);
    }

    let groupRowClass = 'group-row';
    if (! this.isRoleGroupValid(group)) {
      groupRowClass += ' has-error';
    }

    let groupRows = [<tr className={groupRowClass} key={group.groupName}
      onClick={(event) => this.toggleShowHide(event, group.groupName, group.isExpanded)}>
      <td>{group.groupName}</td>
      {fillerTds}
      <td></td>
      <td className='group-count-col'>{group.members.length}
        <span className='expand-collapse-icon'><i className='material-icons md-dark'>{icon}</i></span></td></tr>];

    groupRows.push(this.renderHeaders(group.isExpanded, group.groupName));
    group.members.forEach((member) => {
      let cols = this.renderRow(member);
      let memberRowClassName = 'member-row';
      memberRowClassName =
        this.isDataRowValid(member) ? memberRowClassName : memberRowClassName + ' required-update';
      memberRowClassName += group.isExpanded ? ' show-row' : ' hide-row';
      groupRows.push(<tr className={memberRowClassName} key={member['id']}>{cols}</tr>);
    });

    return groupRows;
  }

  hideEditDialog = () => {
    this.setState({showEditServerModal: false});
  }

  handleDoneEditServer = (server, originId) => {
    this.props.saveEditServer(server, originId);
    this.hideEditDialog();
  }


  renderEditServerModal() {
    if (this.state.showEditServerModal) {
      let extraProps = {};
      // check against all the server ids to make sure
      // whatever changes on id won't conflict with other
      // ids.
      let ids =
        getAllOtherServerIds(
          this.props.model, this.props.autoServers,
          this.props.manualServers, this.state.contextMenuRow.id);
      extraProps.ids = ids;
      // check against other existing addresses
      extraProps.existMacAddressesModel =
        getModelMacAddresses(this.props.model, this.state.contextMenuRow['mac-addr']);
      extraProps.existIPMIAddressesModel =
        getModelIPMIAddresses(this.props.model, this.state.contextMenuRow['ilo-ip']);
      extraProps.existIPAddressesModel =
        getModelIPAddresses(this.props.model, this.state.contextMenuRow['ip-addr']);

      return (
        <EditServerDetails className='edit-details-dialog'
          title={translate('edit.server.details.heading')}
          cancelAction={this.hideEditDialog} doneAction={this.handleDoneEditServer}
          model={this.props.model} updateGlobalState={this.props.updateGlobalState}
          data={this.state.contextMenuRow} {...extraProps}>
        </EditServerDetails>
      );
    }
  }

  renderServerDetailsModal() {
    if (this.state.showServerDetailsModal) {
      return (
        <ConfirmModal
          className='view-details-dialog' hideFooter
          onHide={() => this.setState({showServerDetailsModal: false})}
          title={translate('view.server.details.heading')}>
          <ViewServerDetails data={this.state.contextMenuRow}/>
        </ConfirmModal>
      );
    }
  }

  renderContextMenu() {
    if (this.state.showContextMenu) {
      return (
        <ContextMenu
          items={this.state.contextMenuItems}
          close={() => this.setState({showContextMenu: false})}
          location={this.state.contextMenuLocation}>
        </ContextMenu>
      );
    }
  }

  renderHeaders(show, groupName) {
    if (show) {
      let headers = [];
      let columnName = '';
      for (let column of this.props.tableConfig.columns) {
        if(!column.hidden) {
          columnName = translate('table.column.header.' + column.name);
          if(columnName.startsWith('table.column.header.')) {
            columnName = column.name;
          }
          headers.push(columnName);
        }
      }

      return (
        <tr className='member-row' key={groupName + 'headerrow'}>
          {headers.map(header => <td key={groupName + header} className='subheading'> {header} </td>)}
          {/* the table has action menus in other rows, need an empty column to match */}
          <td key={groupName + 'action-menu-header'}></td>
        </tr>
      );
    }
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
        {this.renderEditServerModal()}
        {this.renderServerDetailsModal()}
        {this.renderContextMenu()}
      </div>
    );
  }
}

// TODO:
// Refactor this class so that the caller can register menu items to be shown,
//   where each item has a callback function, an icon

export default CollapsibleTable;
