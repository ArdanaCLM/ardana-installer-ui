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
import React from 'react';
import { isEmpty } from 'lodash';
import { List } from 'immutable';

export function ListDropdown(props) {

  let options = props.optionList.map((opt) => {
    if (props.defaultOption && opt === props.defaultOption.value) {
      return <option key={opt} value={opt}>{props.defaultOption.label}</option>;
    } else {
      return <option key={opt} value={opt}>{opt}</option>;
    }
  });

  if (props.emptyOption && isEmpty(props.value)) {
    // add emptyOption to the beginning of the list if nothing has been selected yet
    const result = options.unshift(
      <option
        key='noopt' value={props.emptyOption.value}>{props.emptyOption.label}
      </option>
    );

    // With immutable lists, unshift creates a new list with the value inserted, but
    // with javascript arrays, unshift modifies the array in-place and returns an integer.
    // Handle the immutableJS case here.
    if (result instanceof List) {
      options = result;  // Use the new list with the empty value at the beginning
    }
  }

  let classname = 'server-detail-select';
  if (props.moreClass) {
    classname += ' ' + props.moreClass;
  }
  return (
    <div className={classname}>
      <select className='rounded-corner' value={props.value} name={props.name}
        onChange={(e) => props.selectAction(e.target.value)}>{options}</select>
    </div>
  );
}
