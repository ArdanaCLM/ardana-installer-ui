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
 * ardana_configurationprocessor/plugins/builders/HTMLDiagram/Services.py
 * in the config processor
 */
class Services extends Component {
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
        if (this.refs.services)
          this.setState({
            model: yml});
      })
      .catch((error) => {
        this.setState({
          errorMessage: error.toString(),
        });
      });
  }

  render_summary = () => {
    const services = this.state.model['internal']['services'];
    let service_classes = {};
    for(const [name, data] of Object.entries(services)) {
      const service_class = data['service-class'];
      // Exclude services that have no service class or are marked as hidden
      if (service_class && ! data['hidden']) {
        service_classes[service_class] = service_classes[service_class] || [];
        service_classes[service_class].push(name);
      }
    }

    let table_rows = [];
    for(const cls of Object.keys(service_classes).sort()) {
      let first_row = true;
      for(const svc of service_classes[cls].sort()) {
        let cells = [];
        if (first_row) {
          cells.push(<td key="cls" rowSpan={service_classes[cls].length}>{cls}</td>);
        }
        cells.push(<td key="desc">{services[svc]['description']||''}</td>);
        cells.push(<td key="svc"><HashLink to={'#'+svc}>{svc}</HashLink></td>);
        table_rows.push(<tr key={cls+'.'+svc}>{cells}</tr>);

        first_row = false;
      }
    }

    return (
      <table className='table'>
        <thead><tr>
          <th>{translate('class')}</th>
          <th>{translate('description')}</th>
          <th>{translate('service')}</th>
        </tr></thead>
        <tbody>
          {table_rows}
        </tbody>
      </table>
    );
  }

  render_services = () => {

    let services_details = [];

    const services = this.state.model['internal']['services'];

    // Create a mapping from mnemonic to its service name, e.g FND-RMQ -> rabbitmq
    let mnemonic = {};
    for (const [name, data] of Object.entries(this.state.model['internal']['components'])) {
      if (! data['alias-for']) {
        mnemonic[data['mnemonic']] = name;
      }
    }

    for(const service_name of Object.keys(services).sort()) {
      const service_data = services[service_name];

      if (service_data['hidden'] || ! service_data['component-list'])
        continue;

      services_details.push(<a key={'a.'+service_name} id={service_name}/>);
      for(const comp of service_data['component-list']) {
        services_details.push(<a key={'c.'+comp} id={comp}/>);
      }

      let heading = service_name;
      if (service_data['description']) {
        heading += ' (' + service_data['description'] + ')';
      }
      services_details.push(<h2 key={'h.'+service_name}>{heading}</h2>);

      let detail_rows = [];
      for (const comp_name of service_data['component-list'].sort()) {
        const comp = this.state.model['internal']['components'][comp_name];

        if (comp['hidden'] || comp['alias-for'])
          continue;

        // Populate control plane column
        let control_planes = [];
        const svc_topo = this.state.model['internal']['service-topology']['services'][service_name];
        if (svc_topo) {
          const comp_data = svc_topo['components'][comp_name];
          if (comp_data) {
            control_planes = Object.keys(comp_data['control_planes']).sort().map(cp =>
              <div key={cp}><HashLink to={'/topology/control_planes#'+cp}>{cp}</HashLink></div>);
          }
        }

        // Populate consumes column
        let consumes_cell = [];
        if (comp['consumes-services']) {
          let consumes = [];
          let optional = [];
          for (const consume of comp['consumes-services']) {
            let svc = consume['service-name'];
            // Attempt to find a printable name for any mnemonics
            svc = mnemonic[svc] || svc;

            if (consume['optional']) {
              optional.push(svc);
            } else {
              consumes.push(svc);
            }
          }

          consumes_cell = consumes.sort().map(svc => <div key={svc}><HashLink to={'#'+svc}>{svc}</HashLink></div>);
          if (optional.length > 0) {
            consumes_cell.push(<div key='opt' className='optional-consumes'>{translate('optional')}</div>);
            consumes_cell = consumes_cell.concat(
              optional.sort().map(svc => <div key={svc}><HashLink to={'#'+svc}>{svc}</HashLink></div>));
          }
        }

        // Populate endpoints column
        let endpoints_cell;
        if (comp['endpoints']) {
          const rows = comp['endpoints'].map((ep, idx) => {
            const roles = ep.roles.sort().join(', ');

            return (<tr key={idx}>
              <td key='role' className='role'>{roles}</td>
              <td key='port' className='port'>{ep['port']}</td>
              <td key='proto' className='proto'>{ep['protocol'] || 'tcp'}</td>
              <td key='vip' className='vip'>{ep['has-vip'] ? 'VIP' : ''}</td>
            </tr>);
          });

          endpoints_cell = (<table className='endpoints nested-table noborder'><tbody>{rows}</tbody></table>);
        }

        let cells = [];
        cells.push(<td key='comp'>{comp_name}</td>);
        cells.push(<td key='cp'>{control_planes}</td>);
        cells.push(<td key='cons'>{consumes_cell}</td>);
        cells.push(<td key='ep'>{endpoints_cell}</td>);

        detail_rows.push(<tr key={comp_name}>{cells}</tr>);
      }

      let detail_table = (<table key={'t.'+service_name} className='table'>
        <thead>
          <tr>
            <th>{translate('components')}</th>
            <th>{translate('control_planes')}</th>
            <th>{translate('consumes')}</th>
            <th>{translate('endpoints')}</th>
          </tr>
        </thead>
        <tbody>
          {detail_rows}
        </tbody>
      </table>);

      services_details.push(detail_table);
    }

    return services_details;
  }

  render () {
    return (
      <div ref="services" className='wizard-page'>
        <LoadingMask show={!this.state.model && !this.state.errorMessage}/>
        <div className='wizard-content'>
          <div className='menu-tab-content topology'>
            {this.state.model && this.render_summary()}
            {this.state.model && this.render_services()}
          </div>
        </div>
        <div className='banner-container'>
          <ErrorBanner message={this.state.errorMessage} show={this.state.errorMessage !== undefined} />
        </div>
      </div>
    );
  }
}

export default Services;
