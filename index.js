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
import '@babel/polyfill';
import 'whatwg-fetch';
import React from 'react';
import ReactDOM from 'react-dom';
import Deployer from './src/Deployer';
import './src/styles/deployer.less';
import { loadBundle } from './src/localization/localize';
import { PRODUCTION } from './src/utils/ConfigHelper';

const render = () => {
  let root = document.getElementById('root');
  if (! root) {
    // If there is not already a root div, create one, since react warns against
    // rendering directly into the body
    root = document.createElement('div');
    root.id = 'root';
    document.body.append(root);
  }
  ReactDOM.render(<Deployer />, root);
};

loadBundle().then(render);

if (!PRODUCTION && module.hot) {
  module.hot.accept(render);
}
