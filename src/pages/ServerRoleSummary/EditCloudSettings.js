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
import CloudConfigTab from './CloudConfigTab.js';
import NicMappingTab from './NicMappingTab.js';
import ServerGroupsTab from './ServerGroupsTab.js';
import NetworksTab from './NetworksTab.js';
import DiskModelsTab from './DiskModelsTab.js';
import InterfaceModelsTab from './InterfaceModelsTab.js';

const TAB = {
  CLOUD_CONFIG: 'CLOUD_CONFIG',
  NIC_MAPPINGS: 'NIC_MAPPINGS',
  SERVER_GROUPS: 'SERVER_GROUPS',
  NETWORKS: 'NETWORKS',
  DISK_MODELS: 'DISK_MODELS',
  INTERFACE_MODELS: 'INTERFACE_MODELS'
};
const TABINDEX = [
  'CLOUD_CONFIG', 'NIC_MAPPINGS', 'SERVER_GROUPS', 'NETWORKS', 'DISK_MODELS', 'INTERFACE_MODELS'
];

class EditCloudSettings extends Component {

  constructor(props) {
    super(props);
    this.state = {
      key: TAB.CLOUD_CONFIG,
      showCloseConfirmation: false
    };
    this.dataChanged = [false, false, false, false, false, false];
  }

  showConfirmCloseModal = () => {
    if (this.dataChanged.find(change => change)) {
      this.setState({showCloseConfirmation: true});
    } else {
      this.closeModals();
    }
  }

  closeModals = () => {
    this.dataChanged = [false, false, false, false, false, false];
    if (!this.props.oneTab) {
      this.nicMappingTab.resetData();
      this.serverGroupsTab.resetData();
      this.networksTab.resetData();
      this.diskModelsTab.resetData();
      this.interfaceModelsTab.resetData();
    } else {
      if (this.props.oneTab === 'server-group') {
        this.serverGroupsTab.resetData();
      } else {
        this.nicMappingTab.resetData();
      }
    }
    this.setState({showCloseConfirmation: false});
    this.props.onHide();
  }

  setDataChanged = (index, changed) => {
    this.dataChanged[index] = changed;
  }

  render() {
    let tabs;
    if (this.props.oneTab) {
      if (this.props.oneTab === 'server-group') {
        tabs = (
          <Tabs id='editCloudSettings' activeKey={TAB.SERVER_GROUPS}
            onSelect={(tabKey) => {this.setState({key: tabKey});}}>
            <Tab eventKey={TAB.SERVER_GROUPS} title={translate('edit.server.groups')}>
              <ServerGroupsTab model={this.props.model} updateGlobalState={this.props.updateGlobalState}
                setDataChanged={this.setDataChanged} tabIndex={TABINDEX.indexOf(TAB.SERVER_GROUPS)}
                ref={instance => {this.serverGroupsTab = instance;}}/>
            </Tab>
          </Tabs>
        );
      } else {
        tabs = (
          <Tabs id='editCloudSettings' activeKey={TAB.NIC_MAPPINGS}
            onSelect={(tabKey) => {this.setState({key: tabKey});}}>
            <Tab eventKey={TAB.NIC_MAPPINGS} title={translate('edit.nic.mappings')}>
              <NicMappingTab model={this.props.model} updateGlobalState={this.props.updateGlobalState}
                setDataChanged={this.setDataChanged} tabIndex={TABINDEX.indexOf(TAB.NIC_MAPPINGS)}
                ref={instance => {this.nicMappingTab = instance;}}/>
            </Tab>
          </Tabs>
        );
      }
    } else {
      tabs = (
        <Tabs id='editCloudSettings' activeKey={this.state.key}
          onSelect={(tabKey) => {this.setState({key: tabKey});}}>
          <Tab eventKey={TAB.CLOUD_CONFIG} title={translate('edit.cloud.config')}>
            <CloudConfigTab model={this.props.model} updateGlobalState={this.props.updateGlobalState}
              setDataChanged={this.setDataChanged} tabIndex={TABINDEX.indexOf(TAB.CLOUD_CONFIG)}
              closeAction={this.showConfirmCloseModal}/>
          </Tab>
          <Tab eventKey={TAB.NIC_MAPPINGS} title={translate('edit.nic.mappings')}>
            <NicMappingTab model={this.props.model} updateGlobalState={this.props.updateGlobalState}
              setDataChanged={this.setDataChanged} tabIndex={TABINDEX.indexOf(TAB.NIC_MAPPINGS)}
              ref={instance => {this.nicMappingTab = instance;}}/>
          </Tab>
          <Tab eventKey={TAB.SERVER_GROUPS} title={translate('edit.server.groups')}>
            <ServerGroupsTab model={this.props.model} updateGlobalState={this.props.updateGlobalState}
              setDataChanged={this.setDataChanged} tabIndex={TABINDEX.indexOf(TAB.SERVER_GROUPS)}
              ref={instance => {this.serverGroupsTab = instance;}}/>
          </Tab>
          <Tab eventKey={TAB.NETWORKS} title={translate('edit.networks')}>
            <NetworksTab model={this.props.model} updateGlobalState={this.props.updateGlobalState}
              setDataChanged={this.setDataChanged} tabIndex={TABINDEX.indexOf(TAB.NETWORKS)}
              ref={instance => {this.networksTab = instance;}}/>
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
    }

    return (
      <div>
        <ConfirmModal
          show={this.props.show}
          title={translate('edit.cloud.settings')}
          className={'cloud-settings'}
          hideFooter='true'
          onHide={this.showConfirmCloseModal}>

          {tabs}

        </ConfirmModal>

        <YesNoModal show={this.state.showCloseConfirmation} title={translate('warning')}
          yesAction={this.closeModals} noAction={() => this.setState({showCloseConfirmation: false})}>
          {translate('edit.cloud.settings.close.confirm')}
        </YesNoModal>
      </div>
    );
  }
}

export { EditCloudSettings };
