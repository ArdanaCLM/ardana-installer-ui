// (c) Copyright 2018 SUSE LLC
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
import { translate } from '../localization/localize.js';
import { fetchJson } from '../utils/RestUtils.js';
import { alphabetically } from '../utils/Sort.js';
import { PlaybookProgress } from '../components/PlaybookProcess.js';
import { LoadingMask } from '../components/LoadingMask.js';
import { ConfirmModal } from '../components/Modals.js';
import { AlarmDonut } from '../components/Graph';
import { ErrorMessage } from '../components/Messages.js';
import ContextMenu from '../components/ContextMenu.js';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import { GetSshPassphraseModal } from '../components/Modals.js';

const MONASCA_SERVICES_MAP = {
  ardana: 'ardana',
  barbican: 'key-manager',
  ceilometer: 'telemetry',
  cinder: 'block-storage',
  cinderv2: 'block-storage',
  cinderv3: 'block-storage',
  designate: 'dns',
  freezer: 'backup',
  glance: 'image-service',
  heat: 'orchestration',
  horizon: 'web-ui',
  keystone: 'identity-service',
  kronos: 'logging',
  magnum: 'container-infra',
  monasca: 'monitoring',
  neutron: 'networking',
  nova: 'compute',
  opsconsole: 'ops-console',
  swift: 'object-storage'
};
const ALARM_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};
const ALARM_STATE = {
  ALARM: 'ALARM',
  OK: 'OK',
  UNDETERMINED: 'UNDETERMINED'
};

class ServiceDetails extends Component {

  constructor() {
    super();
    this.state = {
      packageDataLoaded: false,
      alarmDataLoaded: false,
      version: undefined,
      alarm: undefined
    };
  }

  getServiceName() {
    let name = this.props.service.name.toLowerCase();
    let packageToCheck = 'openstack_venv_packages';
    switch(this.props.service.name.toLowerCase()) {
    case 'ardana':
      name = 'ardana-service';
      packageToCheck = 'cloud_installed_packages';
      break;
    case 'cinderv2':
    case 'cinderv3':
      name = 'cinder';
      break;
    case 'kronos':
      name = 'python-monasca-log-api';
      packageToCheck = 'cloud_installed_packages';
      break;
    case 'opsconsole':
      name = 'python-ardana-opsconsole-server';
      packageToCheck = 'cloud_installed_packages';
      break;
    }
    return {name: name, packageToCheck: packageToCheck};
  }

  getVersion(responseData, serviceNameObj) {
    const serviceName = serviceNameObj.name;
    const packageToCheck = responseData[serviceNameObj.packageToCheck];
    const selectedPkg = packageToCheck.find((pkg) => {return pkg.name === serviceName;});
    let version = translate('unavailable');
    if (selectedPkg) {
      version = (serviceNameObj.packageToCheck === 'cloud_installed_packages') ?
        selectedPkg.versions.join(', ') : selectedPkg.installed.join(', ');
      if (version === '') {
        version='-';
      }
    }
    return version;
  }

  componentWillMount() {
    this.props.setLoadingMask(true);
    let serviceNameObj = this.getServiceName();
    fetchJson('/api/v1/clm/packages')
      .then(responseData => {
        this.setState({version: this.getVersion(responseData, serviceNameObj), packageDataLoaded: true});
        this.checkLoadingMask();
      })
      .catch((error) => {
        this.setState({version: translate('unavailable'), packageDataLoaded: true});
        this.checkLoadingMask();
      });

    const lookupName =  MONASCA_SERVICES_MAP[this.props.service.name.toLowerCase()];
    if (lookupName) {
      const query = 'metric_dimensions=service:' + lookupName + '&group_by=state,severity';
      fetchJson('/api/v1/clm/monasca/passthru/alarms/count?' + query)
        .then(responseData => {
          this.processAlarms(responseData.counts);
          this.setState({alarmDataLoaded: true});
          this.checkLoadingMask();
        })
        .catch((error) => {
          this.setState({alarmDataLoaded: true});
          this.checkLoadingMask();
        });
    } else {
      this.setState({alarmDataLoaded: true});
      this.checkLoadingMask();
    }
  }

  processAlarms = (alarmList) => {
    let criticalCount = 0;
    let warningCount = 0;
    let unknownCount = 0;
    let okCount = 0;

    // example of alarm list:
    // columns: ["count", "state", "severity"]
    // counts: [[2, "OK", "LOW"], [6, "OK", "MEDIUM"], [76, "OK", "HIGH"], [3, "ALARM", "HIGH"]]
    alarmList.map((alarm) => {
      if (alarm[1] === ALARM_STATE.OK) {
        okCount += alarm[0];
      } else if (alarm[1] === ALARM_STATE.UNDETERMINED) {
        unknownCount += alarm[0];
      } else {
        if (alarm[2] === ALARM_SEVERITY.HIGH || alarm[2] === ALARM_SEVERITY.CRITICAL) {
          criticalCount += alarm[0];
        } else {
          warningCount += alarm[0];
        }
      }
    });
    this.setState({alarm: {critical: criticalCount, warning: warningCount, unknown: unknownCount,
      ok: okCount}});
  }

