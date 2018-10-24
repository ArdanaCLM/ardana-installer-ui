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
import '../styles/deployer.less';
import Cookies from 'universal-cookie';
import { Tabs, Tab } from 'react-bootstrap';
import { translate } from '../localization/localize.js';
import { fetchJson, postJson, putJson, deleteJson } from '../utils/RestUtils.js';
import { ActionButton, LoadFileButton } from '../components/Buttons.js';
import { SearchBar, ServerRolesAccordion } from '../components/ServerUtils.js';
import { BaseInputModal, ConfirmModal } from '../components/Modals.js';
import BaseWizardPage from './BaseWizardPage.js';
import ConnectionCredsInfo from './AssignServerRoles/ConnectionCredsInfo.js';
import ServersAddedManually from './AssignServerRoles/ServersAddedManually.js';
import { ErrorMessage, InfoBanner } from '../components/Messages.js';
import { LoadingMask } from '../components/LoadingMask.js';
import ServerTable from '../components/ServerTable.js';
import ViewServerDetails from '../components/ViewServerDetails.js';
import BaremetalSettings from './AssignServerRoles/BaremetalSettings.js';
import EditServerDetails from '../components/EditServerDetails.js';
import { EditCloudSettings } from './ServerRoleSummary/EditCloudSettings.js';
import { importCSV } from '../utils/CsvImporter.js';
import { fromJS } from 'immutable';
import { isEmpty } from 'lodash';
import $ from 'jquery';
import {
  getServerRoles, isRoleAssignmentValid,  getNicMappings, getServerGroups, getMergedServer,
  updateServersInModel, getAllOtherServerIds, genUID, getCleanedServer, getModelServerIds,
  matchRolesLimit, getModelIPMIAddresses, getModelMacAddresses, getModelIPAddresses
} from '../utils/ModelUtils.js';
import { MODEL_SERVER_PROPS, MODEL_SERVER_PROPS_ALL, IS_MS_EDGE, IS_MS_IE } from '../utils/constants.js';
import { YesNoModal } from '../components/Modals.js';
import HelpText from '../components/HelpText.js';

const AUTODISCOVER_TAB = 1;
const MANUALADD_TAB = 2;
const COOKIES = new Cookies();

class AssignServerRoles extends BaseWizardPage {

  constructor(props) {
    super(props);

    this.connections = props.connectionInfo ? props.connectionInfo : {
      sm: {checked: false, secured: true},
      ov: {checked: false, secured: true}
    };
    this.smApiToken = undefined;
    this.smSessionKey = undefined;
    this.ovSessionKey = undefined;

    // addserver check inputs
    this.checkInputs = props.checkInputs || undefined;

    this.state = {
      //server list on the available servers side
      //could be filtered
      serversAddedManually: [],
      rawDiscoveredServers: [],

      //when move servers the filter text could be cleared
      searchFilterText: '',

      //which tab key selected
      selectedServerTabKey: AUTODISCOVER_TAB,

      //show or not credentials modal
      showCredsModal: false,

      // show modal for adding a server manually
      showAddServerManuallyModal: false,

      // show modal for editing a server that was manually added
      showEditServerAddedManuallyModal: false,

      //when loading data or saving data
      loading: false,

      // error messages
      messages: [],

      //show server details modal
      showServerDetailsModal: false,

      // show edit server details modal
      showEditServerModal: false,

      // active row data to pass into details modal
      activeRowData: undefined,

      // show baremetal settings modal
      showBaremetalSettings: false,

      // delete server confirmation modal
      showDeleteServerConfirmModal: false,

      // import server confirmation modal
      showImportServerConfirmModal: false,
      importedResults: {},

      // add server, wipedisk for all newly added servers
      isWipeDiskChecked: props.operationProps && props.operationProps.wipeDisk || false,

      // add server, activate for all newly added servers
      isActivateChecked: props.operationProps && props.operationProps.activate || false,
    };
  }

  getSmServersData(tokenKey, smUrl, secured) {
    return fetchJson('/api/v1/sm/servers', {
      headers: {
        'Auth-Token': tokenKey,
        'Suse-Manager-Url': smUrl,
        'Secured': secured
      }
    });
  }

  getOvServersData(tokenKey, ovUrl, secured) {
    return fetchJson('/api/v1/ov/servers', {
      headers: {
        'Auth-Token': tokenKey,
        'Ov-Url': ovUrl,
        'Secured': secured
      }
    });
  }

  discoverSmServers(tokenKey, smUrl, secured) {
    let promise = new Promise((resolve, reject) => {
      this.getSmServersData(tokenKey, smUrl, secured)
        .then((rawServerData) => {
          if (rawServerData && rawServerData.length > 0) {
            let ids = rawServerData.map((srv) => {
              return srv.id;
            });

            this.getSmAllServerDetailsData(ids, tokenKey, smUrl, secured)
              .then((details) => {
                rawServerData =
                  this.updateSmServerDataWithDetails(details, rawServerData);
                resolve(rawServerData);
              });
          }
          else {
            resolve([]);
          }
        })
        .catch((error) => {
          let msg = translate('server.discover.sm.error');
          this.setState(prev => { return {
            messages: prev.messages.concat([{msg: [msg, error.toString()]}])
          };});
          reject(error);
        });
    });
    return promise;
  }

  discoverOvServers(tokenKey, ovUrl, secured) {
    let promise = new Promise((resolve, reject) => {
      this.getOvServersData(tokenKey, ovUrl, secured)
        .then((rawServerData) => {
          if (rawServerData && rawServerData.members && rawServerData.members.length > 0) {
            let servers = this.updateOvServerData(rawServerData.members);
            resolve(servers);
          }
          else {
            resolve([]);
          }
        })
        .catch((error) => {
          let msg = translate('server.discover.ov.error');
          this.setState(prev => { return {
            messages: prev.messages.concat([{msg: [msg, error.toString()]}])
          };});
          reject(error);
        });
    });
    return promise;
  }

  //run discovery for suse manager and/or hpe oneview parallelly
  //meanwhile also go update the table data with more details by query
  //detail one by one in parallel.
  discoverAllServers = () => {
    let tasks = [];
    if(this.connections.sm.checked && this.smSessionKey) {
      tasks.push(this.discoverSmServers(
        this.smSessionKey, this.connections.sm.apiUrl, this.connections.sm.secured));
    }
    else if(this.smApiToken) {
      tasks.push(this.discoverSmServers(this.smApiToken, this.getSmUrlEmbedded(), true));
    }

    if(this.connections.ov.checked && this.ovSessionKey) {
      tasks.push(this.discoverOvServers(
        this.ovSessionKey, this.connections.ov.apiUrl, this.connections.ov.secured));
    }

    return Promise.all(tasks);
  }

