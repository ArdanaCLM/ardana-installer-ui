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
import ServerRowItem from './ServerRowItem.js';

class ServerTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deployedServers: this.props.deployedServers
    };
  }

  componentWillReceiveProps(newProps) {
    this.setState({deployedServers: newProps.deployedServers});
  }

  renderServerRows() {
    let items =
      this.props.tableData.map((row, index) => {
        let extraProps = {};
        extraProps.isDraggable = true;
        // when it is in addserver mode, if we have a list of deployed servers
        if(this.props.isUpdateMode &&
           this.state.deployedServers && this.state.deployedServers.length > 0) {
          // if the server item is NOT in the deployedServers, will present
          // editAction and deleteAction
          if(!this.state.deployedServers.some(server => {
            return server['id'] === row['id'] && server['ip-addr'] === row['ip-addr'];
          })) {
            extraProps.editAction = this.props.editAction;
            extraProps.deleteAction = this.props.deleteAction;
          }
          // if the server item is in the deployedServers, will NOT present
          // editAction and deleteAction and item is not draggable
          else {
            extraProps.isDraggable = false;
          }
        }
        else {
          extraProps.editAction = this.props.editAction;
          extraProps.deleteAction = this.props.deleteAction;
        }
        return (
          <ServerRowItem
            data={row}
            dataDef={this.props.tableConfig.columns}
            viewAction={this.props.viewAction}
            tableId={this.props.id}
            checkInputs={this.props.checkInputs}
            checkDupIds={this.props.checkDupIds}
            key={index}
            {...extraProps}>
          </ServerRowItem>
        );
      });
    return items;
  }

  renderTableHeaders() {
    let keyCount = 0;
    let headers =
      this.props.tableConfig.columns.map((colDef, index) => {
        if(!colDef.hidden) {
          return (
            <th key={keyCount++}>{translate('server.item.' + colDef.name)}</th>
          );
        }
      });

    // push an empty header to hold show detail icon
    if (this.props.viewAction)
      headers.push(<th key={keyCount++}></th>);

    // push another empty header to hold edit icon
    if (this.props.editAction)
      headers.push(<th key={keyCount++}></th>);

    // push another empty header to hold delete icon
    if (this.props.deleteAction)
      headers.push(<th key={keyCount++}></th>);
    return (
      <tr>{headers}</tr>
    );
  }

  render() {
    return (
      <table className='table'>
        <thead>{!this.props.noHeader && this.renderTableHeaders()}</thead>
        <tbody>{this.renderServerRows()}</tbody>
      </table>
    );
  }
}

export default ServerTable;
