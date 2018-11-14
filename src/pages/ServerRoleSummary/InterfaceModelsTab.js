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
import { ValidatingInput } from '../../components/ValidatingInput.js';
import Dropdown from '../../components/Dropdown.js';
import { ActionButton } from '../../components/Buttons.js';
import { alphabetically } from '../../utils/Sort.js';
import { MODE } from '../../utils/constants.js';
import { List, Map, Set, fromJS } from 'immutable';
import { YamlValidator } from '../../utils/InputValidators.js';
import { YesNoModal } from '../../components/Modals.js';
import { dump,  safeLoad } from 'js-yaml';
import { isEmpty } from 'lodash';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';

class InterfaceModelsTab extends Component {

  constructor(props) {
    super(props);

    this.state = {
      overallMode: MODE.NONE,
      detailMode: MODE.NONE,

      // index of the row in the main table being edited (interface model)
      activeOverallRow: undefined,
      // index of the row in the detail table being edited (interface)
      activeDetailRow: undefined,

      // interfaceModel being edited
      interfaceModel: undefined,

      // interface being edited (note: interface is a reserved word)
      networkInterface: undefined,

      // List of devices, bond device name, and bondOptions.  It would be preferable
      // to just edit these fields in the networkInterface object directly (like what
      // is done for the interface name), but there are some gotchas that prevent this:
      // 1. The device list/name is stored in different places (with different namaes)
      //    depending on the type of interface: for bonded interfaces the device list
      //    is stored within the bond-data sub-object, and the device name contains
      //    the bond device name.  For non-bonded interfaces, there is no bond-data, and
      //    the device name is stored in the device name field
      // 2. Bond options are stored in the object as a javascript object, but entered
      //    on the page as text.  Therefore if the bondOptions are being edited, they
      //    might be temporarily in a state that is not valid yaml, which would prevent
      //    it from being stored on the object.  Thus we use a string version to be
      //    used while editing is underway.
      deviceList: undefined,
      bondDeviceName: undefined,
      bondOptions: undefined,

      isInterfaceModelNameValid: undefined,
      isInterfaceNameValid: undefined,
      isBondDeviceNameValid: undefined,
      isBondOptionsValid: undefined,

      showRemoveInterfaceConfirmation: false,
      interfaceToRemoveIndex: undefined
    };

    this.detailsChanged = false;
  }

  resetData = () => {
    this.setState({
      overallMode: MODE.NONE,
      detailMode: MODE.NONE,
      activeOverallRow: undefined,
      activeDetailRow: undefined,
      interfaceModel: undefined,
      networkInterface: undefined,
      deviceList: undefined,
      bondDeviceName: undefined,
      bondOptions: undefined,
      isInterfaceModelNameValid: undefined,
      isInterfaceNameValid: undefined,
      isBondDeviceNameValid: undefined,
      isBondOptionsValid: undefined,
      showRemoveInterfaceConfirmation: false,
      interfaceToRemoveIndex: undefined
    });
  }

  /*
   * Main section
   *
   * This section is responsible for handling the main table
   */

  // Returns a new model with the nic mappings in sorted order
  getSortedModel = () => {
    return this.props.model.updateIn(['inputModel','interface-models'],
      list => list.sort((a,b) => alphabetically(a.get('name'), b.get('name'))));
  }

  // Returns the interface mapping rows from the model in sorted order
  getRows = () => {
    return this.getSortedModel().getIn(['inputModel','interface-models']);
  }

  addModel = (e) => {
    e.preventDefault();

    // Prevent adding while editing is in progress
    if (this.state.overallMode !== MODE.NONE)
      return;

    this.setState({
      overallMode: MODE.ADD,
      isInterfaceModelNameValid: false,
      interfaceModel: fromJS({name: '', 'network-interfaces': []}),

      interfaceNames: List()
    });
  }

  editModel = (e, idx) => {

    // Prevent editing while editing / adding is in progress
    if (this.state.overallMode !== MODE.NONE)
      return;

    this.setState({
      overallMode: MODE.EDIT,
      activeOverallRow: idx,
      interfaceModel: this.getRows().get(idx),
      isInterfaceModelNameValid: true,
    });
  }

