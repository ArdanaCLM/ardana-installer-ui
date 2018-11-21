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
import React, { Component, Fragment } from 'react';
import { HashLink } from 'react-router-hash-link';
import { translate } from '../../localization/localize.js';
import { getInternalModel, noHyphenWrap } from './TopologyUtils.js';
import { ErrorBanner } from '../../components/Messages';
import { LoadingMask } from '../../components/LoadingMask';
import { byEntry, byProperty } from '../../utils/Sort.js';

/*
 * This class is a JavaScript implementation of the script
 * ardana_configurationprocessor/plugins/builders/HTMLDiagram/Networks.py
 * in the config processor
 */
class Networks extends Component {
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
        if (this.refs.networks)
          this.setState({
            model: yml});
      })
      .catch((error) => {
        this.setState({
          errorMessage: error.toString(),
        });
      });
  }

  render_network_topology = (cp_name, cp) => {

    const cluster_names = Object.keys(cp['clusters']).sort();
    const resource_names = Object.keys(cp['resources']).sort();
    const nw_groups = this.state.model['internal']['network-topology']['network_groups'];

    let table_rows = [];
    for (const nw_group_name of Object.keys(nw_groups).sort()) {

      let cells = [];
      for (const cluster_name of cluster_names) {

        let net_list = [];
        for(const [net_name, net_data] of Object.entries(nw_groups[nw_group_name])) {
          if (net_data['control_planes'][cp_name]?.['clusters']?.[cluster_name]) {
            net_list.push(net_name);
          }
        }

        const sorted_list = net_list.sort().map(n => (
          <div key={n}><HashLink to={'#'+n}>{noHyphenWrap(n)}</HashLink></div>));

        cells.push(
          <td key={cluster_name}>{sorted_list}</td>
        );
      }

      for (const resource_name of resource_names) {
        let net_list = [];
        for(const [net_name, net_data] of Object.entries(nw_groups[nw_group_name])) {
          if (net_data['control_planes'][cp_name]?.['resources']?.[resource_name]) {
            net_list.push(net_name);
          }
        }

        const sorted_list = net_list.sort().map(n => (
          <div key={n}><HashLink to={'#'+n}>{noHyphenWrap(n)}</HashLink></div>));

        cells.push(
          <td key={resource_name}>{sorted_list}</td>
        );
      }

      // build row, which has nw_name, all cluster cells, and all resource cells
      table_rows.push(<tr key={nw_group_name}>
        <td key="group_name"><HashLink to={'#' + nw_group_name}>{noHyphenWrap(nw_group_name)}</HashLink></td>
        {cells}
      </tr>);
    }

    const clusters_hdr = cluster_names.map(e => <td key={e}>{e}</td>);
    const resources_hdr = resource_names.map(e => <td key={e}>{e}</td>);

    return (
      <Fragment key={cp_name}>
        <div className='header'>{translate('control_plane', cp_name)}</div>
        <table className='table'>
          <thead>
            <tr>
              <th>{translate('group')}</th>
              <th colSpan={clusters_hdr.length}>{translate('clusters')}</th>
              <th colSpan={resources_hdr.length}>{translate('resources')}</th>
            </tr>
          </thead>
          <tbody>
            <tr className='heading'>
              <td/>
              {clusters_hdr}
              {resources_hdr}
            </tr>
            {table_rows}
          </tbody>
        </table>
      </Fragment>
    );
  }

  render_network_groups = () => {

    const groups = this.state.model['internal']['network-groups'];

    let group_tables = [];

    for (const [group_name, group] of Object.entries(groups).sort(byEntry)) {

      let table_rows = [];
      let cells = [];

      // Build the Network Group cell, which may contain several sub-items
      let cell = [];

      let components = [];
      components = components.concat(group['component-endpoints'] || []);
      components = components.concat(group['tls-component-endpoints'] || []);

      // Add indented list of components
      if (components.length > 0) {
        cell.push(<div key='components' className='label-cell'>{translate('components')}</div>);
        for (const comp of components.sort()) {
          cell.push(<div key={'c.'+comp} className='comp'>
            <HashLink to={'/topology/services#'+comp}>{comp}</HashLink>
          </div>);
        }
      }

      // Add load balancers
      if (group['load-balancers']) {
        cell.push(<div key='lbs' className='label-cell'>{translate('load_balancers')}</div>);
        for (const lb of group['load-balancers']) {
          const lb_name = lb['name'] || lb;

          cell.push(<div key={lb_name} className='comp'>{lb_name}</div>);
          // Add links to any control planes that contain this load balancer
          for (const [cp_name, cp] of Object.entries(this.state.model['internal']['control-planes'])) {
            for (const cp_lb of cp['load-balancers'] || []) {
              if (cp_lb['name'] === lb_name) {
                cell.push(<div key={'lb.'+cp_name} className='comp-dtl'>
                  <HashLink to={'/topology/control_planes#' + cp_name}>{cp_name}</HashLink>
                </div>);
              }
            }
          }
        }
      }

      // Add routes
      if (group['routes']) {
        cell.push(<div key='rtes' className='label-cell'>{translate('routes')}</div>);
        for (const route of group['routes'].sort()) {
          if (groups[route]) {
            cell.push(<div key={'r.'+route} className='comp'><HashLink to={'#'+route}>{route}</HashLink></div>);
          } else {
            cell.push(<div key={'r.'+route} className='comp'>{route}</div>);
          }
        }
      }

      // Add network tags
      let printed_heading = false;
      for (const [cp_name, cp] of Object.entries(this.state.model['internal']['control-planes']).sort(byEntry)) {

        const cp_tags = cp['network-tags'] || {};
        if (cp_tags[group_name]) {

          if (! printed_heading) {
            cell.push(<div key='tags' className='label-cell'>{translate('network_tags')}</div>);
            printed_heading = true;
          }

          cell.push(<div key={cp_name} className='comp'>{translate('control_plane',
            <HashLink to={'/topology/control_planes#' + cp_name}>{cp_name}</HashLink>
          )}</div>);

          const tag_names = new Set();
          cp_tags[group_name].forEach(t => tag_names.add(t.name));

          for (const tag of Array.from(tag_names).sort()) {
            cell.push(<div className='comp-dtl' key={tag}>{tag}</div>);
          }
        }
      }

      cells.push(<td rowSpan={group.networks.length} key="grp">{cell}</td>);

      for (const net of group.networks.sort(byProperty('name'))) {
        // Build the Networks column
        let network_cell = [];
        network_cell.push(<div key="name"><a id={net['name']}/>{net['name']}</div>);

        let subtable = [];
        if (net.vlanid) {
          let format = net['tagged-vlan'] ? 'tagged.vlan.number' : 'untagged.vlan.number';

          subtable.push(<tr key='vlan'>
            <td key='key' className='label-cell'>{translate('vlanid')}</td>
            <td key='val'>{translate(format, net.vlanid)}</td>
          </tr>);
        }

        for (const key of ['cidr', 'gateway-ip', 'mtu']) {
          if (net[key]) {
            subtable.push(<tr key={key}>
              <td key='key' className='label-cell'>{translate(key)}</td>
              <td key='val'>{net[key]}</td>
            </tr>);
          }
        }

        if (subtable) {
          network_cell.push(<table className='nested-table noborder' key='tbl'><tbody>{subtable}</tbody></table>);
        }

        cells.push(<td key="nets">{network_cell}</td>);

        // Build the table in the Address/Server/Interface Model by gathering all of the data,
        // then sorting and formatting it.
        const nw_groups = this.state.model['internal']['network-topology']['network_groups'];
        const address_info = nw_groups[group_name][net['name']]['control_planes'];
        if (address_info) {

          // Gather all of the server data under the clusters and resources section of the net topology
          let entries = [];
          for (const [cp_name, cp] of Object.entries(address_info).sort(byEntry)) {
            for (const section_type of ['clusters','resources']) {
              for (const section of Object.values(cp[section_type] || {}).sort(byEntry)) {
                for (const [server, addr] of Object.entries(section['servers'] || {}).sort(byEntry)) {
                  const s = this.state.model['internal']['servers'].find(e => e.name === server);
                  entries.push({
                    'if_model': s['if-model'],
                    'addr': addr,
                    'server': server,
                    'server_id': s.id,
                    'control_plane': cp_name,
                  });
                }

                for (const [addr, lb_name] of Object.entries(section['vips'] || {}).sort(byEntry)) {
                  entries.push({
                    'addr': addr,
                    'lb_name': lb_name,
                    'control_plane': cp_name,
                  });
                }

                for (const [service, service_data] of Object.entries(section['service_ips'] || {}).sort(byEntry)) {
                  for (const [server, addr] of Object.entries(service_data['hosts'])) {
                    const s = this.state.model['internal']['servers'].find(e => e.name === server);
                    entries.push({
                      'if_model': s['if-model'],
                      'addr': addr,
                      'server': server,
                      'server_id': s.id,
                      'control_plane': cp_name,
                    });
                  }
                  if (service_data.vip) {
                    entries.push({
                      'addr': service_data.vip,
                      'server': translate('vip.for.service', service),
                    });
                  }
                }
              }
            }
          }

          // Sort and format each entry
          const address_rows = entries
            .sort(byProperty('addr', 'server'))
            .map(e => {
              let server_link;
              if (e.server) {
                if (e.server_id) {
                  server_link = <HashLink to={'/topology/servers#'+e.server_id}>{e.server}</HashLink>;
                } else {
                  server_link = e.server;
                }
              } else if (e.control_plane && e.lb_name) {
                server_link = (<><HashLink to={'/topology/control_planes#'+e.control_plane}>
                  {translate('vip.address', e.lb_name)}</HashLink></>);
              }

              let if_link;
              if (e.if_model) {
                if_link = <HashLink to={'/topology/roles#'+e.if_model}>{noHyphenWrap(e.if_model)}</HashLink>;
              }

              return (<tr key={e.addr || e.server}>
                <td key='a' className='nw-group-addr'>{e.addr || ''}</td>
                <td key='s' className='nw-group-server'>{server_link}</td>
                <td key='m'>{if_link}</td>
              </tr>);
            });

          cells.push(<td key="addr" className='nested-table'><table><tbody>{address_rows}</tbody></table></td>);
        }

        table_rows.push(<tr key={net['name']}>{cells}</tr>);
        cells = [];
      }

      group_tables.push(
        <Fragment key={group_name}>
          <a id={group_name}/>
          <div className='header'>{group_name}</div>
          <table className='table'>
            <thead>
              <tr>
                <th>{translate('network-group')}</th>
                <th>{translate('networks')}</th>
                <th>
                  <span className='nw-group-addr'>{translate('address')}</span>
                  <span className='nw-group-server'>{translate('server')}</span>
                  <span>{translate('interface.model')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {table_rows}
            </tbody>
          </table>
        </Fragment>
      );
    }

    return(
      <Fragment key="groups">
        <div className='header'>{translate('network.groups')}</div>
        {group_tables}
      </Fragment>
    );
  }

  render () {

    let summaries;
    if (this.state.model) {
      const cps = this.state.model['internal']['cp-topology']['control_planes'];
      summaries = Object.keys(cps).sort().map(name =>
        this.render_network_topology(name, cps[name]));
    }

    return (
      <div ref="networks" className='wizard-page'>
        <LoadingMask show={!this.state.model && !this.state.errorMessage}/>
        <div className='wizard-content'>
          <div className='menu-tab-content topology'>
            {summaries}
            {this.state.model && this.render_network_groups()}
          </div>
        </div>
        <div className='banner-container'>
          <ErrorBanner message={this.state.errorMessage} show={this.state.errorMessage !== undefined} />
        </div>
      </div>
    );
  }
}

export default Networks;
