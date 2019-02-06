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
import { isEmpty } from 'lodash';
import { translate } from '../../localization/localize.js';
import { alphabetically } from '../../utils/Sort.js';
import { MODE } from '../../utils/constants.js';
import { ValidatingInput } from '../../components/ValidatingInput.js';
import { ActionButton } from '../../components/Buttons.js';
import { List, Map } from 'immutable';
import { NetworkInterfaceValidator, PCIAddressValidator } from '../../utils/InputValidators.js';
import { YesNoModal } from '../../components/Modals.js';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import { ErrorMessage } from '../../components/Messages.js';
import { LoadingMask } from '../../components/LoadingMask.js';
import { getInternalModel } from '../topology/TopologyUtils.js';

class NicMappingTab extends Component {

  constructor(props) {
    super(props);

    this.state = {
      mode: MODE.NONE,
      activeRow: undefined,

      nicMappingName: '',

      isNameValid: true,
      // Since many fields on the form can be edited at the same time, the validity of
      // each field is tracked separately within the detail row entry
      detailRows: undefined,
      // check against nic-mappings in use when
      // isUpdateMode
      nicMappingsInUse: undefined,
      loading: false,
      errorMsg: undefined
    };
  }

  componentDidMount() {
    if(this.props.isUpdateMode) {
      this.setState({loading: true});
      getInternalModel()
        .then((internalModel) => {
          if (internalModel) {
            let nic_mappings = this.getNicMappingsInUse(internalModel);
            this.setState({nicMappingsInUse: nic_mappings, loading: false});
          }
        })
        .catch(error => {
          let msg =
            translate(
              'edit.server.groups.get.nicmappings_inuse.error', error.toString());
          this.setState({errorMsg: msg, loading: false});
        });
    }
  }

  getNicMappingsInUse = (internalModel) => {
    let nicNames =
      internalModel['internal']['servers']?.filter(server => !isEmpty(server['ardana_ansible_host']))
        .map(server => server['nic_map']['name']);
    // remove the duplicates
    // nicNames could be like ['HP-DL360-6PORT', 'HP-DL360-6PORT']
    nicNames = [...new Set(nicNames)];

    // get details from internalModel
    let nicMappingsModel = internalModel['internal']['nic_mappings'];
    let nicMappings;
    if(nicMappingsModel) {
      nicMappings = nicNames.map(nName => nicMappingsModel[nName]);
    }
    return nicMappings;
  };

  resetData = () => {
    this.setState({
      mode: MODE.NONE,
      activeRow: undefined,
      nicMappingName: '',
      isNameValid: true,
      detailRows: undefined,
    });
  }

  // Returns a new model with the nic mappings in sorted order
  getSortedModel = () => {
    return this.props.model.updateIn(['inputModel','nic-mappings'],
      list => list.sort((a,b) => alphabetically(a.get('name'), b.get('name'))));
  }

  // Returns the nic mapping rows from the model in sorted order
  getRows = () => {
    return this.getSortedModel().getIn(['inputModel','nic-mappings']);
  }

  addNicMapping = (e) => {
    e.preventDefault();

    // Prevent adding while editing is in progress
    if (this.state.mode !== MODE.NONE)
      return;

    this.setState({
      mode: MODE.ADD,
      isNameValid: false,
      nicMappingName: '',
      detailRows: List().push(this.newDetailRow())
    });
  }

  editNicMapping = (e, idx) => {
    e.preventDefault();

    // Prevent editing while editing / adding is in progress
    if (this.state.mode !== MODE.NONE)
      return;

    this.setState({
      mode: MODE.EDIT,
      activeRow: idx,
      isNameValid: true,
      nicMappingName: this.getRows().getIn([idx, 'name']),
      detailRows: this.getRows().getIn([idx, 'physical-ports']).map(e =>
        e.set('isBusAddressValid', true).set('isLogicalNameValid', true))
    });
  }

  deleteNicMapping = (idx) => {

    // Prevent deleting while editing / adding is in progress
    if (this.state.mode !== MODE.NONE)
      return;

    const model = this.getSortedModel().removeIn(['inputModel', 'nic-mappings', idx]);
    this.props.updateGlobalState('model', model);
  }

  handleNameChange = (e, valid) => {
    this.setState({
      nicMappingName: e.target.value,
      isNameValid: valid
    });
  }