  deleteModel = (idx) => {

    // Prevent adding while editing is in progress
    if (this.state.overallMode !== MODE.NONE)
      return;

    const model = this.getSortedModel().removeIn(['inputModel', 'interface-models', idx]);
    this.props.updateGlobalState('model', model);
  }

  // Render the entire contents of the tab
  render() {
    let addClass = 'material-icons add-button';
    let addTextClass = 'add-text';
    let editClass = 'material-icons edit-button';
    let removeClass = 'material-icons remove-button';
    if (this.state.overallMode != MODE.NONE) {
      addClass += ' disabled';
      addTextClass += ' disabled';
      editClass += ' disabled';
      removeClass += ' disabled';
    }

    // build the rows in the main table
    const rows = this.getRows()
      .map((m,idx) => {
        let numInterfaces = '-';
        if (m.has('network-interfaces')) {
          const interfaceList = m.get('network-interfaces').toJS();
          const tooltipText = interfaceList.map(i => i.name).join(',\n');
          const tooltip = (<Tooltip id='interfaces' className='cell-tooltip'>{tooltipText}</Tooltip>);
          numInterfaces = (
            <OverlayTrigger placement='right' overlay={tooltip}>
              <span>{m.get('network-interfaces').size}</span>
            </OverlayTrigger>);
        }
        return (
          <tr key={idx}>
            <td>{m.get('name')}</td>
            <td>{numInterfaces}</td>
            <td>
              <div className='row-action-container'>
                <span
                  onClick={(e) => this.editModel(e, idx)}>
                  <i className={editClass}>edit</i>
                </span>
                <span
                  onClick={(e) => this.setState({activeOverallRow: idx, showRemoveConfirmation: true})}>
                  <i className={removeClass}>delete</i>
                </span>
              </div>
            </td>
          </tr>);
      });

    // build the action row at the bottom of the main table
    const actionRow = (
      <tr key='addModel' className='action-row'>
        <td colSpan="3">
          <i className={addClass} onClick={this.addModel}>add_circle</i>
          <span className={addTextClass} onClick={this.addModel}>{translate('add.interface.model')}</span>
        </td>
      </tr>
    );

    let extendedClass = 'extended-one';
    let tableWidthClass = 'col-12';
    let detailWidthClass = '';
    if (this.state.overallMode !== MODE.NONE) {
      if (this.state.detailMode === MODE.NONE) {
        tableWidthClass = 'col-8 verticalLine';
        detailWidthClass = 'col-4';
      } else {
        extendedClass = 'extended-two';
        tableWidthClass = 'col-6 verticalLine';
        detailWidthClass = 'col-6 multiple-details';
      }
    }

    return (
      <div className={extendedClass}>
        <div className={tableWidthClass}>
          <table className='table'>
            <thead>
              <tr>
                <th>{translate('interface.model')}</th>
                <th>{translate('network.interfaces')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows}
              {actionRow}
            </tbody>
          </table>
        </div>
        <div className={detailWidthClass}>
          {this.renderModelDetails()}
          {this.renderInterfaceDetails()}
        </div>
        {this.confirmModal()}
      </div>
    );
  }

  /*
   * Interface Model
   *
   * This section is responsible for handling the Interface Model area of the tab
   */

  handleInterfaceModelNameChange = (e, valid) => {
    const name = e.target.value;
    this.setState(prev => {
      return {
        interfaceModel: prev.interfaceModel.set('name', name),
        isInterfaceModelNameValid: valid
      };
    });
  }

  addInterface = (e) => {
    e.preventDefault();

    // Prevent adding while editing is in progress
    if (this.state.detailMode !== MODE.NONE)
      return;

    this.setState({
      detailMode: MODE.ADD,
      isInterfaceNameValid: false,

      networkInterface: fromJS({name: '', 'network-groups': List([undefined]),
        'forced-network-groups': List([undefined])}),
      deviceList: List().push(Map({'name': undefined})),
      bondOptions: '',
      bondDeviceName: '',
      isBondDeviceNameValid: false,
      isBondOptionsValid: true
    });
  }

