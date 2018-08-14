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
import '../styles/deployer.less';

import { translate } from '../localization/localize.js';

class ContextMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      show: this.props.show,
      location: this.props.location
    };
  }

  componentDidMount() {
    // add a listener for clicking outside menu area
    // when user clicks outside menu area, the menu will be closed
    document.addEventListener('click', this.handleCloseMenu);
  }

  componentWillUnmount() {
    // remove the listener for clicking outside menu area
    document.removeEventListener('click', this.handleCloseMenu);
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      show : newProps.show,
      location: newProps.location
    });
  }

  handleCloseMenu = (event) => {
    if (!this.dropdownMenu.contains(event.target)) {
      this.props.close();
    }
  }

  renderMenuItems() {
    let items = this.props.items.filter(item => item.show).map((item => {
      return (
        <div className='menu-item' key={item.key} onClick={item.handleShowModal}>
          {translate(item.key)}
        </div>
      );
    }));
    return items;
  }

  render() {
    let cName = 'context-menu-container rounded-corner shadowed-border';
    let locStyle = {
      left: this.state.location ? (this.state.location.x -100) : 0,
      top:  this.state.location ? this.state.location.y : 0
    };

    return (
      this.state.show ?
        <div ref={(element) => this.dropdownMenu = element} className={cName} style={locStyle}>
          {this.renderMenuItems()}
        </div> : null
    );
  }
}

export default ContextMenu;