  saveAllDiscoveredServers(servers) {
    this.deleteDiscoveredServers()
      .then((response) => {
        postJson('/api/v1/server', JSON.stringify(servers))
          .then((response) => {})
          .catch((error) => {
            let msg = translate('server.discover.save.error');
            this.setState(prev => { return {
              messages: prev.messages.concat([{msg: [msg, error.toString()]}])
            };});
          });
      })
      .catch((error) => {
        let msg = translate('server.discover.delete.error');
        this.setState(prev => { return {
          messages: prev.messages.concat([{msg: [msg, error.toString()]}])
        };});
      });
  }

  handleDiscovery = () => {
    if(this.connections.sm.checked) {
      let sKey = COOKIES.get('suseManagerSessionKey');
      this.smSessionKey = sKey; //key or undefined
    }

    if(this.connections.ov.checked) {
      let oKey = COOKIES.get('oneViewSessionKey');
      this.ovSessionKey = oKey; //key or undefined
    }

    this.setState({loading: true, messages: []});
    let resultServers = [];
    this.discoverAllServers()
      .then((allServerData) => {
        allServerData.forEach((oneSet, idx) => {
          resultServers = resultServers.concat(oneSet);
        });
        resultServers = this.sortServersById(resultServers);
        this.saveAllDiscoveredServers(resultServers);
        this.setState({loading: false, rawDiscoveredServers: resultServers});
      })
      .catch((error) => {
        this.setState({loading: false});
      });
  }

  //handle filter text change
  handleSearchText = (filterText) => {
    this.setState({searchFilterText: filterText});
  }

  handleSelectServerTab = (tabKey) =>  {
    this.setState({selectedServerTabKey: tabKey});
  }

  handleAddServerManually = () => {
    this.setState({showAddServerManuallyModal: true});
  }

  renderAddServerManuallyModal = () => {
    if (this.state.showAddServerManuallyModal) {
      return (
        <ServersAddedManually show={this.state.showAddServerManuallyModal} model={this.props.model}
          closeAction={this.closeAddServerManuallyModal} updateGlobalState={this.props.updateGlobalState}
          addAction={this.addServersAddedManually} serversAddedManually={this.state.serversAddedManually}
          rolesLimit={this.props.rolesLimit}
          rawDiscoveredServers={this.state.rawDiscoveredServers}/>
      );
    }
  }

  closeAddServerManuallyModal = () => {
    this.setState({showAddServerManuallyModal: false});
  }

  addServersAddedManually = (serverList) => {
    this.setState((prevState) => {
      return {serversAddedManually: prevState.serversAddedManually.concat(serverList)};});
  }

  showEditServerAddedManuallyModal = (server) => {
    this.setState({showEditServerAddedManuallyModal: true, activeRowData: server});
  }

  renderEditServerAddedManuallyModal = () => {
    let extraProps = {};
    if(this.props.isUpdateMode) {
      extraProps.rolesLimit = this.props.rolesLimit;
    }
    if (this.state.showEditServerAddedManuallyModal) {
      return (
        <ServersAddedManually show={this.state.showEditServerAddedManuallyModal} model={this.props.model}
          closeAction={this.closeEditServerAddedManuallyModal} updateGlobalState={this.props.updateGlobalState}
          updateAction={this.updateServerAddedManually} serversAddedManually={this.state.serversAddedManually}
          rawDiscoveredServers={this.state.rawDiscoveredServers} server={this.state.activeRowData}
          {...extraProps}
        />
      );
    }
  }

  closeEditServerAddedManuallyModal = () => {
    this.setState({showEditServerAddedManuallyModal: false});
  }

  updateServerAddedManually = (server) => {
    const uid = server.uid;
    this.setState((prevState) => {
      let updateIndex = prevState.serversAddedManually.findIndex((server) => {return server.uid === uid;});
      prevState.serversAddedManually[updateIndex] = server;
      return {serversAddedManually: prevState.serversAddedManually};});
  }

  sortServersById(servers) {
    return servers.sort((a, b) => {
      let x = a.id;
      let y = b.id;
      return ((x < y) ? -1 : (x > y) ? 1 : 0);
    });
  }

  saveImportedServers = () => {
    let servers = this.state.importedResults.data ? this.state.importedResults.data : [];
    let model = this.props.model;
    let manualServers = this.state.serversAddedManually.slice();
    let newServers = [];
    let importedErrors = this.state.importedResults.errors ? this.state.importedResults.errors : [];
    let removeFromModelServers = [];

    //show some errors when user confirms importing servers
    if (importedErrors.length > 0) {
      const MAX_LINES = 5;

      let details = importedErrors.slice(0, MAX_LINES);
      if (importedErrors.length > MAX_LINES) {
        details.push('...');
      }

      let title = translate('csv.import.error');
      this.setState(prev => { return {
        messages: prev.messages.concat([{title: title, msg: details}])
      };});
    }

    // if it is update and imported server has the same id or ip-addr or mac-addr or ilo-ip
    // as any server in the model already, it will be ignored
    if(this.props.isUpdateMode) {
      servers = servers.filter(server => {
        const found = model.getIn(['inputModel', 'servers']).some(svr => {
          return (
            svr.get('id') === server['id'] ||
            // server['ip-addr'] imported is always defined
            (svr.get('ip-addr') === server['ip-addr']) ||
            // svr.get('mac-addr') or svr.get('ilo-ip') could be undefined
            // if they are undefined in the model, the server is ok to import
            (svr.get('mac-addr') && svr.get('mac-addr') === server['mac-addr']) ||
            (svr.get('ilo-ip') && svr.get('ilo-ip') === server['ilo-ip'])
          );
        });
        return !found;
      });
    }

    servers.forEach(server => {
      // update manually added servers list
      // find previously imported server with same id and overwrite it
      let sIndex = manualServers.findIndex(svr => {
        return  svr['uid'] && svr['uid'].startsWith('import') && svr['id'] === server.id;
      });
      if(sIndex < 0) {
        newServers.push(server);
      }
      else {
        // use the existing imported server's uid
        server.uid = manualServers[sIndex].uid;
        manualServers[sIndex] = server;
        putJson('/api/v1/server', JSON.stringify(server))
          .catch((error) => {
            let msg = translate('server.import.update.error', server.id);
            this.setState(prev => {
              return {messages: prev.messages.concat([{msg: [msg, error.toString()]}])};});
          });
      }
      // look for previously imported server in the model
      const mIndex = model.getIn(['inputModel', 'servers']).findIndex(svr => {
        return svr.get('uid') && svr.get('uid').startsWith('import') && svr.get('id') === server.id;
      });
      // it is not in the model
      if (mIndex < 0) {
        // it has role, add it to the model
        if(server.role) {
          // The server was not in the model, so add it with the new role
          let new_server = getCleanedServer(server, MODEL_SERVER_PROPS_ALL);
          // Append the server to the input model
          model = model.updateIn(['inputModel', 'servers'], list => list.push(fromJS(new_server)));
        }
      }
      else { // it is in the model, if the imported one still has role, just update
        if(server.role) {
          // Overwrite the existing imported server in input model
          model = model.updateIn(['inputModel', 'servers'], list => list.map(svr => {
            if (svr.get('uid') && svr.get('uid').startsWith('import') && svr.get('id') === server.id) {
              return fromJS(server); //overwrite the exiting with imported one
            }
            else
              return svr;
          }));
        }
        else { //newly imported one doesn't have role anymore, save it to remove together
          removeFromModelServers.push(server.uid);
        }
      }
    });

    // remove servers with no role from model
    if (removeFromModelServers.length > 0) {
      model = model.updateIn(
        ['inputModel', 'servers'], list => list.filter(
          svr => {return removeFromModelServers.indexOf(svr.get('uid')) === -1;})
      );
    }
    // have some imported server, need to add to backend
    if(newServers.length > 0) {
      manualServers = manualServers.concat(newServers);
      postJson('/api/v1/server', JSON.stringify(newServers))
        .catch((error) => {
          let msg = translate('server.import.add.error');
          this.setState(prev => { return {
            messages: prev.messages.concat([{msg: [msg, error.toString()]}])};
          });
        });
    }
    this.props.updateGlobalState('model', model);

    // add or update servers to the left table and the server API
    this.setState(
      {serversAddedManually: manualServers, importedResults: {}, showImportServerConfirmModal: false});
  }

