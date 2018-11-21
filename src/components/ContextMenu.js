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

import { translate } from '../localization/localize.js';

class ContextMenu extends Component {
  componentDidMount() {
    // add a listener for clicking outside menu area
    // when user clicks outside menu area, the menu will be closed
    document.addEventListener('click', this.handleClick);
  }

  componentWillUnmount() {
    // remove the listener for clicking outside menu area
    document.removeEventListener('click', this.handleClick);
  }

  handleClick = (event) => {
    // remove the listener for clicking outside menu area
    document.removeEventListener('click', this.handleClick);
    // Inform the parent to close (and stop rendering) this menu
    this.props.close();
  }

  render() {
    const items = this.props.items.map((item => {
      return (
        <div className='menu-item' key={item.key} onClick={() => {item.action?.(item.callbackData);}}>
          {translate(item.key)}
        </div>
      );
    }));

    let cName = 'context-menu-container rounded-corner shadowed-border';
    let locStyle = {
      left: this.props.location.x - 100,
      top:  this.props.location.y
    };

    return (
      <div ref={(element) => this.dropdownMenu = element} className={cName} style={locStyle}>
        {items}
      </div>
    );
  }
}

export default ContextMenu;