  checkLoadingMask = () => {
    if (this.state.packageDataLoaded && this.state.alarmDataLoaded) {
      this.props.setLoadingMask(false);
    }
  }

  renderDetailsLine(label, value) {
    return (
      <div className='details-line'>
        <div className='details-label'>{translate(label)}</div>
        <div>{value}</div>
      </div>
    );
  }

  renderAlarmChart = () => {
    return (
      <div>
        <div className='chart-label'>{translate('alarm.summary')}</div>
        <div className='alarm-chart'>
          <AlarmDonut radius={70}
            critical={this.state.alarm.critical}
            warning={this.state.alarm.warning}
            unknown={this.state.alarm.unknown}
            ok={this.state.alarm.ok}
          />
        </div>
      </div>
    );
  }

  render() {
    return (
      <ConfirmModal show={this.props.show} className='service-info-details-modal'
        onHide={this.props.onHide} title={this.props.title}>
        <div className='details'>
          {this.renderDetailsLine('name', this.props.service.name)}
          {this.renderDetailsLine('description', this.props.service.description)}
          {this.renderDetailsLine('endpoint.status', this.props.service.status)}
          {this.renderDetailsLine('endpoints', this.props.service.endpoints)}
          {this.renderDetailsLine('services.package.version', this.state.version)}
          {this.state.alarm && this.renderAlarmChart()}
        </div>
      </ConfirmModal>
    );
  }
}


class ServiceInfo extends Component {

  constructor() {
    super();
    this.state = {
      services: undefined,
      showActionMenu: false,
      showDetailsModal: false,
      showRunStatusPlaybookModal: false,
      playbooks: [],
      steps: [],
      selectedService: '',
      statusList: undefined,
      showLoadingMask: false,
      error: undefined,
      menuLocation: undefined,
      showGetPassphraseModal: false,
      requiresPassphrase: true
    };
  }

  componentWillMount() {
    this.setState({showLoadingMask: true});
    fetchJson('/api/v1/clm/endpoints')
      .then(responseData => {
        this.setState({services: responseData, showLoadingMask: false});
      })
      .catch((error) => {
        this.setState({
          error: {
            title: translate('default.error'),
            messages: [translate('services.info.unavailable')]
          },
          showLoadingMask: false
        });
      });

    fetchJson('/api/v1/clm/monasca/service_status')
      .then(responseData => {
        this.setState({statusList: responseData});
      })
      .catch((error) => {
        // no need to show error for this case
      });

    fetchJson('/api/v1/clm/sshagent/requires_password')
      .then((responseData) => {
        this.setState({
          requiresPassphrase: responseData['requires_password']
        });
      });
  }

  renderErrorMessage() {
    if (this.state.error) {
      return (
        <div className='notification-message-container'>
          <ErrorMessage
            closeAction={() => this.setState({error: undefined})}
            title={this.state.error.title}
            message={this.state.error.messages}>
          </ErrorMessage>
        </div>
      );
    }
  }

  renderActionMenuIcon = (service) => {
    return (
      <span onClick={(event) => this.handleActionMenu(event, service)}>
        <i className='material-icons'>more_horiz</i>
      </span>
    );
  }

  handleActionMenu = (event, service) => {
    this.setState({
      showActionMenu: true,
      selectedService: service,
      menuLocation: {x: event.pageX, y: event.pageY}
    });
  }

  showDetailsModal = () => {
    this.setState({showActionMenu: false, showDetailsModal: true});
  }

  getPlaybookName = () => {
    let name;
    switch(this.state.selectedService.name.toLowerCase()) {
    case 'ardana':
      name = 'ardana-service';
      break;
    case 'cinderv2':
    case 'cinderv3':
      name = 'cinder';
      break;
    case 'kronos':
      name = 'logging';
      break;
    case 'opsconsole':
      name = 'ops-console';
      break;
    default:
      name = this.state.selectedService.name.toLowerCase();
    }
    return name + '-status';
  }

  showRunStatusPlaybookModal = () => {
    if (this.state.requiresPassphrase) {
      this.setState({showGetPassphraseModal: true});
    } else {
      const playbookName = this.getPlaybookName();
      this.setState({
        showActionMenu: false,
        showRunStatusPlaybookModal: true,
        playbooks: [playbookName],
        steps: [{label: 'status', playbooks: [playbookName + '.yml']}],
      });
    }
  }