  editInterface = (e, idx) => {
    e.preventDefault();

    // Prevent adding while editing is in progress
    if (this.state.detailMode !== MODE.NONE)
      return;

    this.setState(prev => {

      let newState = {
        detailMode: MODE.EDIT,
        isInterfaceNameValid: true,
        activeDetailRow: idx
      };

      let networkInterface = prev.interfaceModel.getIn(['network-interfaces', idx]);
      if (!networkInterface.get('forced-network-groups')) {
        networkInterface = networkInterface.set('forced-network-groups', List([undefined]));
      }
      if (!networkInterface.get('network-groups')) {
        networkInterface = networkInterface.set('network-groups', List([undefined]));
      }
      newState.networkInterface = networkInterface;

      if (networkInterface.has('bond-data')) {
        newState.deviceList = networkInterface.getIn(['bond-data', 'devices']);

        if (networkInterface.getIn(['bond-data', 'options'])) {
          try {
            newState.bondOptions = dump(networkInterface.getIn(['bond-data', 'options']).toJS());
          } catch (e) {
            newState.bondOptions = '';
            console.log('Unable to dump bond-data as yaml :', e); // eslint-disable-line no-console
          }
        }
        newState.bondDeviceName = networkInterface.getIn(['device','name']);

      } else {

        newState.deviceList = List().push(networkInterface.get('device'));
        newState.bondOptions = '';
        newState.bondDeviceName = '';
      }

      newState.isBondOptionsValid = true;
      newState.isBondDeviceNameValid = ! isEmpty(newState.bondDeviceName);

      return newState;
    });
  }

  confirmRemoveInterface = (idx) => {
    // Prevent adding while editing is in progress
    if (this.state.detailMode !== MODE.NONE)
      return;

    this.setState({showRemoveInterfaceConfirmation: true, interfaceToRemoveIndex: idx});
  }

  removeInterface = () => {
    // Prevent adding while editing is in progress
    if (this.state.detailMode !== MODE.NONE)
      return;

    if (!isNaN(this.state.interfaceToRemoveIndex)) {
      this.setState(prev => {
        return {
          networkInterface: undefined,
          interfaceModel: prev.interfaceModel.deleteIn(['network-interfaces',
            this.state.interfaceToRemoveIndex]),
          interfaceToRemoveIndex: undefined,
          showRemoveInterfaceConfirmation: false
        };
      });
    }
  }


  saveModel = () => {
    // Update the global model with the changes
    let model;
    if (this.state.overallMode === MODE.ADD) {
      model = this.props.model.updateIn(['inputModel', 'interface-models'], list =>
        list.push(this.state.interfaceModel));
    }
    else {
      model = this.getSortedModel().setIn(['inputModel', 'interface-models', this.state.activeOverallRow],
        this.state.interfaceModel);
    }
    this.props.updateGlobalState('model', model);
    this.closeModelDetails();
  }


  isInterfaceModelSaveAllowed = () => {
    // The save button is allowed if the values are all valid and there is
    // some change compared to the initial values
    const isValid =
      this.state.isInterfaceModelNameValid &&
      this.state.detailMode === MODE.NONE &&
      this.state.interfaceModel.get('network-interfaces').size > 0;

    if (!isValid) {
      this.modelChanged = false;
    } else {
      // If we are in add mode, then something has changed, so return true
      if (this.state.overallMode === MODE.ADD) {
        this.modelChanged = true;
      } else {
        const originalModel = this.getSortedModel().getIn(['inputModel', 'interface-models',
          this.state.activeOverallRow]);

        // Note simply comparing the overall object (originalModel === this.state.interfaceModel)
        // will incorrectly return false if the user changes the name and changes it back
        // (e.g. oldname -> newname -> oldname)
        this.modelChanged = ! this.state.interfaceModel.equals(originalModel);
      }
    }
    this.props.setDataChanged(this.props.tabIndex, this.modelChanged || this.detailsChanged);
    return this.modelChanged;
  }