  handleAddServerFromCSV = file => {
    const restrictions = {
      'server-role': getServerRoles(this.props.model).map(e => e['serverRole']),
      'server-groups': getServerGroups(this.props.model),
      'nic-mappings': getNicMappings(this.props.model)
    };

    this.setState({messages: []});
    importCSV(file, restrictions, results => {
      // TODO: Display errors that may exists in results.errors
      for (let server of results.data) {
        server['source'] = 'manual';
        server['uid'] = genUID('import');
      }

      if(this.props.isUpdateMode) {
        // only want to have the roles where it matches rolesLimit
        let matchData = results.data.filter(row =>
          row['role'] === '' || matchRolesLimit(row['role'], this.props.rolesLimit)
        );
        results.data = matchData;
      }

      this.setState({showImportServerConfirmModal: true, importedResults: results});
    });
  }

  handleConfDiscovery = () => {
    if(!this.smApiToken) {
      this.setState({showCredsModal: true});
    }
    else {
      //if embedded don't show configuration
      this.handleDiscovery();
    }
  }

  handleCancelCredsInput = () => {
    this.setState({showCredsModal: false});
  }

  getSmUrl(host, port) {
    let url = 'https://' + host + ':' + (port <= 0 ? '443' : port) + '/rpc/api';
    return url;
  }

  getSmUrlEmbedded() {
    return window.location.protocol + '//' + window.location.host + '/rpc/api';
  }

  getCookieOptions(minutes) {
    let now = new Date();
    let expTime = new Date(now);
    expTime.setMinutes(now.getMinutes() + minutes);

    // if later decide to always run installer with https, add secure: true
    let retOp = {path: '/', expires: expTime, sameSite: true};
    return retOp;
  }

  setSmCredentials = (credsData) => {
    this.connections.sm = credsData.sm;
    this.connections.sm.apiUrl =
      this.getSmUrl(this.connections.sm.creds.host, this.connections.sm.creds.port);
    //save the sessionKey to COOKIES
    COOKIES.set(
      'suseManagerSessionKey', this.connections.sm.sessionKey, this.getCookieOptions(60)
    );
    this.smSessionKey = this.connections.sm.sessionKey;

    // make a copy and delete password for saving later
    // while this.connection.sm still keeps the password in session
    let conn = JSON.parse(JSON.stringify(this.connections.sm));
    delete conn.creds.password;
    return conn;
  }

  setOvCredentials = (credsData) => {
    this.connections.ov = credsData.ov;
    this.connections.ov.apiUrl =
      'https://' + this.connections.ov.creds.host;
    //save the sessionKey to COOKIES
    COOKIES.set(
      'oneViewSessionKey', this.connections.ov.sessionKey, this.getCookieOptions(60)
    );
    this.ovSessionKey = this.connections.ov.sessionKey;

    // make a copy and delete password for saving later
    // while this.connection.ov still keeps the password in session
    let conn = JSON.parse(JSON.stringify(this.connections.ov));
    delete conn.creds.password;
    return conn;
  }

  handleDoneCredsInput = (credsData) => {
    this.setState({showCredsModal: false});
    // need to update saved connections
    let saveConnect =
      this.props.connectionInfo ? JSON.parse(JSON.stringify(this.props.connectionInfo)) : {
        sm: {checked: false, secured: true}, ov: {checked: false, secured: true}};
    if (credsData.sm && credsData.sm.checked) {
      let smConn = this.setSmCredentials(credsData);
      saveConnect.sm = smConn;
    }
    else {  //when unchecked, anything changed will be ignored
      saveConnect.sm.checked = false;
      this.connections.sm.checked = false;
    }

    if (credsData.ov && credsData.ov.checked) {
      let ovConn = this.setOvCredentials(credsData);
      saveConnect.ov = ovConn;
    }
    else { // when unchecked, anything changed will be ignored
      saveConnect.ov.checked = false;
      this.connections.ov.checked = false;
    }

    this.props.updateGlobalState('connectionInfo', saveConnect);

    // go to run discovery
    this.handleDiscovery();
  }

  handleShowServerDetails = (rowData, tableId) => {
    this.setState({showServerDetailsModal: true, activeRowData: rowData});
    this.activeTableId = tableId;
  }

  handleDeleteServer = (server) => {
    this.setState({showDeleteServerConfirmModal: true, activeRowData: server});
  }

  handleCloseServerDetails = () => {
    this.setState({showServerDetailsModal: false, activeRowData: undefined});
    this.activeTableId = undefined;
  }

  handleDoneEditServer = (server, originId) => {
    //update model and save on the spot
    this.updateModelObjectForEditServer(server, originId);

    //update servers and save to the backend
    this.updateServerForEditServer(server);

    this.setState({showEditServerModal: false, activeRowData: undefined});
  }

