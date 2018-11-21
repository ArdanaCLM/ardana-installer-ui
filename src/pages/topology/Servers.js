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
import { getInternalModel, noHyphenWrap } from './TopologyUtils.js';
import { ErrorBanner } from '../../components/Messages';
import { LoadingMask } from '../../components/LoadingMask';
import { byProperty, byEntry } from '../../utils/Sort.js';

/*
 * This class is a JavaScript implementation of the script
 * ardana_configurationprocessor/plugins/builders/HTMLDiagram/ServerGroups.py and
 * ardana_configurationprocessor/plugins/builders/HTMLDiagram/Servers.py
 * in the config processor
 */
class Servers extends Component {
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
      if (g.groups?.length > 0) {
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
          return (
            <td key={g.name} colSpan={g.leafs}>
              <If condition={name}>
                <HashLink to={`/topology/networks#${name}`}>
                  {name}
                </HashLink>
              </If>
            </td>
          );
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
                <div key={s.id}><HashLink to={'#'+s.id}>{s.id}</HashLink> ({s.hostname})</div>));
          }

          return <td key={g.name} colSpan={g.leafs}>{contents}</td>;
        }));

      rows.push(<tr key={role}>{cells}</tr>);
    }

    return rows;
  }

  renderGroupTable = () => {
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

    return (
      <table className='table'>
        <tbody>
          {rows}
        </tbody>
      </table>
    );
  }

  renderServers = () => {

    const servers = this.state.model['internal']['servers'];

    // Create the rows for each server
    const rows = servers.sort(byProperty('id')).map(s => {
      let control_plane;

      // If the state is still 'available' (unallocated), then the control_plane is missing
      if (s.state !== 'available') {
        control_plane = (<HashLink to={'/topology/control_planes#'+s['control-plane-name']}>
          {s['control-plane-name']}</HashLink>);
      }

      // Create the rows for the nested table of service groups and components
      const service_rows = Object.entries(s.services).sort(byEntry).map(e => {
        const [service_group, component] = e;
        const services = component.sort().join(', ');

        return (<tr key={service_group}>
          <td><HashLink to={'/topology/services#'+service_group}>{service_group}</HashLink></td>
          <td>{noHyphenWrap(services)}</td>
        </tr>);
      });

      // Create the rows for the nested table of network devices and routes
      let net_rows = [];
      if (s.interfaces) {
        for(const[if_name, if_data] of Object.entries(s.interfaces).sort(byEntry)) {
          const networks = if_data.networks || {};

          let first_row = true;
          const net_count = Object.entries(networks).length;
          for(const [net_name, net_data] of Object.entries(networks).sort(byEntry)) {
            let cells = [];
            if (first_row) {
              cells.push(<td key='n' rowSpan={net_count}>{if_name}</td>);
            }

            const address = net_data.addr ? ' ('+net_data.addr+')' : '';
            cells.push(<td key='i'><HashLink to={'/topology/networks#'+net_name}>
              {noHyphenWrap(net_name)}</HashLink>{address}</td>);

            const routes = (net_data.routes || []).sort(byProperty('net_name'))
              .map(e => {
                if (e.default) {
                  return (<div key='default'>default</div>);
                } else {
                  return (
                    <div key={e.net_name}>
                      <HashLink to={'/topology/networks#'+e.net_name}>{noHyphenWrap(e.net_name)}</HashLink>
                    </div>);
                }
              });
            cells.push(<td key='r'>{routes}</td>);

            net_rows.push(<tr key={net_rows.length}>{cells}</tr>);

            first_row = false;
          }
        }
      }

      // Create the rows for the nested table of nic mappings
      let nic_mapping_rows;
      if (s.nic_map) {
        nic_mapping_rows = s.nic_map['physical-ports'].map(e => (
          <tr key={e['bus-address']}>
            <td key='b'>{e['bus-address']}</td>
            <td key='n'>{e['logical-name']}</td>
            <td key='t'>{noHyphenWrap(e['type'])}</td>
          </tr>
        ));
      }

      return (<tr key={s.id}>
        <td key='id'><a id={s.id}/>{s.id}</td>
        <td key='n'>{s.name}</td>
        <td key='r'><HashLink to={'/topology/roles#'+s.role}>{s.role}</HashLink></td>
        <td key='s'>{s.state}</td>
        <td key='cp'>{control_plane}</td>
        <td key='sv' className='nested-table'><table className='nested-table'><tbody>{service_rows}</tbody></table></td>
        <td key='ns' className='nested-table'><table className='nested-table nw-interfaces'>
          <tbody>{net_rows}</tbody></table></td>
        <td key='nm' className='nested-table'><table className='nested-table'>
          <tbody>{nic_mapping_rows}</tbody></table></td>
      </tr>);
    });

    if (rows.length > 0) {
      return (
        <table className='table'>
          <thead>
            <tr>
              <th>{translate('server.id.prompt')}</th>
              <th>{translate('name')}</th>
              <th>{translate('role')}</th>
              <th>{translate('state')}</th>
              <th>{translate('control_plane.heading')}</th>
              <th>{translate('service.groups.components')}</th>
              <th>{translate('network.devices.routes')}</th>
              <th>{translate('edit.nic.mappings')}</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      );
    }
  }

  render () {

    let groupTable;
    let servers;
    if (this.state.model) {
      groupTable = this.renderGroupTable();
      servers = this.renderServers();
    }

    return (
      <div ref="server_groups" className='wizard-page'>
        <LoadingMask show={!this.state.model && !this.state.errorMessage}/>
        <div className='wizard-content'>
          <div className='menu-tab-content topology'>
            <div className='header'>{translate('server_groups')}</div>
            {groupTable}
            <div className='header'>{translate('servers')}</div>
            {servers}
          </div>
        </div>
        <div className='banner-container'>
          <ErrorBanner message={this.state.errorMessage} show={this.state.errorMessage !== undefined} />
        </div>
      </div>
    );
  }
}

export default Servers;
