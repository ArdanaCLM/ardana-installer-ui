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
import createHistory from 'history/createBrowserHistory';

/**
 * navigate directly to the given URL fragment, for example, /login to go to the login
 * page.  This function encapsulates the particular aspects of the react router that
 * is used (currently the HashRouter).  If this router is replaced with another, then
 * the rest of the application should not need to change.
 */
export function navigateTo(url, state, search) {
  const history = createHistory();

  // The HashRouter expects the location to be in the "hash" property of the location.
  // Add the destination to the history object
  history.push({
    pathname: '/',
    search: search,
    hash: '#' + url,
  }, state);

  // Now navigate the browser to the newly added history entry
  history.go(0);
}

export function redirectToLogin(forced = true) {
  navigateTo('/login', { forcedRedirect: forced });
}

export function wasRedirectedToLogin() {
  const location = createHistory().location;
  return location.state?.['forcedRedirect'] === true;
}
