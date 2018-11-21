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
import { EditPencilForTableRow , InfoForTableRow, DeleteForTableRow } from './Buttons.js';
import { IS_MS_EDGE, IS_MS_IE } from '../utils/constants.js';
import { hasConflictAddresses } from '../utils/ModelUtils.js';

class ServerRowItem extends Component {
  /**
   * drag and drop support for server assignment, assigns the current set of data properties
   * to the dataTransfer (payload) of the drag event so it can be picked up by the drop handler
   *
   * @param {event} ev the browser onDragStart event object
   * @param {Object} data the server data payload
   */
  drag(ev, data) {
    //setData only supports strings, JSON stringify here, parse on the other end
    let format = IS_MS_EDGE || IS_MS_IE ? 'text' : 'data';
    ev.dataTransfer.setData(format, JSON.stringify(data));
  }

  handleEditAction = (data) => {
    if(this.props.editAction) {
      this.props.editAction(data);
    }
  }

  handleViewAction = (data, tableId) => {
    if(this.props.viewAction) {
      this.props.viewAction(data, tableId);
    }
  }

  handleDeleteAction = (data) => {
    if(this.props.deleteAction) {
      this.props.deleteAction(data);
    }
  }

  renderServerColumns() {
    let cols = [];
    let keyCount = 0;
    this.props.dataDef.forEach((def) => {
      if(!def.hidden) {
        let badgeClass = '';
        if(def.name === 'id') {
          if(this.props.data.source === 'sm') {
            badgeClass = 'sm-badge';
          }
          else if(this.props.data.source === 'ov') {
            badgeClass = 'ov-badge';
          }
        }
        let col = (
          <td className={badgeClass} key={keyCount++}>{this.props.data[def.name]}</td>
        );
        cols.push(col);
      }
    });

    return cols;
  }

  renderInfoRow() {
    return (
      <InfoForTableRow
        clickAction={(e) => this.handleViewAction(this.props.data, this.props.tableId)}/>
    );
  }

  renderEditRow() {
    return (
      <EditPencilForTableRow
        clickAction={(e) => this.handleEditAction(this.props.data)}/>
    );
  }

  renderDeleteRow() {
    return (
      <DeleteForTableRow
        clickAction={(e) => this.handleDeleteAction(this.props.data)}/>
    );
  }

  render() {
    let requiredUpdate = false;
    let badInput = undefined;
    if(this.props.checkInputs) {
      badInput = this.props.checkInputs.find((key) => {
        return (this.props.data[key] === undefined || this.props.data[key] === '');
      });
    }
    if(!badInput && this.props.checkDupIds) {
      badInput = this.props.checkDupIds.find(id => {
        return id === this.props.data.id;
      });
    }
    // check if newly added servers has duplicate ip-addr, mac-addr, ilo-ip
    if(!badInput && this.props.checkNewDupAddresses) {
      if(!this.props.checkNewDupAddresses.deployedServerIds.includes(this.props.data.id)) {
        let otherServerAddresses =
          this.props.checkNewDupAddresses.modelServerAddresses.filter(server => {
            return server.id !== this.props.data.id;
          });

        badInput = hasConflictAddresses (this.props.data, otherServerAddresses);
      }
    }
    if(badInput) {
      requiredUpdate = true;
    }
    let cName = this.props.isDraggable ? 'draggable' : '';
    cName = requiredUpdate ? cName + ' required-update' : cName;

    // if the item is not draggable, we don't present edit and delete
    // actions, add empty td to push the info button to the last col
    let emptyCols = [];
    if(!this.props.isDraggable) {
      for(let i = 0; i < 2; i++) {
        emptyCols.push(<td key={i}><p></p></td>);
      }
    }

    return (
      <tr className={cName}
        draggable={this.props.isDraggable} onDragStart={(event) => this.drag(event, this.props.data)}>
        {this.renderServerColumns()}
        {emptyCols}
        {this.props.viewAction && this.renderInfoRow()}
        {this.props.editAction && this.renderEditRow()}
        {this.props.deleteAction && this.renderDeleteRow()}
      </tr>
    );
  }
}

export default ServerRowItem;