  handlePassphrase = () => {
    this.setState({showGetPassphraseModal: false, requiresPassphrase: false});
    this.showRunStatusPlaybookModal();
  }

  renderMenuItems = () => {
    const menuItems = [
      {show: true, key: 'common.details', handleShowModal: this.showDetailsModal},
      {show: true, key: 'services.run.status', handleShowModal: this.showRunStatusPlaybookModal},
    ];
    return (
      <ContextMenu show={this.state.showActionMenu} items={menuItems} location={this.state.menuLocation}
        close={() => this.setState({showActionMenu: false})}/>
    );
  }

  setLoadingMask = (show) => {
    this.setState({showLoadingMask: show});
  }

  getStatus = (name) => {
    let status = '-';
    if (this.state.statusList) {
      const lookupName =  MONASCA_SERVICES_MAP[name] ? MONASCA_SERVICES_MAP[name] : name;
      const foundSrv = this.state.statusList.find((srv) => {return srv.name === lookupName;});
      if (foundSrv) {
        status = foundSrv.status.toUpperCase();
      }
    }
    return status;
  }

  render() {
    let rows = [];
    if (this.state.services) {
      rows = this.state.services
        .sort((a,b) => alphabetically(a.name, b.name))
        .map((srv) => {
          const regions = srv.endpoints.map(ep => {return ep.region;}).join('\n');
          const endpoints = srv.endpoints.map(ep => {
            // capitalize the first letter of the interface before concat with the url
            const types = ep.interface[0].toUpperCase() + ep.interface.substr(1);
            return types + ' ' + ep.url;
          }).sort().join('\n');
          const status = this.getStatus(srv.name);
          let displayStatus = status;
          if (status === '-' || status === 'UNKNOWN') {
            const tooltipText = (status === '-') ? 'services.info.status.not.available.tooltip' :
              'services.info.status.unknown.tooltip';
            const statusTooltip = (<Tooltip id='statusTooltip'>{translate(tooltipText)}</Tooltip>);
            displayStatus = (
              <OverlayTrigger placement='right' overlay={statusTooltip}>
                <span>{status}</span>
              </OverlayTrigger>
            );
          }
          const selectedSrv = {
            name: srv.name[0].toUpperCase() + srv.name.substr(1),
            description: srv.description,
            status: status,
            endpoints: endpoints
          };

          return (
            <tr key={srv.name}>
              <td className='capitalize'>{srv.name}</td>
              <td>{srv.description}</td>
              <td>{displayStatus}</td>
              <td className='line-break'>{endpoints}</td>
              <td className='line-break'>{regions}</td>
              <td>{this.renderActionMenuIcon(selectedSrv)}</td>
            </tr>
          );
        });
    }

    const passPhraseModal = (
      <GetSshPassphraseModal show={this.state.showGetPassphraseModal} doneAction={this.handlePassphrase}
        cancelAction={() => this.setState({showGetPassphraseModal: false})}/>
    );

    let statusModal;
    if (this.state.showRunStatusPlaybookModal) {
      statusModal = (
        <PlaybookProgress steps={this.state.steps} playbooks={this.state.playbooks}
          updatePageStatus={() => {}} modalMode showModal={this.state.showRunStatusPlaybookModal}
          onHide={() => this.setState({showRunStatusPlaybookModal: false})}
          serviceName={this.state.selectedService.name}/>
      );
    }

    let detailsModal;
    if (this.state.showDetailsModal) {
      detailsModal = (
        <ServiceDetails show={this.state.showDetailsModal} service={this.state.selectedService}
          onHide={() => this.setState({showDetailsModal: false})} setLoadingMask={this.setLoadingMask}
          title={translate('services.details', this.state.selectedService.name)}/>
      );
    }

    return (
      <div>
        {passPhraseModal}
        {statusModal}
        {detailsModal}
        {this.renderErrorMessage()}
        <LoadingMask className='details-modal-mask' show={this.state.showLoadingMask}></LoadingMask>
        <div className='menu-tab-content'>
          <div className='header'>{translate('services.info')}</div>
          <table className='table'>
            <thead>
              <tr>
                <th>{translate('name')}</th>
                <th>{translate('description')}</th>
                <th>{translate('endpoint.status')}</th>
                <th>{translate('endpoints')}</th>
                <th>{translate('regions')}</th>
                <th width="3em"></th>
              </tr>
            </thead>
            <tbody>
              {rows}
            </tbody>
          </table>
          {this.state.showActionMenu && this.renderMenuItems()}
        </div>
      </div>
    );
  }

}

export default ServiceInfo;
