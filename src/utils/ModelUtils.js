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
import { Map } from 'immutable';
import { alphabetically, byServerNameOrId } from './Sort.js';
import { MODEL_SERVER_PROPS_ALL } from './constants.js';

export function isRoleAssignmentValid (role, checkInputs) {
  let minCount =  role.minCount;
  let memberCount = role.memberCount;
  let svrSize = role.servers.length;
  if (memberCount && svrSize !== memberCount) {
    return false;
  }
  if(minCount && svrSize < minCount) {
    return false;
  }

  //check ids duplicates
  let ids = role.servers.map(svr => svr.id);
  let idSet = new Set(ids);
  if(ids.length > idSet.size) {
    return false;
  }

  if(checkInputs) {
    return role.servers.every((server) =>
      checkInputs.every(key => (server[key] ? true : false))
    );
  }
  return true;
}

export function getServerGroups(model) {
  let groups = model.getIn(['inputModel','server-groups'])
    .sort((a,b) => alphabetically(a.get('name'), b.get('name')))
    .map(group => group.get('name')).toJS();
  return groups;
}

export function getNicMappings(model) {
  return model.getIn(['inputModel','nic-mappings'])
    .sort((a,b) => alphabetically(a.get('name'), b.get('name')))
    .map(nic => nic.get('name')).toJS();
}

export function getModelServerIds(model) {
  let ids = model.getIn(['inputModel','servers'])
    .map(server => server.get('id')).toJS();
  return ids;
}

export function getAllOtherServerIds (model, autoServers, manualServers, theId) {
  let retIds = [];
  let modelIds= model.getIn(['inputModel','servers'])
    .map(server => server.get('id')).toJS();

  if(theId) {
    let idx = model.getIn(['inputModel', 'servers']).findIndex(
      server => server.get('id') === theId
    );
    //if have current id, remove current id so won't check against it
    if (idx !== -1) {
      modelIds.splice(idx, 1);
    }
  }

  let autoServerIds = [];
  if (autoServers && autoServers.length > 0) {
    autoServerIds = autoServers.map(server => server.id);
    if(theId) {
      let idx = autoServerIds.findIndex(id => id === theId);
      // if have it in auto discovered servers, remove it.
      if (idx !== -1) {
        autoServerIds.splice(idx, 1);
      }
    }
  }

  let manualServerIds = [];
  if(manualServers && manualServers.length > 0) {
    manualServerIds = manualServers.map(server => server.id);
    if(theId) {
      let idx = manualServerIds.findIndex(id => id === theId);
      // if have it in manual added servers, remove it.
      if (idx !== -1) {
        manualServerIds.splice(idx, 1);
      }
    }
  }
  retIds = modelIds.concat(autoServerIds);
  retIds = retIds.concat(manualServerIds);

  return retIds;
}

export function getCleanedServer(srv, props) {
  let retServer = {};
  props.forEach(key => {
    if(srv[key] !== undefined && srv[key] !== '') {
      retServer[key] = srv[key];
    }
  });
  return retServer;
}

// Retrieve summarized server role information from the model
// Each element in this list is an object containing:
// - name        : the displayed name, such as "compute"
// - serverRole  : the role name, such as "COMPUTE-ROLE"
// - servers[]   : list of servers that have the role
// - minCount    : minimum count of servers in the role
//     or
// - memberCount : exact count of servers in the role
// - group       : 'clusters' or 'resources' (the type of role)
export function getServerRoles (model) {
  const servers = model.getIn(['inputModel', 'servers']).toJS();

  // TODO: Handle multiple control planes
  const cpData = model.getIn(['inputModel', 'control-planes', '0']).toJS();

  let results = [];
  for (let group of ['clusters','resources']) {
    results = results.concat(cpData[group].map((res) => {
      let role = {
        'name': res['name'],
        'serverRole': res['server-role'],
        'group': group,
        'servers': servers
          .filter(s => s.role === res['server-role'])
          .map(s => getCleanedServer(s, MODEL_SERVER_PROPS_ALL))          // filter out any extra fields
          .sort((a,b) => byServerNameOrId(a,b))   // sort servers by name or id within each role
      };
      if (group === 'clusters') {
        if (res['member-count'] || res['member-count'] === 0) {
          role['memberCount'] = res['member-count'];
        } else if (res['min-count'] || res['min-count'] === 0) {
          role['minCount'] = res['min-count'];
        }
      } else {
        role['minCount'] = res['min-count'] || 0;
      }
      return role;
    }));
  }
  // Sort the role list by role name
  return results.sort((a,b) => alphabetically(a['name'],b['name']));
}

// Merges the relevant properties of destination server into the src and returns the merged version.  Neither
// src or dest are modified
export function  getMergedServer (src, dest, props)  {
  let result = Object.assign({}, src);
  props.forEach(p => {
    if (p in dest)
      result[p] = dest[p];
  });

  return result;
}

// private function for merging Map before save to the model
function getMergedServerMap (src, dest, props) {
  let result = getMergedServer(src.toJS(), dest, props);
  return Map(result);
}

export function updateServersInModel(server, model, props, originId) {
  let retModel = model.updateIn(['inputModel','servers'], list => list.map(svr => {
    // originId is used to deal with example model item where it has no uid to begin
    // with
    if ((originId && svr.get('id') === originId) || (svr.get('uid') === server.uid)) {
      let update_server = getMergedServerMap(svr, server, props);
      // clean up unwanted entries before save to the model so it
      // can pass model validator
      update_server = update_server.filter((value, key) => {
        return value !== undefined && value !== '';
      });
      return update_server;
    }
    else {
      return svr;
    }
  }));

  return retModel;
}

export function genUID(prefix) {
  function hex4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1).toUpperCase();
  }
  let hexStr =
    hex4() + hex4()  + hex4() +  hex4()  + hex4() + hex4() + hex4() + hex4();
  let retID =  prefix ? prefix + '_'  + hexStr : hexStr;
  return retID;
}