  handleCancelEditServer = () => {
    this.setState({showEditServerModal: false, activeRowData: undefined});
  }

  handleShowEditServer = (rowData) => {
    this.setState({showEditServerModal: true, activeRowData: rowData});
  }

  handleCloseMessage = (ind) => {
    this.setState((prevState) => {
      let msgs = prevState.messages.slice();
      msgs.splice(ind, 1);
      return {messages: msgs};
    });
  }

  // get model object and saved servers before render UI
  componentDidMount() {
    try {
      //global suse manager token when embedded
      this.smApiToken = apiToken; // eslint-disable-line no-undef
    } catch (ReferenceError) {
      //pass
    }

    fetchJson('/api/v1/server?source=sm,ov')
      .then((rawServerData) => {
        if(rawServerData) {
          this.setState({rawDiscoveredServers : rawServerData});
        }
        getServerRoles(this.props.model);
      })
      .catch((error) => {
        let msg = translate('server.discover.get.error');
        this.setState(prev => { return {
          messages: prev.messages.concat([{msg: [msg, error.toString()]}])
        };});
        //still get model
        getServerRoles(this.props.model);
      });

    // get manually added servers
    fetchJson('/api/v1/server?source=manual')
      .then((responseData) => {
        if (responseData.length > 0) {
          this.setState({serversAddedManually: responseData});
        }
      });
  }

  deleteDiscoveredServers() {
    return deleteJson('/api/v1/server?source=sm,ov');
  }

  checkUpdateServerDataToMatchModel = (serverData, modelServers) => {
    let modelServer = modelServers.find(server => {
      return server.uid === serverData.uid;
    });
    // found same mac address, but different id, update the discovered id
    // to use model's id assume user changed model id and rediscover
    if(modelServer) {
      serverData =
        getMergedServer(serverData, modelServer, MODEL_SERVER_PROPS_ALL);

    }
    return serverData;
  }

  updateSmServerDataWithDetails = (details, servers) => {
    let  modelServers = this.props.model.getIn(['inputModel','servers']).toJS();
    let retData = [];
    //details could contain empty data
    details.forEach((srvDetail) => {
      // promise could return empty detail
      // only pick up non empty detail.
      if(srvDetail && srvDetail.id) {
        let nkdevice = srvDetail.network_devices.find((device) => {
          return device.interface && device.interface.startsWith('eth') && device.ip !== '';
        });
        // still can not find ip address, try one more time
        if (!nkdevice) {
          nkdevice = srvDetail.network_devices.find((device) => {
            return device.interface && device.ip !== '';
          });
        }

        //at this point only these are useful
        let id = srvDetail.name ? srvDetail.name : srvDetail.id + '';
        let serverData = {
          'id': id, //use name if it is there or use id string
          'uid': srvDetail.id + '',
          'ip-addr': nkdevice ? nkdevice.ip : '',
          'mac-addr': nkdevice ? nkdevice.hardware_address : '',
          'ilo-ip': '',
          'ilo-user': '',
          'ilo-password': '',
          'nic-mapping': '',
          'server-group': '',
          'source': 'sm',
          'details': srvDetail //save the details for showing details later
        };

        serverData = this.checkUpdateServerDataToMatchModel(serverData, modelServers);
        retData.push(serverData);
      }
    });

    // for some reason don't have all the details
    // fall back to fill out the data from servers
    if(retData.length < servers.length) {
      let list = [];
      if(retData.length === 0) {
        list = servers;
      }
      else { //some have details, some don't
        // in retData, id = name or id, so use uid which
        // is original server id
        let ids = retData.map((srv) => {
          return srv.uid;
        });
        // servers are the raw data came back from server
        // use server id which is the original server id
        list = servers.filter((srv) => {
          return ids.indexOf(srv.id) === -1;
        });
      }

      let retData2 = list.map((server) => {
        let id = server.name ? server.name : server.id + '';
        let serverData = {
          'id': id, //use name if it is there or use id string
          //'serverId': server.id, //keep this for server reference
          'uid': server.id + '',
          'ip-addr': '',
          'mac-addr': '',
          'ilo-ip': '',
          'ilo-user': '',
          'ilo-password': '',
          'nic-mapping': '',
          'server-group': '',
          'source': 'sm'
        };
        serverData = this.checkUpdateServerDataToMatchModel(serverData, modelServers);
        return serverData;
      });

      retData = retData.concat(retData2);
    }

    return retData;
  }

  updateOvServerData = (servers) => {
    let modelServers = this.props.model.getIn(['inputModel','servers']).toJS();
    let retData = servers.map((srv) => {
      let id = srv.name ? srv.name : srv.uuid + '';
      let ipmi = undefined;
      if(srv.mpHostInfo) {
        ipmi = srv.mpHostInfo.mpIpAddresses.find((addr) => {
          return addr.type === 'DHCP' || addr.type === 'Static';
        });
      }
      //TODO get mac addresse if portMap available

      let serverData = {
        'id': id, //use name if it is there or use id string
        'uid': srv.uuid + '', //keep this for server reference
        'ip-addr': '',
        'mac-addr': '',
        'ilo-ip': ipmi ? ipmi.address : '',
        'ilo-user': '',
        'ilo-password': '',
        'nic-mapping': '',
        'server-group': '',
        'source': 'ov',
        'details': srv //save all the information for showing detail later
      };
      serverData = this.checkUpdateServerDataToMatchModel(serverData, modelServers);
      return serverData;
    });
    return retData;
  }

  //prototype query suse manager for details
  getSmOneServerDetailData = (shimUrlPath, smTokenKey, smUrl, secured) => {
    let promise = new Promise((resolve, reject) => {
      fetchJson(shimUrlPath, {
        headers: {
          'Auth-Token': smTokenKey,
          'Suse-Manager-Url': smUrl,
          'Secured': secured
        }
      })
        .then((responseData) => {
          resolve(responseData);
        })
        .catch(error => {
          resolve({}); //just have no details
        });
    });
    return promise;
  }

  getSmAllServerDetailsData = (serverIds, smTokenKey, smUrl, secured) => {
    let tasks = [];
    serverIds.forEach((id) => {
      let shimUrlPath = '/api/v1/sm/servers/' + id;
      tasks.push(this.getSmOneServerDetailData(shimUrlPath, smTokenKey, smUrl, secured));
    });

    return Promise.all(tasks);
  }

