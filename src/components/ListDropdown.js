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

export class ListDropdown extends Component {
  constructor(props) {
    super(props);

    this.state = {
      value: this.props.value
    };
  }

  handleSelect = (e) => {
    this.setState({value: e.target.value});
    this.props.selectAction(e.target.value);
  }

  componentWillReceiveProps(newProps) {
    if (this.state.value !== newProps.value) {
      this.setState({value : newProps.value});
    }
  }

  renderOptions() {
    let options = this.props.optionList.map((opt) => {
      if (this.props.defaultOption && opt === this.props.defaultOption.value) {
      return <option key={opt} value={opt}>{this.props.defaultOption.label}</option>;
    } else {
      return <option key={opt} value={opt}>{opt}</option>;
    }
  });

  if(this.props.emptyOption && (this.state.value === '' || this.state.value === undefined)) {
    let emptyOption = [
      <option
      key='noopt' value={this.props.emptyOption.value}>{this.props.emptyOption.label}
      </option>
    ];
    //add at the beginning
    options = emptyOption.concat(options);
  }

  return options;
}

render() {
  let classname = 'server-detail-select';
  if (this.props.moreClass) {
    classname += ' ' + this.props.moreClass;
  }
  return (
      <div className={classname}>
        <select className='rounded-corner' value={this.state.value} name={this.props.name}
        onChange={this.handleSelect}>{this.renderOptions()}</select>
      </div>
      );
}
}