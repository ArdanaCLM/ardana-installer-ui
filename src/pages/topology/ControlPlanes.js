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
import '../../styles/deployer.less';
import { fetchJson } from '../../utils/RestUtils.js';

const Fragment = React.Fragment;
/*
 * This class is a JavaScript implementation of the script
 * ardana_configurationprocessor/plugins/builders/HTMLDiagram/ControlPlanes.py
 * in the config processor
 */
class ControlPlanes extends Component {
  constructor(props) {
    super(props);

    this.state = {
      model: undefined
    };

    this.cloud_internal = undefined;
    this.control_planes = undefined;
    this.servers = undefined;
    this.server_by_hostname = {};

  }

  init = () => {
    if (this.state.model) {
      this.cloud_internal = this.state.model['internal'];
      this.cp_topology = this.cloud_internal['cp-topology'];
      this.control_planes = this.cp_topology['control_planes'];
      this.servers = this.cloud_internal['servers'];

      for (const s of this.servers) {
        if (s['hostname']) {
          this.server_by_hostname[s['hostname']] = s;
        }
      }
    }
  }

  componentWillMount() {
    this.setState({loading: true});

    // Load overview for all templates
    fetchJson('/api/v1/clm/model/cp_internal/CloudModel.yaml')
      .then((yml) => {

        // Force a re-render
        this.setState({
          model: yml});
      })
      .catch((error) => {
        // console.log(error);
      });
  }

  render_servers = (servers) => {
    if (servers.length == 0) {
      return <Fragment> &nbsp; </Fragment>;
    }

    // Example of creating a link to another page. Probably don't want to do this for real
    const hosts = servers.map(server => {
      return (<div key={server}><a href={'Servers/' + this.server_by_hostname[server]['id'] + '.html'}>
        {server}</a></div>);
    });
    return (<Fragment>{hosts}</Fragment>);
  }

  render_control_plane = (cp_name, cp_topology) => {

    let services = new Set();
    let cp_zones = new Set();

    const clusters = cp_topology['clusters'] || {};
    const resources = cp_topology['resources'] || {};
    const load_balancers = cp_topology['load-balancers'] || {};

    // Gather info about each cluster
    const num_clusters = Object.keys(clusters).length;
    let cluster_names = [];
    for (const [name, data] of Object.entries(clusters)) {
      for (const zone in data['failure_zones'] || {}) {
        cp_zones.add(zone);
      }
      for (const service in data['services'] || {}) {
        services.add(service);
      }
      cluster_names.push(name);
    }
    cluster_names.sort();

    // Gather info about each resource
    const num_resources = Object.keys(resources).length;
    let resource_names = [];
    for (const [name, data] of Object.entries(resources)) {
      for (const zone in data['failure_zones'] || {}) {
        cp_zones.add(zone);
      }
      for (const service in data['services'] || {}) {
        services.add(service);
      }
      resource_names.push(name);
    }
    resource_names.sort();

    // Gather info about each load balancer
    const num_load_balancers = Object.keys(load_balancers).length;
    let lb_names = [];
    for (const [name, data] of Object.entries(load_balancers)) {
      for (const zone in data['failure_zones'] || {}) {
        cp_zones.add(zone);
      }
      for (const service in data['services'] || {}) {
        services.add(service);
      }
      lb_names.push(name);
    }
    lb_names.sort();

    // Generate the header with names
    const names = cluster_names.map(name => <th key={name}>{name}</th>).concat(
      resource_names.map(name => <th key={name}>{name}</th>)).concat(
      lb_names.map(name => <th key={name}>{name}</th>));

    // Create a sorted list of those items in the services set, with the items in
    // list_separately placed at the end of the list
    const list_separately = ['foundation', 'clients', 'ardana'];
    for (const item of list_separately) {
      services.delete(item);
    }
    const service_list = Array.from(new Set([...services])).concat(list_separately);

    let cells;

    // Generate the rows containing service names
    let service_rows = [];
    for (const service of service_list) {
      cells = [<td key="x"/>]
        .concat(cluster_names.map(name => {
          const text = clusters[name]['services'][service] ? service : '';
          return <td key={'c-'+name}>{text}</td>;
        }))
        .concat(resource_names.map(name => {
          const text = resources[name]['services'][service] ? service : '';
          return <td key={'r-'+name}>{text}</td>;
        }))
        .concat(lb_names.map(name => {
          const text = load_balancers[name]['services'][service] ? service : '';
          return <td key={'l-'+name}>{text}</td>;
        }));

      service_rows.push(<tr key={service}>{cells}</tr>);
    }

    const empty_clusters = cluster_names.map((name,idx) => <td key={'c'+idx}/>);
    const empty_resources = resource_names.map((name,idx) => <td key={'r'+idx}/>);

    // Generate the rows containing load balancer name/addresses
    cells = [<td key="x"/>]
      .concat(empty_clusters)
      .concat(empty_resources)
      .concat(lb_names.map(name => {
        const text = load_balancers[name]['external-name'] || '';
        return <td key={'l-'+name}>{text}</td>;
      }));
    const lb_name_row = (<tr key="lb-name-row">{cells}</tr>);

    cells = [<td key="x"/>]
      .concat(empty_clusters)
      .concat(empty_resources)
      .concat(lb_names.map(name => {
        if (load_balancers[name]['address']) {
          return (<td key={'l-'+name}><a href={'Networks.html#'+load_balancers[name]['network']}>
            {load_balancers[name]['address']}</a></td>);
        } else {
          return <td key={'l-'+name} />;
        }
      }));
    const lb_address_row = (<tr key="lb-address-row">{cells}</tr>);

    // Generate the zone rows
    const zone_rows = Array.from(cp_zones).sort().map(zone => {

      const cluster_servers = cluster_names.map(name =>
        <td key={'c-'+name}>{this.render_servers(clusters[name]['failure_zones'][zone] || [])}</td>
      );

      const resource_servers = resource_names.map(name =>
        <td key={'r-'+name}>{this.render_servers(resources[name]['failure_zones'][zone] || [])}</td>
      );

      return (
        <tr key={zone}>
          <td key={zone}>{zone}</td>
          {cluster_servers}
          {resource_servers}
        </tr>);
    });

    return (
      <div key={cp_name} className='menu-tab-content'>
        <a name={cp_name} />
        <div className='header'>{translate('control_plane', cp_name)}</div>
        <table className='table'>
          <thead><tr>
            <th />
            <th colSpan={num_clusters}>{translate('clusters')}</th>
            <th colSpan={num_resources}>{translate('resources')}</th>
            <th colSpan={num_load_balancers}>{translate('load_balancers')}</th>
          </tr></thead>
          <tbody>
            <tr key="header_row"><td>&nbsp;</td>{names}</tr>
            {service_rows}
            {lb_name_row}
            {lb_address_row}
            {zone_rows}
          </tbody>
        </table>
      </div>
    );
  }

  render () {

    let control_planes;
    if (this.state.model) {
      this.init();
      control_planes = Object.keys(this.control_planes).sort().map(name =>
        this.render_control_plane(name, this.control_planes[name]));
    } else {
      control_planes = translate('loading.pleasewait');
    }

    return (
      <div className='wizard-page'>
        <div className='wizard-content'>
          {control_planes}
        </div>
      </div>
    );
  }
}

export default ControlPlanes;
