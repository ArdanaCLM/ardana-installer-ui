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
import { fromJS } from 'immutable';
import { translate } from '../../localization/localize.js';
import { alphabetically } from '../../utils/Sort.js';
import { getModelIndexByName } from '../../components/ServerUtils.js';
import { ServerDropdownLine, ServerInput } from '../../components/ServerUtils.js';
import { UniqueNameValidator } from '../../utils/InputValidators.js';
import { ActionButton } from '../../components/Buttons.js';
import { YesNoModal } from '../../components/Modals.js';

class ServerRolesTab extends Component {

  constructor(props) {
    super(props);
    this.state = {
      serverRole: {
        name: '',
        'disk-model': '',
        'interface-model': ''
      },
    };
  }

  componentWillMount() {
    this.diskModels = this.props.model.getIn(['inputModel','disk-models'])
      .map((group) => {return group.get('name');}).sort().toJS();
    this.interfaceModels = this.props.model.getIn(['inputModel','interface-models'])
      .map((group) => {return group.get('name');}).sort().toJS();
  }

  resetData = () => {
    this.setState({
      serverRole: {
        name: '',
        'disk-model': '',
        'interface-model': ''
      },
    });
  }

  addServerRole = () => {
    if (!this.state.showServerRoleDetails) {
      // set default values since both disk model and interface model are required to create a role
      this.setState({showServerRoleDetails: true, serverRole: {
        name: '',
        'disk-model': this.diskModels[0],
        'interface-model': this.interfaceModels[0]
      }});
      this.origServerRole = {
        name: '',
        'disk-model': '',
        'interface-model': ''
      };
      this.validName = false;
    }
  }

  editServerRole = (selected) => {
    if (!this.state.showServerRoleDetails) {
      this.setState({showServerRoleDetails: true, serverRole: selected});
      this.origServerRole = selected;
    }
  }

  handleInputLine = (e, valid, props) => {
    const newName = e.target.value;
    this.validName = valid;
    this.setState(prevState => {
      const newRole = JSON.parse(JSON.stringify(prevState.serverRole));
      newRole.name = newName;
      return {
        serverRole: newRole
      };
    });
  }

  handleSelectDiskModel = (diskModel) => {
    this.setState(prevState => {
      const newRole = JSON.parse(JSON.stringify(prevState.serverRole));
      newRole['disk-model'] = diskModel;
      return {
        serverRole: newRole
      };
    });
  }

  handleSelectInterfaceModel = (interfaceModel) => {
    this.setState(prevState => {
      const newRole = JSON.parse(JSON.stringify(prevState.serverRole));
      newRole['interface-model'] = interfaceModel;
      return {
        serverRole: newRole
      };
    });
  }

  checkDataToSave = () => {
    let dataChanged = JSON.stringify(this.origServerRole) !== JSON.stringify(this.state.serverRole);
    this.props.setDataChanged(this.props.tabIndex, dataChanged);
    let dataValid = this.state.serverRole.name !== '' && this.state.serverRole['disk-model'] !== ''
      && this.state.serverRole['interface-model'] !== '';
    return dataValid && this.validName;
  }

  saveServerRole = () => {
    let model = this.props.model;
    if (this.origServerRole.name === '') {
      // add mode
      model = model.updateIn(['inputModel', 'server-roles'],
        list => list.push(fromJS(this.state.serverRole)));
    } else {
      // edit mode
      const index = getModelIndexByName(this.props.model, 'server-roles', this.origServerRole.name);
      if (index !== -1) {
        model = model.updateIn(['inputModel', 'server-roles'],
          list => list.splice(index, 1, fromJS(this.state.serverRole)));
      }
    }
    this.props.updateGlobalState('model', model);
    this.closeAction();
  }

  closeAction = () => {
    this.props.setDataChanged(this.props.tabIndex, false);
    this.setState({showServerRoleDetails: false});
    this.resetData();
  }

  confirmRemoveServerRole = (name) => {
    if (!this.state.showServerRoleDetails) {
      this.setState({showRemoveConfirmation: true, serverRoleToRemove: name});
    }
  }

  renderConfirmRemove = () => {
    if (this.state.showRemoveConfirmation) {
      return (
        <YesNoModal show={this.state.showRemoveConfirmation} title={translate('warning')}
          yesAction={() => this.removeServerRole(this.state.serverRoleToRemove) }
          noAction={() => this.setState({showRemoveConfirmation: false})}>
          {translate('manage.server.roles.remove.confirm', this.state.serverRoleToRemove)}
        </YesNoModal>
      );
    }
  }

