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
import { HashLink } from 'react-router-hash-link';
import { translate } from '../../localization/localize.js';
import '../../styles/deployer.less';
import { getInternalModel } from './TopologyUtils.js';
import { ErrorBanner } from '../../components/Messages';
import { LoadingMask } from '../../components/LoadingMask';
import { byProperty } from '../../utils/Sort.js';

/*
 * This class is a JavaScript implementation of the script
 * ardana_configurationprocessor/plugins/builders/HTMLDiagram/ServerGroups.py
 * in the config processor
 */
class ServerGroups extends Component {
  constructor(props) {
    super(props);

    this.state = {
      model: undefined,
      errorMessage: undefined,
    };

  }

  componentDidMount() {

    getInternalModel()
      .then((yml) => {

        // Force a re-render if the page is still shown (user may navigate away while waiting)
        if (this.refs.server_groups)
          this.setState({
            model: yml});
      })
      .catch((error) => {
        this.setState({
          errorMessage: error.toString(),
        });
      });
  }

  // Count the number of descendent groups of the given group that are "leafs" (have no descendents)
  // Note that the 'child-count' field in each group is not used in this calculation since it is
  // populated incorrectly -- a group with no children has a child-count of 1.
  countLeafs = (group) => {
    let sum = 0;
    let toCount = [ group ];
    while (toCount.length > 0) {
      const g = toCount.shift();
      if (g.groups && g.groups.length > 0) {
        toCount = toCount.concat(g.groups);
      } else {
        sum += 1;
      }
    }
    return sum;
  }

  renderServerGroups = (groups) => {
    // The groups array supplied here should be in the proper order for presenting

    // Build a set of all network groups used in this server group
    //   and a set of all server roles used by servers in this server group
    let net_groups = new Set();
    let roles = new Set();
    for (const g of groups) {
      for (const net_group of Object.keys(g['network-groups'] || {})) {
        net_groups.add(net_group);
      }

      for (const server of Object.values(g['servers'] || [])) {
        roles.add(server.role);
      }
    }

    const countedGroups = [].concat(groups);
    countedGroups.forEach(g => g.leafs = this.countLeafs(g));

    // Create header row containing server group names, with appropriate row/col spans
    let cells = [ <td key="x"/> ].concat(countedGroups.map(g => (
      <td key={g.name} className='heading' colSpan={g.leafs}>{g.name}</td>
    )));

    let rows = [ <tr key={groups[0].name}>{cells}</tr> ];

    // Add the network group information
    let addedHeader = false;
    for (const net_group of Array.from(net_groups).sort()) {
      let cells = [];

      // Add a header row before the detail lines
      if (! addedHeader) {
        const networks = translate('networks');

        cells = [<td className='sub-heading' key="c1">{translate('network.groups')}</td>]
          .concat(countedGroups.map((g) => <td key={g.name} className='sub-heading' colSpan={g.leafs}>{networks}</td>));

        rows.push(<tr key={'nh'+groups[0].name}>{cells}</tr>);
        addedHeader = true;
      }

      cells = [<td key="c1"><HashLink to={'/topology/networks#'+net_group}>{net_group}</HashLink></td>]
        .concat(countedGroups.map(g => {
          const name = g['network-groups'][net_group];
          const link = name ? <HashLink to={'/topology/networks#'+name}>{name}</HashLink> : undefined;
          return <td key={g.name} colSpan={g.leafs}>{link}</td>;
        }));

      rows.push(<tr key={net_group}>{cells}</tr>);
    }

    // Add the server role information
    addedHeader = false;
    for (const role of Array.from(roles).sort()) {
      let cells = [];

      // Add a header row before the detail lines
      if (! addedHeader) {
        const servers = translate('servers');

        cells = [<td className='sub-heading' key="c1">{translate('server_roles')}</td>]
          .concat(countedGroups.map((g) => <td className='sub-heading' key={g.name} colSpan={g.leafs}>{servers}</td>));

        rows.push(<tr key={'sh'+groups[0].name}>{cells}</tr>);
        addedHeader = true;
      }

      cells = [<td key="c1"><HashLink to={'/topology/roles#'+role}>{role}</HashLink></td>]
        .concat(countedGroups.map(g => {

          let contents;
          if (g.servers) {
            contents = g.servers
              .filter(s => s.role === role)
              .sort()
              .map(s => (
                <div key={s.id}><HashLink to={'/topology/servers#'+s.id}>{s.id}</HashLink> ({s.hostname})</div>));
          }

          return <td key={g.name} colSpan={g.leafs}>{contents}</td>;
        }));

      rows.push(<tr key={role}>{cells}</tr>);
    }

    return rows;
  }

  render () {

    let groupTable;
    if (this.state.model) {

      const serverGroups = this.state.model['internal']['server-groups'];

      // Server groups are structured like a tree, with possibly many
      // levels of nesting, but the model does not plainly identify which
      // server group(s) is at the top of the tree. In order to determine
      // this, all server groups are searched, and any server group that
      // does not appear as a child to some other server group must be
      // at the top of the tree.

      // Find all server groups that are children of other group(s)
      let childGroups = new Set();
      for (const group of Object.values(serverGroups)) {
        for (const child of group['server-groups'] || []) {
          childGroups.add(child);
        }
      }

      // The top-level groups are all groups that do not appear in childGroups
      const topGroups = Object.values(serverGroups)
        .filter(group => ! childGroups.has(group.name))
        .sort(byProperty('name'));

      // Table rows to put into the groupTable
      let rows = [];

      // Repeatedly descend into each level of the tree and generate table rows
      let groups = topGroups;
      while(groups.length > 0) {
        rows = rows.concat(this.renderServerGroups(groups));

        let next_generation = [];
        for (const group of groups) {
          let subgroups = group['groups'] || [];
          subgroups.sort(byProperty('name'));
          next_generation = next_generation.concat(subgroups);
        }

        groups = next_generation;
      }

      groupTable = (
        <table className='table'>
          <tbody>
            {rows}
          </tbody>
        </table>
      );
    }

    return (
      <div ref="server_groups" className='wizard-page'>
        <LoadingMask show={!this.state.model && !this.state.errorMessage}/>
        <div className='wizard-content'>
          <div className='menu-tab-content topology'>
            {groupTable}
          </div>
        </div>
        <div className='banner-container'>
          <ErrorBanner message={this.state.errorMessage} show={this.state.errorMessage !== undefined} />
        </div>
      </div>
    );
  }
}

export default ServerGroups;