  isSaveAllowed = () => {
    let isChanged = undefined;

    // The save button is allowed if the values are all valid and there is
    // some change compared to the initial values

    const isValid = this.state.isNameValid && this.state.detailRows.every(e =>
      e.get('isBusAddressValid') && e.get('isLogicalNameValid'));
    if (!isValid) {
      isChanged = false;
    } else {
      // If we are in add mode, then something has changed, so return true
      if (this.state.mode === MODE.ADD) {
        isChanged = true;
      } else {
        isChanged = this.getSortedModel().getIn(['inputModel', 'nic-mappings', this.state.activeRow])
          !== this.getUpdatedModel().getIn(['inputModel', 'nic-mappings', this.state.activeRow]);
      }
    }
    this.props.setDataChanged(this.props.tabIndex, isChanged);
    return isChanged;
  }

  newDetailRow = () => Map({
    'logical-name':'',
    'bus-address':'',
    isLogicalNameValid: false,
    isBusAddressValid: false,
  });

  newValidityRow = () => Map({
    'logical-name': false,
    'bus-address': false,
  });

  addDetailRow = () => {
    this.setState(prev => ({detailRows: prev.detailRows.push(this.newDetailRow())}));
  }

  removeDetailRow = (idx) => {
    // Remove the row. If it was the last row, add a new empty one
    this.setState(prev => {
      let rows = prev.detailRows.delete(idx);
      if (rows.size === 0) {
        rows = rows.push(this.newDetailRow());
      }
      return {detailRows: rows};
    });
  }

  updateDetailRow = (idx, field, value, valid) => {
    this.setState(prev => {

      let validityField;
      if (field === 'logical-name') {
        validityField = 'isLogicalNameValid';
      } else {
        validityField = 'isBusAddressValid';
      }

      return {detailRows: prev.detailRows.setIn([idx, field], value).setIn([idx, validityField], valid)};
    });
  }


  // return a new Immutable model with the values updated from the form
  getUpdatedModel = () => {
    let nicMap = Map({
      'name': this.state.nicMappingName,
      'physical-ports': this.state.detailRows.map(e => e.set('type','simple-port')
        .delete('isLogicalNameValid').delete('isBusAddressValid'))
    });

    let model;

    if (this.state.mode === MODE.ADD) {
      model = this.props.model.updateIn(['inputModel', 'nic-mappings'], list => list.push(nicMap));
    } else {
      // Merge in the new entries from the form
      model = this.getSortedModel().mergeDeepIn(['inputModel', 'nic-mappings', this.state.activeRow], nicMap)
        // Remove any entries that no longer exist
        .updateIn(['inputModel', 'nic-mappings', this.state.activeRow, 'physical-ports'],
          list => list.setSize(this.state.detailRows.size));
    }
    return model;
  }

  saveDetails = () => {
    this.props.updateGlobalState('model', this.getUpdatedModel());
    this.closeDetails();
  }

  renderDetailRows(nicMappingInUse) {
    return this.state.detailRows.map((row, idx, arr) => {
      const lastRow = (idx === arr.size-1);
      // if have nicMappingInUse and it has this logical-name
      // this logic-name is in use
      let isInUse =
        (nicMappingInUse && nicMappingInUse['physical-ports'].map(port => port['logical-name'])
          .includes(row.get('logical-name')));

      return (
        <div key={idx} className='dropdown-plus-minus'>
          <div className="field-container">
            <ValidatingInput
              disabled={isInUse}
              inputAction={(e, valid) => this.updateDetailRow(idx, 'logical-name', e.target.value, valid)}
              inputType='text'
              inputValue={row.get('logical-name')}
              inputValidate={NetworkInterfaceValidator}
              isRequired='true'
              placeholder={translate('port.logical.name') + '*'} />

            <ValidatingInput
              disabled={isInUse}
              inputAction={(e, valid) => this.updateDetailRow(idx, 'bus-address', e.target.value, valid)}
              inputType='text'
              inputValue={row.get('bus-address')}
              inputValidate={PCIAddressValidator}
              isRequired='true'
              placeholder={translate('pci.address') + '*'} />
          </div>

          <div className='plus-minus-container'>
            <If condition={(idx > 0 || row.get('logical-name') || row.get('bus-address')) && !isInUse}>
              <span key={this.props.name + 'minus'} onClick={() => this.removeDetailRow(idx)}>
                <i className='material-icons left-sign'>remove</i>
              </span>
            </If>
            <If condition={lastRow && row.get('isBusAddressValid') && row.get('isLogicalNameValid')}>
              <span key={this.props.name + 'plus'} onClick={this.addDetailRow}>
                <i className='material-icons right-sign'>add</i>
              </span>
            </If>
          </div>
        </div>
      );
    });
  }

  closeDetails = () => {
    this.props.setDataChanged(this.props.tabIndex, false);
    this.setState({mode: MODE.NONE});
  }

