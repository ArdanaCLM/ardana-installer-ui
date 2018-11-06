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
import { Speedometer } from '../components/Graph';

// This is a test/demonstration page to explore how the Speedometer component
// works and to see the effect of changing its various settings
export class SpeedometerTest extends Component {
  constructor() {
    super();

    this.state = {
      // These values are not sent to the speedometer directly, but just affect
      // what kind of value can be sent.
      integersOnly: true, // restrict the slider to just integers
      noValue: false,     // send 'undefined' as the value, rather than a real number

      // Default to something approaching realistic
      caption: '',
      decimals: 0,
      displayAsPercent: true,
      endAngle: 311,
      max: 1024,
      radius: 60,
      startAngle: 229,
      title: 'MEMORY',
      units: 'GB',
      value: 448,
      danger: 912,
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
    const valueStep = this.state.integersOnly ? '1' : 'any';

    return (
        <div className='row'>
          <div className='speedometer-test col-md-12'>
            <div className='row'>
              <div className='controls col-md-8'>
                <div className='irow'>
                  <div className='name'>Value</div>
                  <div className='value'>
                    <input type="range" min={0} max={this.state.max} step={valueStep} value={this.state.value} name='value'
                    onChange={this.changed} disabled={this.state.noValue} />
                    <div>{this.state.noValue ? '(No Value)' : this.state.value}</div>
                  </div>

                  <div className='name'>Integers Only?</div>
                  <div>
                    <input type="checkbox" value={this.state.integersOnly} name='integersOnly'
                    defaultChecked={this.state.integersOnly} onChange={this.changed} />
                  </div>

                  <div className='name'>No Value ?</div>
                  <div>
                    <input type="checkbox" value={this.state.noValue} name='noValue'
                    defaultChecked={this.state.noValue} onChange={this.changed} />
                  </div>
                </div>


                <div className='irow'>
                  <div className='name'>Danger</div>
                  <div className='value'>
                    <input type="range" min={0} max={this.state.max} value={this.state.danger} name='danger'
                    onChange={this.changed} />
                    <div>{this.state.danger}</div>
                  </div>
                </div>

                <div className='irow'>
                  <div className='name'>Max</div>
                  <div className='value'>
                    <input type="number" min="0" value={this.state.max} name='max' onChange={this.changed} />
                  </div>
                </div>

                <div className='irow'>
                  <div className='name'>Radius</div>
                  <div className='value'>
                    <input type="range" min={40} max={100} value={this.state.radius} name='radius' onChange={this.changed} />
                    <div>{this.state.radius}</div>
                  </div>
                </div>

                <div className='irow'>
                  <div className='name'>Start Angle</div>
                  <div className='value'>
                    <input type="range" min={0} max={360} value={this.state.startAngle} name='startAngle'
                    onChange={this.changed} />
                    <div>{this.state.startAngle}</div>
                  </div>
                </div>

                <div className='irow'>
                  <div className='name'>End Angle</div>
                  <div className='value'>
                    <input type="range" min={0} max={360} value={this.state.endAngle} name='endAngle'
                    onChange={this.changed} />
                    <div>{this.state.endAngle}</div>
                  </div>
                </div>

                <div className='irow'>
                  <div className='name'>Decimals</div>
                  <div className='value'>
                    <input type="number" min="0" max="2" value={this.state.decimals} name='decimals'
                    onChange={this.changed} />
                  </div>
                </div>

                <div className='irow'>
                  <div className='name'>Display As %</div>
                  <input type="checkbox" value={this.state.displayAsPercent} name='displayAsPercent'
                  defaultChecked={this.state.displayAsPercent} onChange={this.changed} />
                </div>

                <div className='irow'>
                  <div className='name'>Title</div>
                  <div className='value'>
                    <input type="text" value={this.state.title} name='title' onChange={this.changed} />
                  </div>
                </div>

                <div className='irow'>
                  <div className='name'>
                  Units
                  </div>
                  <div className='value'>
                    <input type="text" value={this.state.units} name='units' onChange={this.changed} />
                  </div>
                </div>

                <div className='irow'>
                  <div className='name'>
                  Caption
                  </div>
                  <div className='value'>
                    <input type="text" value={this.state.caption} name='caption' onChange={this.changed} />
                  </div>
                </div>

              </div>

              <div className='gauge col-md-4'>
                <Speedometer
                caption={this.state.caption !== '' ? this.state.caption : undefined}
                decimals={this.state.decimals}
                displayAsPercent={this.state.displayAsPercent}
                endAngle={this.state.endAngle}
                max={this.state.max}
                radius={this.state.radius}
                startAngle={this.state.startAngle}
                title={this.state.title || undefined}
                units={this.state.units}
                value={this.state.noValue ? undefined : this.state.value}
                danger={this.state.danger}
                />
              </div>
            </div>
          </div>
        </div>
    );
  }
}
