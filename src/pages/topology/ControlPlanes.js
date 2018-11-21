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
import { getInternalModel } from './TopologyUtils.js';
import { ErrorBanner } from '../../components/Messages';
import { LoadingMask } from '../../components/LoadingMask';

/*
 * This class is a JavaScript implementation of the script
 * ardana_configurationprocessor/plugins/builders/HTMLDiagram/ControlPlanes.py
 * in the config processor
 */
class ControlPlanes extends Component {
  constructor(props) {
    super(props);

    this.state = {
      model: undefined,
      errorMessage: undefined,
    };

    this.server_by_hostname = {};
  }

  componentDidMount() {

    getInternalModel()
      .then((yml) => {

        // Force a re-render if the page is still shown (user may navigate away while waiting)
        if (this.refs.control_planes)
          this.setState({
            model: yml,
          });
      })
      .catch((error) => {
        this.setState({
          errorMessage: error.toString(),
        });
      });
  }

  render_servers = (servers) => {
    if (servers.length == 0) {
      return;
    }

    // Example of creating a link to another page. Probably don't want to do this for real
    const hosts = servers.map(server => {
      return (<div key={server}>
        <HashLink to={'/topology/servers#'+this.server_by_hostname[server]['id']}>{server}</HashLink>
      </div>);
    });
    return (<>{hosts}</>);
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
      const link = <HashLink to={'/topology/services#'+service}>{service}</HashLink>;

      cells = [<td key="x" className='noborder'/>]
        .concat(cluster_names.map(name => {
          const text = clusters[name]['services'][service] ? link : '';
          return <td key={'c-'+name}>{text}</td>;
        }))
        .concat(resource_names.map(name => {
          const text = resources[name]['services'][service] ? link : '';
          return <td key={'r-'+name}>{text}</td>;
        }))
        .concat(lb_names.map(name => {
          const text = load_balancers[name]['services'][service] ? link : '';
          return <td key={'l-'+name}>{text}</td>;
        }));

      service_rows.push(<tr key={service}>{cells}</tr>);
    }

    const empty_clusters = cluster_names.map((name,idx) => <td key={'c'+idx} className='noborder'/>);
    const empty_resources = resource_names.map((name,idx) => <td key={'r'+idx} className='noborder'/>);

    let lb_name_row;
    if (lb_names.length > 0) {
      // Generate the rows containing load balancer name/addresses
      cells = [<td key="x" className='noborder'/>]
        .concat(empty_clusters)
        .concat(empty_resources)
        .concat(lb_names.map(name => {
          const text = load_balancers[name]['external-name'] || '';
          return <td key={'l-'+name}>{text}</td>;
        }));
      lb_name_row = (<tr key="lb-name-row">{cells}</tr>);
    }

    cells = [<td key="x" className='noborder' />]
      .concat(empty_clusters)
      .concat(empty_resources)
      .concat(lb_names.map(name => {
        if (load_balancers[name]['address']) {
          return (<td key={'l-'+name}>
            <HashLink to={'/topology/networks#'+load_balancers[name]['network']}>
              {load_balancers[name]['address']}</HashLink>
          </td>);
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
      <div key={cp_name} className='menu-tab-content topology'>
        <a id={cp_name}/>
        <div className='header'>{translate('control_plane', cp_name)}</div>
        <table className='table'>
          <thead><tr>
            <th className='noborder'/>
            <th colSpan={num_clusters}>{translate('clusters')}</th>
            <th colSpan={num_resources}>{translate('resources')}</th>
            <th colSpan={num_load_balancers}>{translate('load_balancers')}</th>
          </tr></thead>
          <tbody>
            <tr className='heading' key="header_row"><td className='noborder'/>{names}</tr>
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
      for (const s of this.state.model['internal']['servers']) {
        if (s['hostname']) {
          this.server_by_hostname[s['hostname']] = s;
        }
      }

      const cps = this.state.model['internal']['cp-topology']['control_planes'];
      control_planes = Object.keys(cps).sort().map(name =>
        this.render_control_plane(name, cps[name]));
    }


    return (
      <div ref="control_planes" className='wizard-page'>
        <LoadingMask show={!this.state.model && !this.state.errorMessage}/>
        <div className='wizard-content'>
          {control_planes}
        </div>
        <div className='banner-container'>
          <ErrorBanner message={this.state.errorMessage} show={this.state.errorMessage !== undefined} />
        </div>
      </div>
    );
  }
}

export default ControlPlanes;