  renderDetails = () => {

    if (this.state.mode !== MODE.NONE) {
      let title;

      if (this.state.mode === MODE.EDIT) {
        title = translate('edit.nic.mapping');
      } else {
        title = translate('add.nic.mapping');
      }
      // if nicMappingsInUse has this nic mapping name,
      // return nic mapping in use when isUpdateMode to check against
      // logical-name in use
      let nicMappingInUse = this.props.isUpdateMode &&
        this.state.nicMappingsInUse?.filter(mp=>mp['name'] === this.state.nicMappingName)[0];
      return (
        <div className='col-4'>
          <div className='details-section'>
            <div className='details-header'>{title}</div>
            <div className='details-body'>

              <ValidatingInput isRequired='true' placeholder={translate('nic.mapping.name') + '*'}
                disabled={nicMappingInUse}
                inputValue={this.state.nicMappingName} inputName='name' inputType='text'
                inputAction={this.handleNameChange} />
              <div className="field-title-container">
                <div className='details-group-title column-title'>
                  {translate('port.logical.name') + '* :'}</div>
                <div className='details-group-title column-title'>
                  {translate('pci.address') + '* :'}</div>
              </div>
              {this.renderDetailRows(nicMappingInUse)}

              <div className='btn-row details-btn'>
                <div className='btn-container'>

                  <ActionButton key='cancel' type='default'
                    clickAction={this.closeDetails}
                    displayLabel={translate('cancel')}/>

                  <ActionButton key='save' clickAction={this.saveDetails}
                    displayLabel={translate('save')} isDisabled={!this.isSaveAllowed()}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  confirmModal() {
    if (this.state.showRemoveConfirmation) {
      const name = this.getRows().getIn([this.state.activeRow, 'name']);

      return (
        <YesNoModal title={translate('warning')}
          yesAction={() => {this.deleteNicMapping(this.state.activeRow);
            this.setState({showRemoveConfirmation: false});} }
          noAction={() => this.setState({showRemoveConfirmation: false})}>
          {translate('details.nicmapping.confirm.remove', name)}
        </YesNoModal>
      );
    }
  }

  render() {

    let addClass = 'material-icons md-dark add-button';
    let addTextClass = 'add-text';
    let editClass = 'material-icons edit-button';
    let removeClass = 'material-icons remove-button';
    if (this.state.mode != MODE.NONE) {
      addClass += ' disabled';
      addTextClass += ' disabled';
      editClass += ' disabled';
      removeClass += ' disabled';
    }

    const rows = this.getRows()
      .map((m,idx) => {
        // if nicMappingsInUse has this nic mapping name,
        // this nic mapping is in use when isUpdateMode
        let isInUse = this.props.isUpdateMode &&
          this.state.nicMappingsInUse?.map((mp)=> mp['name']).includes(m.get('name'));
        const portList = m.get('physical-ports').toJS();
        const tooltipText = portList.map(p => p['logical-name']).join(',\n');
        const tooltip = (<Tooltip id='physical-ports' className='cell-tooltip'>{tooltipText}</Tooltip>);
        const numPorts = (
          <OverlayTrigger placement='right' overlay={tooltip}>
            <span>{m.get('physical-ports').size}</span>
          </OverlayTrigger>);
        return (
          <tr key={idx}>
            <td>{m.get('name')}</td>
            <td>{numPorts}</td>
            <td>
              <div className='row-action-container'>
                <span onClick={(e) => this.editNicMapping(e, idx)}>
                  <i className={editClass}>edit</i>
                </span>
                <If condition={!isInUse}>
                  <span onClick={(e) => this.setState({activeRow: idx, showRemoveConfirmation: true})}>
                    <i className={removeClass}>delete</i>
                  </span>
                </If>
              </div>
            </td>
          </tr>);
      });

    const actionRow = (
      <tr key='addNicMapping' className='action-row'>
        <td colSpan="3">
          <i className={addClass} onClick={this.addNicMapping}>add_circle</i>
          <span className={addTextClass} onClick={this.addNicMapping}>{translate('add.nic.mapping')}</span>
        </td>
      </tr>
    );

    return (
      <div className='extended-one'>
        <div className={this.state.mode !== MODE.NONE ? 'col-8 verticalLine' : 'col-12'}>
          <table className='table'>
            <thead>
              <tr>
                <th>{translate('nic.mapping.name')}</th>
                <th>{translate('number.ports')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows}
              {actionRow}
            </tbody>
          </table>
        </div>
        <If condition={this.state.errorMsg}>
          <div className='notification-message-container'>
            <ErrorMessage
              message={this.state.errorMsg}
              closeAction={() => this.setState({errorMsg: undefined})}/>
          </div>
        </If>
        <If condition={this.state.loading}>
          <LoadingMask className='input-modal-mask' show={this.state.loading}></LoadingMask>
        </If>
        {this.renderDetails()}
        {this.confirmModal()}
      </div>
    );
  }
}

export default NicMappingTab;
