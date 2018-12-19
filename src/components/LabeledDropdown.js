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
import { ListDropdown } from './ListDropdown.js';
import { translate } from '../localization/localize.js';
import {ActionButton} from "./Buttons";

export class LabeledDropdown extends Component {
  render() {
    let labelStr = this.props.label ? translate(this.props.label) : '';
    let label = this.props.label ? ((this.props.isRequired) ? labelStr + '*' : labelStr) : '';
    return (
      <div className='detail-line'>
        <div className='detail-heading'>{label}</div>
        <div className='input-body'>
          <ListDropdown name={this.props.name} value={this.props.value}
            optionList={this.props.optionList} emptyOption={this.props.emptyOption}
            selectAction={this.props.selectAction} defaultOption={this.props.defaultOption}
            moreClass={this.props.moreClass}/>
        </div>
      </div>
    );
  }
}

export class LabeledDropdownWithButton extends Component {
  render() {
    let labelStr = this.props.label ? translate(this.props.label) : '';
    let label = this.props.label ? ((this.props.isRequired) ? labelStr + '*' : labelStr) : '';
    return (
      <div className='detail-line'>
        <div className='detail-heading'>{label}</div>
        <div className='input-body'>
          <div className='input-with-button'>
            <ListDropdown name={this.props.name} value={this.props.value} moreClass={'has-button'}
              optionList={this.props.optionList} emptyOption={this.props.emptyOption}
              selectAction={this.props.selectAction}/>
            <ActionButton type={'default'} clickAction={this.props.buttonAction} moreClass={'inline-button'}
              displayLabel={translate(this.props.buttonLabel) + ' ...'}/>
          </div>
        </div>
      </div>
    );
  }
}