  /**
   * assign a server to a particular role in the datamodel, then update the model and save it
   *
   * @param {Object} server - data object representing the server and its known metadata
   * @param {string} role - the role that the server is to be assigned to as it matches the model
   *   (not the user-friendly translation)
   */
  assignServerToRole = (server, role) => {

    let model = this.props.model;

    const index = model.getIn(['inputModel', 'servers']).findIndex(e => {
      return e.get('uid') ? e.get('uid') === server.uid : e.get('id') === server.id;
    });
    if (index < 0) {
      // The server was not in the model, so add it with the new role
      let new_server = getCleanedServer(server, MODEL_SERVER_PROPS_ALL);
      new_server['role'] = role;

      // Append the server to the input model
      model = model.updateIn(['inputModel', 'servers'], list => list.push(fromJS(new_server)));
    } else {

      // Update the role in the existing input model entry
      model = model.updateIn(['inputModel', 'servers'], list => list.map(svr => {
        // use uid if sever has uid, if it doesn't have uid like the example one, will use
        // id.
        if ((svr.get('uid') && svr.get('uid') === server.uid) || svr.get('id' === server.id))
          return svr.set('role', role);
        else
          return svr;
      }));
    }
    this.props.updateGlobalState('model', model);
  }

  /**
   * trigger server assignment to a role via drag and drop. parses the payload of a ServerRowItem drag event
   * and adds the represented server to the role specified
   *
   * @param {event} event - the browser event for the drop action, should contain a data
   *   JSON object per ServerRowItem.js
   * @param {string} role - the role to assign the server to
   */
  assignServerToRoleDnD = (event, role) => {
    let format = IS_MS_EDGE || IS_MS_IE ? 'text' : 'data';
    let serverData = JSON.parse(event.dataTransfer.getData(format));

    this.assignServerToRole(serverData, role);
    this.unHighlightDrop(event, true);
  }

  /**
   * removes a server from a specified model role, parses the payload of a ServerRowItem drag event for data
   * and them removes the represented server to the role specified
   *
   * @param {event} event - the browser event for the drop action, should contain a data
   *   JSON object per ServerRowItem.js
   */
  removeServerFromRoleDnD = (event) => {
    let format = IS_MS_EDGE || IS_MS_IE ? 'text' : 'data';
    let serverData = JSON.parse(event.dataTransfer.getData(format));
    this.removeServerFromRole(serverData, serverData.role);

    this.unHighlightDrop(event, true);
  }

  /**
   * remove a server from a particular role in the datamodel, then update the model and save it
   *
   * @param {Object} server - data object representing the server and its known metadata
   * @param {String} role - the role that the server is to be assigned to as it matches the model
   *   (not the user-friendly translation)
   */
  removeServerFromRole = (server, role) => {
    // Remove the server from the model
    const model = this.props.model.updateIn(
      ['inputModel', 'servers'], list => list.filter(
        svr => {
          return svr.get('uid') ? svr.get('uid') !== server.uid : svr.get('id') !== server.id;
        })
    );
    this.props.updateGlobalState('model', model);

    // this is for the fake server in the example template
    // assign a uid if it is not there
    if(!server.uid) {
      server.uid = genUID();
    }
    // assign a source if it is not there
    if(!server.source) {
      server.source = 'manual';
    }

    //search the servers lists
    let idx = this.state.serversAddedManually.findIndex(svr => {
      return svr['uid'] === server.uid;
    });
    // can not find in manually added servers list
    if(idx < 0) {
      // clear server role value
      server.role = '';

      // try the discovered server list
      idx = this.state.rawDiscoveredServers.findIndex(svr => {
        return svr['uid'] === server.uid;
      });

      // don't have the server, add it to the manual servers list
      if(idx < 0) {
        this.setState((prevState) => {
          return {serversAddedManually: prevState.serversAddedManually.concat([server])};
        });
        // save to the backend
        postJson('/api/v1/server', JSON.stringify([server]))
          .catch((error) => {
            let msg = translate('server.save.error', server.id);
            this.setState(prev => { return {
              messages: prev.messages.concat([{msg: [msg, error.toString()]}])};
            });
          });
      }
    } else {
      this.setState((prevState) => {
        prevState.serversAddedManually[idx].role = '';
        return {serversAddedManually: prevState.serversAddedManually};
      });
    }
  }

  /**
   * standard drop handler, does not do any validation for now, but that could be added later
   *
   * @param {event} event - the browser event from dragging over a dropzone
   * @param {string} role - the server role represented by this dropzone
   */
  allowDrop = (event, role) => {
    event.preventDefault();
  }

  /**
   * adds an outline highlighting the dropzone for drag and drop server assignment
   * stores the previous settings on the element to be restored later
   *
   * @param {event} event - the browser event from dragEnter
   */
  highlightDrop = (event) => {
    let element = $(event.target); // eslint-disable-line no-undef
    if(!element.hasClass('server-dropzone')) {
      element = element.closest('.server-dropzone');
    }
    element.css('prevoutline', element.css('outline'));
    element.css('prevmargin', element.css('margin'));
    element.css('outline', '2px #00C081 dashed');
    element.css('margin', '2px');
  }

  /**
   * removes the outline around the current dropzone, checks the leave event position before deciding to remove
   * the highlight to make sure its taking the outline off of the correct element. Can be forced to skip
   * the position check with optional forceclear parameter
   *
   * @param {event} event - the browser event from dragLeave
   * @param {boolean} forceclear (optional) - whether to forcibly remove the highlighting
   */
  unHighlightDrop = (event, forceclear) => {
    let element = $(event.target); // eslint-disable-line no-undef
    if(!element.hasClass('server-dropzone')) {
      element = element.closest('.server-dropzone');
    }
    if(forceclear ||
       element.offset().left > event.pageX ||
       element.offset().left + element.width() < event.pageX ||
       element.offset().top >= event.pageY ||
       element.offset().top + element.height() <= event.pageY) {
      element.css('outline', element.css('prevoutline') || '');
      element.css('margin', element.css('prevmargin') || '');
    }
  }

  /**
   * When a server is edited (which is only possible in from the assigned servers page
   * on the right), update the details of the matching entry in the list that backs
   * the available servers (on the left).  This ensures that the correct information
   * is persisted to the discovered server store, and also ensures that no information
   * is dropped when unassigning and reassigning servers to roles.
   */
  updateServerForEditServer = (server) => {
    for (let list of ['rawDiscoveredServers', 'serversAddedManually']) {
      let idx = this.state[list].findIndex(s => server.uid === s.uid);
      if (idx >= 0) {
        let updated_server;
        this.setState(prev => {
          let tempList = prev[list].slice();
          updated_server = getMergedServer(tempList[idx], server, MODEL_SERVER_PROPS);
          tempList.splice(idx, 1, updated_server);
          return {[list]: tempList};
        }, () => {
          putJson('/api/v1/server', JSON.stringify(updated_server))
            .catch((error) => {
              let msg = translate('server.discover.update.error', updated_server.id);
              this.setState(prev => { return {
                messages: prev.messages.concat([{msg: [msg, error.toString()]}])
              };});
            });
        });
        break;
      }
    }
  }

