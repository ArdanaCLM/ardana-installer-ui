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

// NOTE: The variable PRODUCTION is set by webpack to identify whether
// we are in a production or development environment.
import { config as configDev } from '../../config.dev.js';
import { config as configProd } from '../../config.prod.js';

var config;
if (PRODUCTION) { // eslint-disable-line no-undef
  config = configProd;
} else {
  config = configDev;
}

export function getAppConfig(key) {
  return config[key];
}

/**
 * if the app is in production mode, return true, otherwise return false
 * @returns {boolean}
 */
export function isProduction() {
  if (PRODUCTION) { // eslint-disable-line no-undef
    return true;
  }
  return false;
}
