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

import {UpdateServerPages} from "../pages/ReplaceServer/UpdateServerPages";

const PAGES_HOLDERS = {
  'servers_ReplaceServer': UpdateServerPages //<menu>_<operation> : <all the possible pages defined>
};

/**
 * Helper to find the page components based on menuName, operationName and steps
 * specified. <menuName_operationName> is the key to find all the possible pages
 * defined for the menu. steps will decide which pages we need for this update
 * process.
 *
 * @param menuName           the menu name , for example servers
 * @param operationName      the operation name, for example ReplaceServer
 * @param steps              the steps for the process.
 * @returns pages            assembled page components based on steps
 */
export function getPages(menuName, operationName, steps) {

  //TODO handle empty menuName and operationName
  //TODO handle can not find pageHolder
  let key = menuName + '_' + operationName;
  let pageHolder = PAGES_HOLDERS[key];
  let pages = undefined;
  if(steps && steps.length > 0) {
    pages = steps.map(step => {
      return {
        name: step.name,
        component: pageHolder[step.name]
      };
    });
  }
  return pages;
}
