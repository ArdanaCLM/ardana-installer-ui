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
import { AlarmDonut } from '../components/Graph';

// This is a test/demonstration page to explore how the alarm donut component
// works and to see the effect of changing its various settings
export class AlarmDonutTest extends Component {
  constructor() {
    super();

    this.state = {

      // Default to something approaching realistic
      radius: 60,

      critical: 5,
      warning: 12,
      unknown: 21,
      ok: 70,
    };
  }

  changed = (event) => {
    const target = event.target;
    let value;
    if (target.type == 'checkbox') {
      value = target.checked;
    } else if (target.type == 'range') {
      // For some stupid reason, html ranges are returned as strings. Convert them to numbers!
      value = parseFloat(target.value);
    } else {
      value = target.value;
    }

    const name = target.name;
    this.setState({[name]: value});
  }

  render() {

    return (
      <div className='row'>
        <div className='alarmdonut-test col-md-12'>
          <div className='row'>
            <div className='controls col-md-8'>

              <div className='irow'>
                <div className='name'>Critical</div>
                <div className='value'>
                  <input type="range" min={0} max={100} value={this.state.critical} name='critical'
                    onChange={this.changed} />
                  <div>{this.state.critical}</div>
                </div>
              </div>

              <div className='irow'>
                <div className='name'>Warning</div>
                <div className='value'>
                  <input type="range" min={0} max={100} value={this.state.warning} name='warning'
                    onChange={this.changed} />
                  <div>{this.state.warning}</div>
                </div>
              </div>

              <div className='irow'>
                <div className='name'>Unknown</div>
                <div className='value'>
                  <input type="range" min={0} max={100} value={this.state.unknown} name='unknown'
                    onChange={this.changed} />
                  <div>{this.state.unknown}</div>
                </div>
              </div>

              <div className='irow'>
                <div className='name'>ok</div>
                <div className='value'>
                  <input type="range" min={0} max={100} value={this.state.ok} name='ok'
                    onChange={this.changed} />
                  <div>{this.state.ok}</div>
                </div>

              </div>

              <div className='irow'>
                <div className='name'>Radius</div>
                <div className='value'>
                  <input type="range" min={40} max={100} value={this.state.radius} name='radius'
                    onChange={this.changed} />
                  <div>{this.state.radius}</div>
                </div>
              </div>

            </div>

            <div className='gauge col-md-4'>
              <AlarmDonut
                radius={this.state.radius}
                critical={this.state.critical}
                warning={this.state.warning}
                unknown={this.state.unknown}
                ok={this.state.ok}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