  /**
   * When a server is remove it from the applicable lists  (discovered or manual).
   */
  deleteServer = () => {
    let deleted_server = this.state.activeRowData;
    for (let list of ['rawDiscoveredServers', 'serversAddedManually']) {
      let idx = this.state[list].findIndex(s => deleted_server.uid === s.uid);
      if (idx >= 0) {
        if (!deleted_server.source) {
          deleted_server.source = this.state[list][idx].source;
        }
        this.setState(prev => {
          prev[list].splice(idx, 1);
          return {[list]: prev[list]};
        }, () => {
          deleteJson(
            '/api/v1/server?source=' + deleted_server.source +'&uid=' + deleted_server.uid)
            .catch((error) => {
              let msg = translate('server.discover.delete.server.error', deleted_server.id);
              this.setState(prev => { return {
                messages: prev.messages.concat([{msg: [msg, error.toString()]}]),
                activeRowData: undefined,
              };});
            });
        });
        break;
      }
    }
    // remove server from right table
    if (deleted_server.role !== '') {
      let index = this.props.model.getIn(['inputModel', 'servers']).findIndex(
        server => server.get('id') === deleted_server.id);
      let newModel = this.props.model.removeIn(['inputModel', 'servers', index]);
      this.props.updateGlobalState('model', newModel);
    }
    this.setState({showDeleteServerConfirmModal: false});
  }

  updateModelObjectForEditServer = (server, origId) => {

    let model =
      updateServersInModel(server, this.props.model, MODEL_SERVER_PROPS_ALL, origId);
    this.props.updateGlobalState('model', model);
  }


  //check if we have enough servers roles for the model
  isValid = () => {
    return getServerRoles(this.props.model).every(role => {
      return isRoleAssignmentValid(role);
    });
  }

  getSourceData = (activeRowData, activeTableId) => {
    if(!activeRowData || !activeTableId) {
      return;
    }
    let sourceData = undefined;
    if(activeTableId.startsWith('letfTableId')) {
      return activeRowData; //left side table always has source
    }
    else {
      let id = activeRowData.id; //should be a name or id
      //go to the leftside list for find data
      sourceData = this.state.rawDiscoveredServers.find((server) => {
        return id === server.id;
      });
      if(!sourceData) {
        sourceData = this.state.serversAddedManually.find((server) => {
          return id === server.id;
        });
      }
    }
    return sourceData;
  }

  setNextButtonDisabled = () => !this.isValid();

  handleWipeDiskCheck = () => {
    this.setState(prev => {
      let isChecked = !prev.isWipeDiskChecked;
      let opProps = {};
      //retain all other operationProps if there are any
      if (this.props.operationProps) {
        opProps = Object.assign({}, this.props.operationProps);
      }
      opProps['wipeDisk'] = isChecked;
      // save to the global
      this.props.updateGlobalState('operationProps', opProps);

      return {isWipeDiskChecked: isChecked};
    });
  }

  handleActivateCheck = () => {
    this.setState(prev => {
      let isChecked = !prev.isActivateChecked;
      let opProps = {};
      //retain all other operationProps if there are any
      if (this.props.operationProps) {
        opProps = Object.assign({}, this.props.operationProps);
      }
      opProps['activate'] = isChecked;
      // save to the global
      this.props.updateGlobalState('operationProps', opProps);

      return {isActivateChecked: isChecked};
    });
  }

  renderErrorMessage() {
    if (!isEmpty(this.state.messages)) {
      let msgList = [];
      this.state.messages.map((msgObj, ind) => {
        let theProps = {message: msgObj.msg};
        if(msgObj.title) {
          theProps.title = msgObj.title;
        }
        msgList.push(
          <ErrorMessage key={ind} closeAction={() => this.handleCloseMessage(ind)}
            {...theProps}/>);
      });
      return (
        <div className='notification-message-container'>{msgList}</div>
      );
    }
  }

  renderLoadingMask() {
    return (
      <LoadingMask show={this.state.loading}></LoadingMask>
    );
  }

  renderAvailServersTable(servers,  type) {
    //displayed columns
    let tableConfig = {
      columns: [
        {name: 'id'},
        {name: 'uid', hidden: true},
        {name: 'ip-addr',},
        {name: 'mac-addr'},
        {name: 'server-group', hidden: true},
        {name: 'nic-mapping', hidden: true},
        {name: 'ilo-ip', hidden: true},
        {name: 'ilo-user', hidden: true},
        {name: 'ilo-password', hidden: true},
        {name: 'source', hidden: true}
      ]
    };

    const assignedServerIds = this.props.model.getIn(['inputModel','servers'])
      .filter(svr => (svr.get('role') ? true : false))   // find servers with roles
      .map(svr => svr.get('uid')).toJS();                // return just the uid field

    //apply name and assignment filter here
    let filteredAvailableServers =
      servers.filter((server) => {
        // search text applied to name , ip-addr and mac-addr
        if(!(server.id.indexOf(this.state.searchFilterText) !== -1 ||
          (server['ip-addr'] && server['ip-addr'].indexOf(this.state.searchFilterText) !== -1) ||
          (server['mac-addr'] && server['mac-addr'].indexOf(this.state.searchFilterText) !== -1))) {
          return false;
        }

        // server id is acceptable per text filter, now need to filter
        // out assigned servers using uid
        return (assignedServerIds.indexOf(server.uid) === -1);
      });

    let tableId = 'leftTableId' + type;
    return (
      <ServerTable
        id={tableId}
        tableConfig={tableConfig}
        tableData={filteredAvailableServers}
        viewAction={this.handleShowServerDetails}
        editAction={type === '_manual' ? this.showEditServerAddedManuallyModal : undefined}
        deleteAction={this.handleDeleteServer}>
      </ServerTable>
    );
  }

  toDisableCheckboxes = () => {
    return (
      this.props.processOperation || this.props.wizardLoading || this.props.wizardLoadingErrors
    );
  }

  renderAutoDiscoverContent() {
    //only render when don't have any raw discovered data or not suse manager embedded
    if(this.state.rawDiscoveredServers.length === 0) {
      return (
        <div className='centered'>
          <ActionButton
            clickAction={this.handleConfDiscovery}
            displayLabel={translate('add.server.discover')}/>
        </div>
      );
    }
    else {
      return (
        <div>
          {this.renderAvailServersTable(this.state.rawDiscoveredServers, '_auto')}
        </div>
      );
    }
  }