  removeServerRole = (name) => {
    this.setState({showRemoveConfirmation: false, serverRoleToRemove: ''});
    const index = getModelIndexByName(this.props.model, 'server-roles', name);
    if (index !== -1) {
      const model = this.props.model.removeIn(['inputModel','server-roles', index]);
      this.props.updateGlobalState('model', model);
    }
  }

  renderDetails = () => {
    if (this.state.showServerRoleDetails) {
      this.diskModels = this.props.model.getIn(['inputModel','disk-models'])
        .map((group) => {return group.get('name');}).sort().toJS();
      this.interfaceModels = this.props.model.getIn(['inputModel','interface-models'])
        .map((group) => {return group.get('name');}).sort().toJS();
      const serverRoles = this.props.model.getIn(['inputModel','server-roles'])
        .map((group) => {return group.get('name');}).sort().toJS();
      // remove orig name from the list to check for uniqueness in edit mode
      if (serverRoles.indexOf(this.state.serverRole) !== -1) {
        extraProps.names.splice(serverRoles.indexOf(this.state.serverRole), 1);
      }
      let extraProps = {names: serverRoles, check_nospace: true};

      const header = (this.state.serverRole.name !== '') ? translate('edit.server.role') :
        translate('add.server.role');

      return (
        <div className='col-xs-4'>
          <div className='details-section'>
            <div className='details-header'>{header}</div>
            <div className='details-body'>
              <ServerInput isRequired={true} placeholder={translate('server.role.name') + '*'}
                inputValue={this.state.serverRole.name} inputName='name' inputType='text' {...extraProps}
                inputAction={this.handleInputLine} inputValidate={UniqueNameValidator}
                autoFocus={true}/>
              <div className='details-group-title'>{translate('disk.model') + '*:'}</div>
              <ServerDropdownLine value={this.state.serverRole['disk-model']}
                optionList={this.diskModels} isRequired={true}
                selectAction={this.handleSelectDiskModel}/>
              <div className='details-group-title'>{translate('interface.model') + '*:'}</div>
              <ServerDropdownLine value={this.state.serverRole['interface-model']}
                optionList={this.interfaceModels} isRequired={true}
                selectAction={this.handleSelectInterfaceModel}/>
              <div className='btn-row details-btn'>
                <div className='btn-container'>
                  <ActionButton key='cancel' type='default' clickAction={this.closeAction}
                    displayLabel={translate('cancel')}/>
                  <ActionButton key='save' clickAction={this.saveServerRole}
                    displayLabel={translate('save')} isDisabled={!this.checkDataToSave()}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  render() {
    const rows = this.props.model.getIn(['inputModel','server-roles'])
      .sort((a,b) => alphabetically(a.get('name'), b.get('name')))
      .map((m,idx) => {
        let editClass = 'glyphicon glyphicon-pencil edit-button';
        let removeClass = 'glyphicon glyphicon-trash remove-button';
        if (this.state.showServerRoleDetails) {
          editClass = editClass + ' disabled';
          removeClass = removeClass + ' disabled';
        }
        let name = m.get('name');

        return (
          <tr key={idx}>
            <td>{name}</td>
            <td>{m.get('disk-model')}</td>
            <td>{m.get('interface-model')}</td>
            <td>
              <div className='row-action-container'>
                <span onClick={() => this.editServerRole(m.toJS())} className={editClass}/>
                <span onClick={() => this.confirmRemoveServerRole(name)} className={removeClass}/>
              </div>
            </td>
          </tr>);
      });

    let addClass = 'material-icons add-button';
    addClass = this.state.showServerRoleDetails ? addClass + ' disabled' : addClass;
    let addTextClass = 'add-text';
    addTextClass = this.state.showServerRoleDetails ? addTextClass + ' disabled' : addTextClass;
    let actionRow = (
      <tr key='serverRoleAction' className='action-row'>
        <td><i className={addClass} onClick={this.addServerRole}>add_circle</i>
          <span className={addTextClass} onClick={this.addServerRole}>{translate('add.server.role')}</span></td>
        <td colSpan='3'/>
      </tr>
    );

    return (
      <div className='extended-one'>
        <div className={this.state.showServerRoleDetails ? 'col-xs-8 verticalLine' : 'col-xs-12'}>
          <table className='table'>
            <thead>
              <tr>
                <th>{translate('server.role.name')}</th>
                <th>{translate('disk.model')}</th>
                <th>{translate('interface.model')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows}
              {actionRow}
            </tbody>
          </table>
        </div>
        {this.renderDetails()}
        {this.renderConfirmRemove()}
      </div>
    );
  }
}

export default ServerRolesTab;
