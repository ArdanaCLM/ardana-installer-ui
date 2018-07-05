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
import { HashRouter as Router, Link } from 'react-router-dom';
import Route from 'react-router-dom/Route';
import { translate } from '../localization/localize.js';

class NavMenu extends Component {

  render()
  {
    // Build up the left bar items. Using Route enables us to highlight
    // the currently chosen item, i.e. the one that matches the current URL
    const leftBarItems = this.props.routes.map((e, index) => (
      <Route
        key={index}
        path={e.slug}
        children={({ match }) => (
          <li >
            <Link className={match ? 'active' : ''} to={e.slug}>{e.name}</Link>
          </li>)}
      />
    ));

    // Build up the top bar, which is nested set of routes; the outer level
    // corresponds to the main menu option chosen, and the inner one has the submenu items
    const topBar = this.props.routes.map((e, index) => (
      <Route
        key={index}
        path={e.slug}
        render={props => {
          const items = e.items.map((sub, subidx) => (
            <Route
              key={subidx}
              path={sub.slug}
              children={({match}) => (
                <Link className={match ? 'active' : ''} to={sub.slug}>{sub.name}</Link>
              )}
            />
          ));
          return (
            <nav>
              {items}
            </nav>
          );
        }}
      />
    ));

    // Render the content of any top-level items chosen.  This permits rendering
    // content for a top-level item even when no submenu item is chosen
    let content = this.props.routes.map(e => (
      <Route
        key={e.slug}
        exact path={e.slug}
        component={e.component}/>
    ));

    // Render the contents of the chose submenu item.
    this.props.routes.forEach(route => {
      route.items.forEach(item => {
        content.push(
          <Route
            key={item.slug}
            exact path={item.slug}
            component={item.component}/>
        );
      });
    });

    return(
      <Router>
        {/* Router requires a single child, so surround everything in a div */}
        <div>
          <aside className="main-menu">
            <header>{translate('openstack.cloud.deployer.title.version')}</header>
            <ul> {leftBarItems} </ul>
          </aside>
          <section className="main-window">
            <section className="submenu">
              {topBar}
            </section>
            <section className="content">
              {content}
            </section>
          </section>
        </div>
      </Router>
    );
  }
}

export default NavMenu;