  closeModelDetails = () => {
    this.modelChanged = false;
    this.detailsChanged = false;
    this.props.setDataChanged(this.props.tabIndex, false);
    this.setState({overallMode: MODE.NONE});
  }

  // Render the first detail box, which is for editing interface model details
  renderModelDetails = () => {

    if (this.state.overallMode !== MODE.NONE) {
      const title = this.state.overallMode === MODE.EDIT ?  translate('edit.interface.model')
        : translate('add.interface.model');

      const interfaces = this.state.interfaceModel.get('network-interfaces').map((e,idx) => {

        let minus, edit;
        //if (idx === arr.size-1 && this.state.deviceList.get(idx).get('name')) {
        let editClass = 'material-icons edit-button left-sign';
        let minusClass = 'material-icons right-sign';
        if (this.state.detailMode !== MODE.NONE) {
          editClass += ' disabled';
          minusClass += ' disabled';
        }
        edit = (
          <span key='edit' onClick={(e) => this.editInterface(e, idx)}>
            <i className={editClass}>edit</i>
          </span>
        );
        //}
        //if (idx > 0 || this.state.deviceList.get(idx).get('name')) {
        minus = (
          <span key='remove' onClick={(e) => this.confirmRemoveInterface(idx)}>
            <i className={minusClass}>delete</i>
          </span>
        );
        //}

        return (
          <div key={idx} className='dropdown-plus-minus'>
            <ValidatingInput isRequired='true' placeholder={translate('interface.name') + '*'}
              inputValue={e.get('name')} inputType='text' disabled='true' />
            <div className='plus-minus-container'> {edit} {minus} </div>
          </div>
        );
      });

      let addClass = 'material-icons add-button';
      let widthClass = '';
      let buttonClass = 'btn-container';
      if (this.state.detailMode !== MODE.NONE) {
        addClass += ' disabled';
        widthClass = 'col-6 verticalLine';
        buttonClass += ' hide';
      }

      const addButton = (
        <div className='action-column'>
          <i className={addClass} onClick={this.addInterface}>add_circle</i>
          {translate('add.network.interface')}
        </div>);

      return (
        <div className={widthClass}>
          <div className='details-section'>
            <div className='details-header'>{title}</div>
            <div className='details-body'>

              <ValidatingInput isRequired='true' placeholder={translate('interface.model.name') + '*'}
                inputValue={this.state.interfaceModel.get('name')} inputName='modelname'
                inputType='text' inputAction={this.handleInterfaceModelNameChange}
                disabled={this.state.detailMode !== MODE.NONE}/>
              <div className='details-group-title'>{translate('network.interfaces') + '* :'}</div>
              {interfaces}
              {addButton}

              <div className='btn-row details-btn'>
                <div className={buttonClass}>
                  <ActionButton key='cancel' type='default'
                    clickAction={this.closeModelDetails}
                    displayLabel={translate('cancel')}
                    isDisabled={this.state.detailMode !== MODE.NONE} />

                  <ActionButton key='save' clickAction={this.saveModel}
                    displayLabel={translate('save')} isDisabled={!this.isInterfaceModelSaveAllowed()}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  /*
   * Network Interface
   *
   * This section is responsible for handling the Network Interface section of the tab.
   */

  handleInterfaceNameChange = (e, valid) => {
    const name = e.target.value;
    this.setState(prev => {
      return {
        networkInterface: prev.networkInterface.set('name', name),
        isInterfaceNameValid: valid
      };
    });
  }

  handleBondDeviceNameChange = (value, valid) => {
    this.setState({
      bondDeviceName: value,
      isBondDeviceNameValid: valid
    });
  }

  handleBondOptionsChange = (value, valid) => {
    this.setState({
      bondOptions: value,
      isBondOptionsValid: valid
    });
  }

  saveNetworkInterface = () => {
    this.setState(prev => {

      return {
        detailMode: MODE.NONE,
        interfaceModel: this.getUpdatedInterfaceModel(prev),
        networkInterface: undefined,
      };
    });
  }

  getUpdatedInterfaceModel = (prevState) => {

    let networkInterface = prevState.networkInterface;
    if (networkInterface.has('bond-data')) {

      networkInterface = networkInterface
        .setIn(['bond-data', 'devices'], prevState.deviceList)
        .setIn(['device', 'name'], prevState.bondDeviceName);

      try {
        networkInterface = networkInterface.setIn(['bond-data', 'options'], fromJS(safeLoad(prevState.bondOptions)));
      } catch (e) {
        console.log('Unable to load bond-data from yaml :', e); // eslint-disable-line no-console
      }
    } else {
      networkInterface = networkInterface.set('device', prevState.deviceList.get(0));
    }

    if (networkInterface.get('forced-network-groups').last() === undefined) {
      if (networkInterface.get('forced-network-groups').size > 1) {
        networkInterface = networkInterface.updateIn(['forced-network-groups'], list => list.pop());
      } else {
        networkInterface = networkInterface.delete('forced-network-groups');
      }
    }
    if (networkInterface.get('network-groups').last() === undefined) {
      if (networkInterface.get('network-groups').size > 1) {
        networkInterface = networkInterface.updateIn(['network-groups'], list => list.pop());
      } else {
        networkInterface = networkInterface.delete('network-groups');
      }
    }

    let interfaceModel;
    if (prevState.detailMode === MODE.ADD) {
      interfaceModel = prevState.interfaceModel.updateIn(['network-interfaces'], list =>
        list.push(networkInterface));
    } else {
      interfaceModel = prevState.interfaceModel.setIn(['network-interfaces', prevState.activeDetailRow],
        networkInterface);
    }

    return interfaceModel;
  }

  isNetworkInterfaceSaveAllowed = () => {
    // The save button is allowed if the values are all valid and there is
    // some change compared to the initial values
    const forcedNetworkGroups = this.state.networkInterface.get('forced-network-groups');
    const networkGroups = this.state.networkInterface.get('network-groups');
    const isValid =
      this.state.isInterfaceNameValid &&
      this.state.deviceList.last().get('name') !== undefined &&
      (forcedNetworkGroups.size > 1 || forcedNetworkGroups.last() !== undefined ||
        networkGroups.size > 1 || networkGroups.last() !== undefined) &&
      (! this.state.networkInterface.has('bond-data') || (
        this.state.isBondOptionsValid  &&
        this.state.isBondDeviceNameValid
      ));

    if (!isValid) {
      this.detailsChanged = false;
    } else {
      // If we are in add mode, then something has changed, so return true
      if (this.state.detailMode === MODE.ADD) {
        this.detailsChanged = true;
      } else {
        this.detailsChanged = ! this.getUpdatedInterfaceModel(this.state).equals(this.state.interfaceModel);
      }
    }
    this.props.setDataChanged(this.props.tabIndex, this.modelChanged || this.detailsChanged);
    return this.detailsChanged;
  }

  closeNetworkInterfaceDetails = () => {
    this.detailsChanged = false;
    this.setState({detailMode: MODE.NONE});
  }

  // Render the second detail box, which is for editing interface details
  renderInterfaceDetails = () => {
    if (this.state.overallMode !== MODE.NONE && this.state.detailMode !== MODE.NONE) {
      let title;
      if (this.state.detailMode === MODE.ADD) {
        title = translate('add.network.interface');
      } else {
        title = translate('edit.network.interface');
      }

      return (
        <div className='col-6 second-details'>
          <div className='details-section'>
            <div className='details-header'>{title}</div>
            <div className='details-body'>

              <ValidatingInput isRequired='true' placeholder={translate('interface.name')}
                inputValue={this.state.networkInterface.get('name')} inputName='interfacename'
                inputAction={this.handleInterfaceNameChange}
                autoFocus="true" />
              <div className='details-group-title'>{translate('network.devices') + '* :'}</div>
              {this.renderDevices()}
              {this.renderNetworkGroups()}

              <If condition={this.state.networkInterface.has('bond-data')}>
                <div>
                  <div className='details-group-title'>{translate('bond.device.name') + '* :'}</div>
                  <ValidatingInput required='true' placeholder={translate('bond.device.name')}
                    inputValue={this.state.bondDeviceName} inputName='bonddevicename'
                    inputAction={(e, valid) => this.handleBondDeviceNameChange(e.target.value, valid)}
                  />
                </div>
              </If>

              <If condition={this.state.networkInterface.has('bond-data')}>
                <div>
                  <div className='details-group-title'>{translate('bond.options') + ':'}</div>
                  <ValidatingInput placeholder={translate('bond.options')}
                    inputValue={this.state.bondOptions} inputName='bondoptions'
                    inputType='textarea'
                    inputValidate={YamlValidator}
                    inputAction={(e, valid) => this.handleBondOptionsChange(e.target.value, valid)}
                  />
                </div>
              </If>

              <div className='btn-row details-btn'>
                <div className='btn-container'>

                  <ActionButton key='cancel' type='default'
                    clickAction={this.closeNetworkInterfaceDetails}
                    displayLabel={translate('cancel')}/>

                  <ActionButton key='save' clickAction={this.saveNetworkInterface}
                    displayLabel={translate('save')} isDisabled={!this.isNetworkInterfaceSaveAllowed()}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  /*
   * Network Device Logic
   *
   * This section is responsible for handling the network device dropdown box on the Network Interface
   * details section.  Note that multiple such dropdowns may exist for a given Network Interface
   */
  addDevice = () => {

    // add a new row if the last row has a selection
    this.setState(prev => {
      let newState = {};
      if (prev.deviceList.last().get('name')) {
        newState.deviceList = prev.deviceList.push(Map({name: undefined}));

        if (! prev.networkInterface.has('bond-data')) {
          newState.networkInterface = prev.networkInterface.set('bond-data',
            Map({options: {}, provider: 'linux'}));
        }
      }

      return newState;
    });
  }

  removeDevice = (idx) => {
    // Remove the row. If it was the last row, add a new empty one
    this.setState(prev => {

      let newState = {};

      let rows = prev.deviceList.delete(idx);
      if (rows.size === 0) {
        rows = rows.push(Map({name: undefined}));
      }
      if (rows.size < 2) {
        newState.networkInterface = prev.networkInterface.delete('bond-data');
      }
      newState.deviceList = rows;

      return newState;
    });
  }

  updateDevice = (val, idx) => {
    this.setState(prev => {
      // Update the device with the value the user has chosen
      return {deviceList: prev.deviceList.setIn([idx, 'name'], val)};
    });
  }

  renderDevices = () => {
    // Build list of logic ports from the nic-mapping section of the model to serve as the
    // contents of the dropdown
    let logicalNames = this.props.model.getIn(['inputModel', 'nic-mappings'])  // Get list of nic-mapping objects
      .map(e => e.get('physical-ports')           // Extract out the physical-ports entry (whose value is list)
        .map(e => e.get('logical-name')))         // Extract the logical-name entry from physical-ports list
      .flatten();                                 // Create a single-dimensional list out of above nested list

    const options = List(Set(logicalNames)).sort()  // Remove duplicates (by converting to a set) and sort
      .map(opt => <option key={opt} value={opt}>{opt}</option>);   // create <option> list for dropdown list

    return this.state.deviceList.map((row,idx, arr) => {

      let minus, plus;
      if (idx === arr.size-1 && this.state.deviceList.get(idx).get('name')) {
        plus = (
          <span key={this.props.name + 'plus'} onClick={this.addDevice}>
            <i className='material-icons right-sign'>add</i>
          </span>
        );
      }
      if (idx > 0 || this.state.deviceList.get(idx).get('name')) {
        minus = (
          <span key={this.props.name + 'minus'} onClick={() => this.removeDevice(idx)}>
            <i className='material-icons'>remove</i>
          </span>
        );
      }

      return (
        <div key={idx} className='dropdown-plus-minus'>
          <Dropdown
            value={this.state.deviceList.get(idx).get('name')}
            onChange={(e) => this.updateDevice(e.target.value, idx)}
            emptyOption={translate('none')}>

            {options}

          </Dropdown>
          <div className='plus-minus-container'> {minus} {plus} </div>
        </div>
      );
    });
  }

  /*
   * Network Group Logic
   *
   * This section is responsible for handling the network group dropdown box on the Network Interface
   * details section.  Note that multiple such dropdowns may exist for a given Network Interface
   */

  addNetworkGroup = (groupKey) => {
    // add a new row if the last row has a selection
    this.setState(prev => {
      return {networkInterface: prev.networkInterface.updateIn([groupKey], list => list.push(undefined))};
    });
  }

  removeNetworkGroup = (groupKey, idx) => {
    // Remove the row. If it was the last row, add a new empty one
    this.setState(prev => {

      let newInterface = prev.networkInterface.deleteIn([groupKey, idx]);

      if (newInterface.get(groupKey).size === 0) {
        newInterface = newInterface.updateIn([groupKey], list => list.push(undefined));
      }

      return {networkInterface: newInterface};
    });
  }

  updateNetworkGroup = (val, groupKey, idx) => {
    // Update the selected model with the value the user has chosen
    this.setState(prev => {
      return {networkInterface: prev.networkInterface.setIn([groupKey, idx], val)};
    });
  }

  renderNetworkGroups = () => {

    // Build the list of options in each combo box, which are the values of the
    // network-group names from the input model
    const options = this.props.model.getIn(['inputModel', 'network-groups'])
      .map(e => e.get('name'))
      .sort()
      .map(opt => <option key={opt} value={opt}>{opt}</option>);

    return (
      <div>
        {this.renderComboBox('forced-network-groups', options)}
        {this.renderComboBox('network-groups', options)}
      </div>
    );
  }


  renderComboBox = (groupKey, options) => {
    // Render a combo box for each network group
    const comboLines = this.state.networkInterface.get(groupKey).map((row,idx, arr) => {

      let minus, plus;
      // Render a plus only on the last row, and only if a valid value has been selected
      if (idx === arr.size-1 && this.state.networkInterface.getIn([groupKey, idx])) {
        plus = (
          <span key={this.props.name + 'plus'} onClick={() => this.addNetworkGroup(groupKey)}>
            <i className='material-icons right-sign'>add</i>
          </span>
        );
      }
      // Render a minus on every row except the first for when no valid value has been selected
      if (idx > 0 || this.state.networkInterface.getIn([groupKey, idx])) {
        minus = (
          <span key={this.props.name + 'minus'} onClick={() => this.removeNetworkGroup(groupKey, idx)}>
            <i className='material-icons left-sign'>remove</i>
          </span>
        );
      }

      return (
        <div key={idx} className='dropdown-plus-minus'>
          <Dropdown
            value={this.state.networkInterface.getIn([groupKey, idx])}
            onChange={(e) => this.updateNetworkGroup(e.target.value, groupKey, idx)}
            emptyOption={translate('none')}>

            {options}

          </Dropdown>
          <div className='plus-minus-container'> {minus} {plus} </div>
        </div>
      );
    });

    return (
      <div>
        <div className='details-group-title'>{translate(groupKey.replace(/-/g, '.')) + ':'}</div>
        {comboLines}
      </div>
    );
  }

  confirmModal = () => {
    // Present a confirmation dialog before deleting a network interface model
    if (this.state.showRemoveConfirmation) {
      const name = this.getRows().getIn([this.state.activeOverallRow, 'name']);

      return (
        <YesNoModal title={translate('warning')}
          yesAction={() => {this.deleteModel(this.state.activeOverallRow);
            this.setState({showRemoveConfirmation: false});} }
          noAction={() => this.setState({showRemoveConfirmation: false})}>
          {translate('details.interfacemodel.confirm.remove', name)}
        </YesNoModal>

      );
    } else if (this.state.showRemoveInterfaceConfirmation) {
      const name = this.state.interfaceModel.get('network-interfaces')
        .get(this.state.interfaceToRemoveIndex).get('name');

      return (
        <YesNoModal title={translate('warning')}
          yesAction={(e) => this.removeInterface()}
          noAction={() => this.setState({showRemoveInterfaceConfirmation: false,
            interfaceToRemoveIndex: undefined})}>
          {translate('details.interface.confirm.remove', name)}
        </YesNoModal>
      );
    }
  }
}

export default InterfaceModelsTab;
