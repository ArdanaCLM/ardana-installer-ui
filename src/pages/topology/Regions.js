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
 * ardana_configurationprocessor/plugins/builders/HTMLDiagram/Regions.py
 * in the config processor
 */
class Regions extends Component {
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
        if (this.refs.regions)
          this.setState({
            model: yml});
      })
      .catch((error) => {
        this.setState({
          errorMessage: error.toString(),
        });
      });
  }

  render_regions = () => {

    const cps = this.state.model['internal']['control-planes'];

    // Build a map by region of components advertised to keystone.  Note
    // that the component name will be the specific service, e.g. cinder-api
    let advertised = {};
    for (const cp of Object.values(cps)) {
      const cp_advertised = cp['advertised'] || {};
      for (const adv of Object.values(cp_advertised['keystone-api'] || [])) {
        for (const region of adv['regions']) {
          advertised[region] = advertised[region] || [];   // Seed with an empty array
          advertised[region].push(adv['component_name']);
        }
      }
    }
    const regions = this.state.model['internal']['region-topology']['regions'];

    // Build the header row of the table
    let header_row = Object.keys(regions).sort().map(name => <th key={name}>{name}</th>);
    header_row.unshift(<th key="cp">{translate('control_planes')}</th>);

    // Build the data rows
    const table_rows = Object.keys(cps).sort().map(cp_name => {

      const columns = Object.keys(regions).sort().map(name => {
        if (regions[name]['control_planes'][cp_name]) {

          // region_svcs is an object with keys corresponding to service names (e.g. 'cinder'),
          // and whose values are arrays of component names (e.g. 'cinder-api', 'cinder-schduler', etc.)
          const region_svcs = regions[name]['control_planes'][cp_name]['services'];

          const service_list = Object.keys(region_svcs).map(svc => {

            // If any component name for this service is advertised to keystone, then
            // highlight it in the displayed list
            let found = false;
            for(const component of region_svcs[svc]) {
              if (advertised[name].includes(component)) {
                found = true;
                break;
              }
            }

            const link = <HashLink to={'/topology/services#'+svc}>{svc}</HashLink>;
            const cls = found ? 'available' : '';
            return <div className={cls} key={svc}>{link}</div>;
          });

          return (<td key={name}>{service_list}</td>);
        } else {
          return (<td key={name} />);
        }
      });

      const link = '/topology/control_planes#' + cp_name;
      columns.unshift(<td key="cp"><HashLink to={link}>{cp_name}</HashLink></td>);

      return <tr key={cp_name}>{columns}</tr>;
    });


    return (
      <div className='menu-tab-content topology'>
        <table className='table'>
          <thead><tr>{header_row}</tr></thead>
          <tbody>
            {table_rows}
          </tbody>
        </table>
      </div>
    );
  }

  render () {
    return (
      <div ref="regions" className='wizard-page'>
        <LoadingMask show={!this.state.model && !this.state.errorMessage}/>
        <div className='wizard-content'>
          {this.state.model && this.render_regions()}
        </div>
        <div className='banner-container'>
          <ErrorBanner message={this.state.errorMessage} show={this.state.errorMessage !== undefined} />
        </div>
      </div>
    );
  }
}

export default Regions;
