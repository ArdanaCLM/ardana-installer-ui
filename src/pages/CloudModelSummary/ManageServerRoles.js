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
import { Tabs, Tab } from 'react-bootstrap';
import { ConfirmModal, YesNoModal } from '../../components/Modals.js';
import { TAB } from '../../utils/constants.js';
import DiskModelsTab from '../ServerRoleSummary/DiskModelsTab.js';
import InterfaceModelsTab from '../ServerRoleSummary/InterfaceModelsTab.js';
import ServerRolesTab from '../CloudModelSummary/ServerRolesTab.js';

const TABINDEX = [
  'SERVER_ROLES', 'DISK_MODELS', 'INTERFACE_MODELS'
];

class ManageServerRoles extends Component {

  constructor(props) {
    super(props);
    this.state = {
      key: TAB.SERVER_ROLES,
      showCloseConfirmation: false
    };
    this.dataChanged = [false, false, false];
  }

  showConfirmCloseModal = () => {
    if (this.dataChanged.find(change => change)) {
      this.setState({showCloseConfirmation: true});
    } else {
      this.closeModal();
    }
  }

  closeModal = () => {
    this.dataChanged = [false, false, false];
    this.serverRolesTab.resetData();
    this.diskModelsTab.resetData();
    this.interfaceModelsTab.resetData();
    this.setState({showCloseConfirmation: false});
    this.props.onHide();
  }

  setDataChanged = (index, changed) => {
    this.dataChanged[index] = changed;
  }

  render() {
    const tabs = (
      <Tabs id='manageServerRoles' activeKey={this.state.key}
        onSelect={(tabKey) => {this.setState({key: tabKey});}}>
        <Tab eventKey={TAB.SERVER_ROLES} title={translate('server.roles')}>
          <ServerRolesTab model={this.props.model} updateGlobalState={this.props.updateGlobalState}
            setDataChanged={this.setDataChanged} tabIndex={TABINDEX.indexOf(TAB.SERVER_ROLES)}
            ref={instance => {this.serverRolesTab = instance;}}/>
        </Tab>
        <Tab eventKey={TAB.DISK_MODELS} title={translate('edit.disk.models')}>
          <DiskModelsTab model={this.props.model} updateGlobalState={this.props.updateGlobalState}
            setDataChanged={this.setDataChanged} tabIndex={TABINDEX.indexOf(TAB.DISK_MODELS)}
            ref={instance => {this.diskModelsTab = instance;}}/>
        </Tab>
        <Tab eventKey={TAB.INTERFACE_MODELS} title={translate('edit.interface.models')}>
          <InterfaceModelsTab model={this.props.model} updateGlobalState={this.props.updateGlobalState}
            setDataChanged={this.setDataChanged} tabIndex={TABINDEX.indexOf(TAB.INTERFACE_MODELS)}
            ref={instance => {this.interfaceModelsTab = instance;}}/>
        </Tab>
      </Tabs>
    );

    return (
      <div>
        <ConfirmModal
          show={this.props.show}
          title={translate('manage.server.roles')}
          className={'cloud-settings'}
          hideFooter='true'
          onHide={this.showConfirmCloseModal}>
          {tabs}
        </ConfirmModal>
        <YesNoModal show={this.state.showCloseConfirmation} title={translate('warning')}
          yesAction={this.closeModal} noAction={() => this.setState({showCloseConfirmation: false})}>
          {translate('manage.server.roles.close.confirm')}
        </YesNoModal>
      </div>
    );
  }
}

export default ManageServerRoles;
