// (c) Copyright 2019 SUSE LLC
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

class ListMultipleSelect extends  Component {

  constructor(props) {
    super(props);
    this.state = {
      selectedOptions: props.selectedOptions
    };
  }

  handleChange = (e) => {
    let options = e.target.options;
    let selOpts = [];
    // options are HTMLOptionsCollection
    for (var i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selOpts.push(options[i].value);
      }
    }
    this.props.selectAction(selOpts);
  }

  render() {
    let options = this.props.options.map((opt) => {
      if (this.state.selectedOptions?.includes(opt)) {
        return <option selected key={opt} value={opt}>{opt}</option>;
      }
      else {
        return <option key={opt} value={opt}>{opt}</option>;
      }
    });

    let classname = 'server-detail-multiselect';
    if (this.props.moreClass) {
      classname += ' ' + this.props.moreClass;
    }
    return (
      <div className={classname}>
        <select multiple className='rounded-corner' name={this.props.name}
          disabled={this.props.disabled}
          onChange={this.handleChange}>{options}</select>
      </div>
    );
  }
}

export default ListMultipleSelect;
