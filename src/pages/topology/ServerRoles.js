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
import { byEntry, byProperty } from '../../utils/Sort.js';

/*
 * This class is a JavaScript implementation of the scripts ServerRoles.py,
 * InterfaceModels.py, DiskModels.py from
 * ardana_configurationprocessor/plugins/builders/HTMLDiagram/ServerRoles.py
 * in the config processor.  It combines all three of these pages into one.
 */
class ServerRoles extends Component {
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
        if (this.refs.server_roles)
          this.setState({
            model: yml});
      })
      .catch((error) => {
        this.setState({
          errorMessage: error.toString(),
        });
      });
  }

  render () {

    let groupTable;
    if (this.state.model) {

      const serverRoles = this.state.model['2.0']['server-roles'].sort(byProperty('name'));
      const diskModels = this.state.model['internal']['disk_models'];
      const interfaceModels = this.state.model['2.0']['interface-models'];

      let rows = [];

      serverRoles.forEach(role => {

        // Build an array of rows for each disk (volume group or device group)
        let diskRows = [];
        diskModels[role['disk-model']]['volume-groups'].sort(byProperty('name')).forEach(vg => {

          // Append a row (array of cells) to diskRows for each logical volume
          diskRows = diskRows.concat(vg['logical-volumes'].sort(byProperty('name')).map((lv,idx,arr) => {

            let cells = [
              <td key='n'>{lv.name}</td>,
              <td key='s'>{lv.size}</td>,
              <td key='f'>{lv.fstype}</td>,
              <td key='o'>{lv['mkfs-opts']}</td>
            ];

            // Add the row-spanning entries for the volume group and physical volume(s) if on
            // the first row
            if (idx === 0) {
              cells.unshift(<td key='vg' rowSpan={arr.length}>{vg.name}</td>);

              const pvs = vg['physical-volumes'].sort().map(pv => <div key={pv}>{pv}</div>);
              cells.push(<td rowSpan={arr.length} key='pv'>{pvs}</td>);
            }
            return cells;
          }));
        });

        const dgs = diskModels[role['disk-model']]['device-groups'];
        if (dgs) {
          diskRows = diskRows.concat(
            dgs.sort(byProperty('name')).map(dg => {

              // Append rows to diskRows.  Each row is an array of cells
              const pvs = dg['devices'].sort(byProperty('name')).map(pv => <div key={pv.name}>{pv.name}</div>);

              return [
                <td key='n'>{dg.name}</td>,
                <td key='m' colSpan={4}>{dg.consumer.name}</td>,
                <td key='pv'>{pvs}</td>,
              ];
            }));
        }
        diskRows.unshift([<td className='details' colSpan={6} key='v'>{role['disk-model']}</td>]);

        let ifRows = [];

        // Create table of interface model info
        const ifModel = interfaceModels.filter(f => f.name === role['interface-model'])[0];

        ifModel['network-interfaces'].forEach(nwif => {
          const groupNames = [].concat(nwif['network-groups'] || []).concat(nwif['forced-network-groups'] || [])
            .sort()
            .map(g => <div key={g}><HashLink to={'/topology/networks/#'+g}>{g}</HashLink></div>);

          const bondData = nwif['bond-data'];
          if (bondData) {
            ifRows = ifRows.concat(bondData['devices'].map((dev,idx,arr) => {

              if (idx === 0) {
                const numRows = arr.length;

                let options = [
                  <tr key='provider'>
                    <td key='k'>provider</td>
                    <td key='v'>{nwif.device.name}</td>
                  </tr>];

                // Create rows for nested table of bond data options
                for (const [key, value] of Object.entries(bondData.options).sort(byEntry)) {
                  options.push(
                    <tr key={key}>
                      <td key='k'>{key}</td>
                      <td key='v'>{value}</td>
                    </tr>);
                }

                return ([
                  <td rowSpan={numRows} key='ng'>{groupNames}</td>,
                  <td rowSpan={numRows} key='nd'>{nwif.device.name}</td>,
                  <td key={'nd.'+idx}>{dev.name}</td>,
                  <td className='nested-table' rowSpan={numRows} key='no'>
                    <table><tbody>{options}</tbody></table>
                  </td>,
                ]);
              } else {
                return [ <td key={'nd.'+idx}>{dev.name}</td> ];
              }
            }));
          } else {

            let name = [ <div key='n'>{nwif.device.name}</div> ];

            // Add annotation for some special fields
            if (nwif.device['vf-count']) {
              name.push(<div key='vf'>{translate('svf.count', nwif.device['vf-count'])}</div>);
            }
            if (nwif.device['sriov-only']) {
              name.push(<div key='sriov'>{translate('sriov.only')}</div>);
            }
            if (nwif.device['pci-pt']) {
              name.push(<div key='pp'>{translate('pci.pt')}</div>);
            }

            ifRows.push(
              [
                <td key='g'>{groupNames}</td>,
                <td colSpan='3' key='n'>{name}</td>
              ]
            );
          }
        });

        if (ifModel['dpdk-devices']) {
          ifModel['dpdk-devices'].forEach(dpdk_dev => {

            ifRows = ifRows.concat(dpdk_dev['devices'].map((dev,idx,arr) => {
              if (idx === 0) {
                const numRows = arr.length;
                let components;
                if (dpdk_dev['components']) {
                  components = dpdk_dev['components'].sort().map(d => <div key={d}>{d}</div>);
                }

                let options = [];

                if (dpdk_dev['component-options']) {
                  // Create rows for nested table of component options
                  for (const opt of dpdk_dev['component-options'].sort(byProperty('name'))) {
                    options.push(
                      <tr key={opt.name}>
                        <td key='k'>{opt.name}</td>
                        <td key='v'>{opt.value}</td>
                      </tr>);
                  }
                }

                if (dpdk_dev['eal-options']) {
                  // Create rows for nested table of eal options
                  options.push(
                    <tr key='title'>
                      <td className='label-cell' colSpan='2'>{translate('eal.options')}</td>
                    </tr>);

                  for (const opt of dpdk_dev['eal-options'].sort(byProperty('name'))) {
                    options.push(
                      <tr key={opt.name}>
                        <td key='k'>{opt.name}</td>
                        <td key='v'>{opt.value}</td>
                      </tr>);
                  }
                }


                return ([
                  <td rowSpan={numRows} key='n'>DPDK</td>,
                  <td key='d'>{dev.name}</td>,
                  <td rowSpan={numRows} key='c'>{components}</td>,
                  <td className='nested-table' rowSpan={numRows} key='o'>
                    <table><tbody>{options}</tbody></table>
                  </td>,
                ]);

              } else {
                return [ <td key={'d'}>{dev.name}</td> ];
              }
            }));
          });
        }


        // Insert interface title into the first row of the table
        ifRows.unshift([<td className='details' colSpan={4} key='v'>
          <a id={role['interface-model']}/>{role['interface-model']}</td>]);


        // If there are more disk rows than interface rows, then add a large empty cell as needed.  This avoids
        // inteface information being shoved to the left.
        let roleLen;
        if (diskRows.length >= ifRows.length) {
          roleLen = diskRows.length;
        } else {
          roleLen = ifRows.length;
          diskRows.push([<td key='x' rowSpan={ifRows.length-diskRows.length} colSpan={6}/>]);
        }

        for(let i=0; i<roleLen; i++) {
          rows.push(
            <tr key={role.name+i}>
              <If condition={i === 0}><td rowSpan={roleLen} key="r"><a id={role.name}/>{role.name}</td></If>
              {diskRows[i]}
              {ifRows[i]}
            </tr>
          );
        }
      });

      groupTable = (
        <table className='table'>
          <thead>
            <tr key='h1'>
              <th rowSpan="2">{translate('server.role')}</th>
              <th colSpan="6">{translate('disk.model')}</th>
              <th colSpan="5">{translate('interface.model')}</th>
            </tr>
            <tr key='h2'>
              <th>{translate('volume.group')}</th>
              <th>{translate('logical.volume.mount')}</th>
              <th>{translate('size')}</th>
              <th>{translate('filesystem.type')}</th>
              <th>{translate('options')}</th>
              <th>{translate('physical.volumes')}</th>
              <th>{translate('network-group')}</th>
              <th colSpan="3">{translate('interface.options')}</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      );
    }

    return (
      <div ref="server_roles" className='wizard-page'>
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

export default ServerRoles;