  renderManualDiscoverContent = () => {
    if (this.state.serversAddedManually.length > 0) {
      return (
        <div className='full-width'>
          {this.renderAvailServersTable(this.state.serversAddedManually, '_manual')}
        </div>
      );
    } else {
      // When there are no servers yet added, the tab shows just
      // two buttons instead of content
      return (
        <div className='centered'>
          <div className='stacked'>
            <ActionButton
              clickAction={this.handleAddServerManually}
              displayLabel={translate('add.server.add')}/>
          </div>
          <LoadFileButton
            clickAction={this.handleAddServerFromCSV}
            displayLabel={translate('add.server.add.csv')}/>
        </div>
      );
    }
  }

  closeBaremetalSettings = () => {
    this.setState({showBaremetalSettings: false});
  }

  renderBaremetalSettings = () => {
    return (
      <BaremetalSettings show={this.state.showBaremetalSettings}
        model={this.props.model} cancelAction={this.closeBaremetalSettings}
        updateGlobalState={this.props.updateGlobalState}/>
    );
  }

  renderAvailableServersTabs() {
    return (
      <Tabs
        activeKey={this.state.selectedServerTabKey}
        onSelect={this.handleSelectServerTab} id='AvailableServerTabsId'>
        <Tab
          eventKey={AUTODISCOVER_TAB} title={translate('add.server.auto.discover')}>
          {this.state.selectedServerTabKey === AUTODISCOVER_TAB && this.renderAutoDiscoverContent()}
        </Tab>
        <Tab
          eventKey={MANUALADD_TAB} title={translate('add.server.manual.add')}>
          {this.state.selectedServerTabKey === MANUALADD_TAB && this.renderManualDiscoverContent()}
        </Tab>
      </Tabs>
    );
  }

  renderSearchBar() {
    if (this.state.selectedServerTabKey === MANUALADD_TAB &&
      this.state.serversAddedManually.length > 0) {
      return (
        <div className='action-line table-header-wrapper'>
          <div className='action-item-left'>
            <SearchBar
              filterText={this.state.searchFilterText}
              filterAction={this.handleSearchText}>
            </SearchBar>
          </div>
          <div>
            <div className='btn-row action-item-right'>
              <ActionButton type='default'
                clickAction={this.handleAddServerManually}
                displayLabel={translate('add.server.add')}/>
              <LoadFileButton type='default'
                clickAction={this.handleAddServerFromCSV}
                displayLabel={translate('add.server.add.csv.alt')}/>
            </div>
          </div>
        </div>
      );
    } else if (this.state.selectedServerTabKey === AUTODISCOVER_TAB &&
      this.state.rawDiscoveredServers.length > 0) {
      return (
        <div className='action-line table-header-wrapper'>
          <div className='action-item-left'>
            <SearchBar
              filterText={this.state.searchFilterText}
              filterAction={this.handleSearchText}>
            </SearchBar>
          </div>
          <div>
            <div className='btn-row action-item-right'>
              <ActionButton type='default'
                clickAction={this.handleConfDiscovery}
                displayLabel={translate('add.server.discover')}/>
            </div>
          </div>
        </div>
      );
    }
    else {
      return (
        <div className='table-header-wrapper'>
          <SearchBar
            filterText={this.state.searchFilterText}
            filterAction={this.handleSearchText}>
          </SearchBar>
        </div>
      );
    }
  }

  renderServerRolesAccordion(serverRoles) {
    let serverIds = getModelServerIds(this.props.model);
    //let serverIds = find all serversIds from manual and auto
    let tempDups = serverIds.filter((id, idx) => {
      let firstIndex = serverIds.indexOf(id);
      let lastIndex = serverIds.lastIndexOf(id);
      if(firstIndex !== lastIndex) {
        return true;
      }
    });
    let dupIds = [...new Set(tempDups)];

    let extraProps = {};
    if (this.props.isUpdateMode) {
      extraProps.isUpdateMode = this.props.isUpdateMode;
      extraProps.deployedServers = this.props.deployedServers;
      extraProps.checkInputs = this.checkInputs;
      let modelServerAddresses =
        this.props.model.getIn(['inputModel','servers']).map(server => {
          return {
            'id': server.get('id'), 'ip-addr': server.get('ip-addr'), 'mac-addr': server.get('mac-addr'),
            'ilo-ip': server.get('ilo-ip')
          };
        }).toJS();
      extraProps.checkNewDupAddresses = {
        modelServerAddresses: modelServerAddresses
      };
    }
    return (
      <ServerRolesAccordion
        ondropFunct={this.assignServerToRoleDnD}
        ondragEnterFunct={this.highlightDrop}
        ondragLeaveFunct={this.unHighlightDrop}
        allowDropFunct={this.allowDrop}
        serverRoles={serverRoles}
        tableId='rightTableId' checkDupIds={dupIds}
        viewAction={this.handleShowServerDetails}
        editAction={this.handleShowEditServer}
        deleteAction={this.handleDeleteServer}
        {...extraProps}>
      </ServerRolesAccordion>
    );
  }

  renderWipeDisk() {
    let className =
      'addserver-options' + (!this.toDisableCheckboxes() ? '' : ' disabled');
    return (
      <div className={className}>
        <input disabled={this.toDisableCheckboxes()} className='wipe-disk-option'
          type='checkbox' value='wipedisk'
          checked={this.state.isWipeDiskChecked} onChange={this.handleWipeDiskCheck}/>
        {translate('common.wipedisk')}
        <HelpText tooltipText={translate('server.addserver.wipedisk.message')}/>
      </div>
    );
  }

  renderActivate() {
    let className =
      'addserver-options' + (!this.toDisableCheckboxes() ? '' : ' disabled');
    return (
      <div className={className}>
        <input disabled={this.toDisableCheckboxes()}
          className='wipe-disk-option' type='checkbox' value='activate'
          checked={this.state.isActivateChecked} onChange={this.handleActivateCheck}/>
        {translate('common.activate')}
        <HelpText tooltipText={translate('server.addserver.activate.message')}/>
      </div>
    );
  }

  renderEmptyRolesInfo() {
    return (
      <div className='banner-container'>
        <InfoBanner
          message={translate('server.addserver.empty.computeroles.info')} show={true}/>
      </div>
    );
  }

  renderServerRoleContent() {
    let serverRoles = getServerRoles(this.props.model, this.props.rolesLimit);
    let isValidToRenderAccordion = serverRoles && serverRoles.length > 0;
    return (
      <div className='assign-server-role body-container'>
        <div className='server-container'>
          {this.renderSearchBar()}
          <div className="server-table-container rounded-corner server-dropzone"
            onDrop={(event) => this.removeServerFromRoleDnD(event)}
            onDragOver={(event) => this.allowDrop(event, undefined)}
            onDragEnter={(event) => this.highlightDrop(event)}
            onDragLeave={(event) => this.unHighlightDrop(event)}>
            {this.renderAvailableServersTabs()}
          </div>
        </div>
        <div className="server-container right-col">
          <div className="server-table-container role-accordion-container rounded-corner">
            {isValidToRenderAccordion && this.renderServerRolesAccordion(serverRoles)}
            {this.props.isUpdateMode && !isValidToRenderAccordion && this.renderEmptyRolesInfo()}
          </div>
          {this.props.isUpdateMode && isValidToRenderAccordion && this.renderWipeDisk()}
          {this.props.isUpdateMode && isValidToRenderAccordion && this.renderActivate()}
        </div>

      </div>
    );
  }

  renderCredsInputModal() {
    return (
      <BaseInputModal
        show={this.state.showCredsModal}
        className='creds-dialog'
        onHide={this.handleCancelCredsInput}
        title={translate('add.server.connection.creds')}>

        <ConnectionCredsInfo
          cancelAction={this.handleCancelCredsInput}
          doneAction={credsData => this.handleDoneCredsInput(credsData)}
          data={this.connections}>
        </ConnectionCredsInfo>
      </BaseInputModal>
    );
  }

  renderServerDetailsModal() {
    //if the activeRowData is from the right side table...it doesn't have the
    //source ...need to find source data which has the details
    let sourceData =
      this.getSourceData(this.state.activeRowData, this.activeTableId);

    let extraProps = {};
    let dialogClass = 'view-details-dialog ';
    if(sourceData && (sourceData.source === 'sm' || sourceData.source === 'ov')) {
      extraProps.tableId = this.activeTableId;
      extraProps.source = sourceData.source;
      extraProps.details = sourceData.details;
      dialogClass = dialogClass + 'more-width';
    }

    return (
      <ConfirmModal show={this.state.showServerDetailsModal} className={dialogClass} hideFooter
        onHide={this.handleCloseServerDetails} title={translate('view.server.details.heading')}>
        <ViewServerDetails data={this.state.activeRowData} {...extraProps}/>
      </ConfirmModal>
    );
  }

  renderEditServerDetailsModal() {
    let extraProps = {};
    if(this.state.activeRowData) {
      // check against all the server ids to make sure
      // whatever changes on id won't conflict with other
      // ids.
      let ids =
        getAllOtherServerIds(
          this.props.model, this.state.rawDiscoveredServers,
          this.state.serversAddedManually, this.state.activeRowData.id);
      extraProps.ids = ids;

      if(this.props.isUpdateMode) {
        // check against other existing addresses
        extraProps.isUpdateMode = this.props.isUpdateMode;
        extraProps.existMacAddressesModel =
          getModelMacAddresses(this.props.model, this.state.activeRowData['mac-addr']);
        extraProps.existIPMIAddressesModel =
          getModelIPMIAddresses(this.props.model, this.state.activeRowData['ilo-ip']);
        extraProps.existIPAddressesModel =
          getModelIPAddresses(this.props.model, this.state.activeRowData['ip-addr']);
      }
    }

    return (
      <BaseInputModal
        show={this.state.showEditServerModal}
        className='edit-details-dialog'
        onHide={this.handleCancelEditServer}
        title={translate('edit.server.details.heading')}>

        <EditServerDetails
          cancelAction={this.handleCancelEditServer}
          doneAction={this.handleDoneEditServer}
          model={this.props.model}
          updateGlobalState={this.props.updateGlobalState}
          data={this.state.activeRowData}
          {...extraProps}>
        </EditServerDetails>
      </BaseInputModal>
    );
  }

  renderCloudSettings() {
    return (
      <EditCloudSettings
        show={this.state.showCloudSettings}
        onHide={() => this.setState({showCloudSettings: false})}
        model={this.props.model}
        updateGlobalState={this.props.updateGlobalState}/>
    );
  }

  renderInstallContentHeading() {
    return (
      <div className='content-header'>
        <div className='titleBox'>
          {this.renderHeading(translate('add.server.heading'))}
        </div>
        <div className='buttonBox'>
          <div className='btn-row'>
            <ActionButton displayLabel={translate('edit.cloud.settings')} type='default'
              clickAction={() => this.setState({showCloudSettings: true})} />
            <ActionButton displayLabel={translate('add.server.set.network')} type='default'
              clickAction={() => this.setState({showBaremetalSettings: true})}/>
          </div>
        </div>
      </div>
    );
  }

  render() {
    let serverId = (this.state.activeRowData && this.state.activeRowData.id) ? this.state.activeRowData.id : '';
    const contentClass =
      'wizard-content' + (this.props.isUpdateMode ? ' smaller-margin' : '');
    return (
      <div className='wizard-page'>
        {!this.props.isUpdateMode && this.renderCloudSettings()}
        {!this.props.isUpdateMode && this.renderInstallContentHeading()}
        <YesNoModal show={this.state.showDeleteServerConfirmModal} title={translate('warning')}
          yesAction={this.deleteServer}
          noAction={() => this.setState({showDeleteServerConfirmModal: false})}>
          {translate('server.delete.server.confirm', serverId)}
        </YesNoModal>
        <YesNoModal show={this.state.showImportServerConfirmModal} title={translate('warning')}
          yesAction={this.saveImportedServers}
          noAction={() => this.setState({showImportServerConfirmModal: false, importedResults: {}})}>
          {this.props.isUpdateMode ?
            translate('server.import.server.confirm.limit.conflict') :
            translate('server.import.server.confirm')}
        </YesNoModal>
        <div id='AssignServerRoleId' className={contentClass}>
          {this.renderServerRoleContent()}
          {this.renderCredsInputModal()}
          {this.renderAddServerManuallyModal()}
          {this.renderEditServerAddedManuallyModal()}
          {this.renderServerDetailsModal()}
          {this.renderEditServerDetailsModal()}
          {this.renderLoadingMask()}
          {this.renderErrorMessage()}
          {!this.props.isUpdateMode && this.renderBaremetalSettings()}
        </div>
        {!this.props.isUpdateMode && this.renderNavButtons()}
      </div>
    );
  }
}

export default AssignServerRoles;
