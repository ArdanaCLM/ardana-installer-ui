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
import Cookies from 'universal-cookie';

/**
 * Module to manage the auth token so that it can be supplied in the header of subsequent REST calls.  If
 * cookies are permitted by the browser, then they are used; otherwise a session variable is used (which would
 * require a user to login again if they open another browser tab to the same host)
 */

// Abstract base class for storing tokens
class TokenStore {
  setAuthToken() { throw new Error('Method setAuthToken() must be implemented'); }
  getAuthToken() { throw new Error('Method setAuthToken() must be implemented'); }
  clearAuthToken() { throw new Error('Method setAuthToken() must be implemented'); }
}

class CookieToken extends TokenStore {
  constructor() {
    super();
    this.cookies = new Cookies();
  }
  setAuthToken = (token, expires) => {
    this.cookies.set('token', token, { path: '/', expires: expires, sameSite: true });
  }
  getAuthToken = () => {
    return this.cookies.get('token');
  }
  clearAuthToken = () => {
    this.cookies.remove('token', { path: '/' });
  }
}

class MemoryToken extends TokenStore {
  constructor() {
    super();
    this.token = undefined;
    this.expires = undefined;
  }
  setAuthToken = (token, expires) => {
    this.token = token;
    this.expires = expires;
  }
  getAuthToken = () => {
    if (this.expires && this.expires > Date.now()) {
      return this.token;
    } else {
      return undefined;
    }
  }
  clearAuthToken = () => {
    this.token = undefined;
    this.expires = undefined;
  }
}

/*
 * Determine whether cookies are supported by the browser and cache the result
 */
var cookies_supported;
function _cookies_supported() {
  if (cookies_supported === undefined) {
    const cookies = new Cookies();

    // set a test cookie to expire in one second. If cookies are blocked by the
    // browser, this silently succeeds
    cookies.set('cookieTest', 'true', { path: '/', expires: new Date(Date.now()+1000)});

    // read the cookie back in order to detect whether the cookie was actually set
    const test = cookies.get('cookieTest');

    cookies_supported = (test == 'true');
  }

  return cookies_supported;
}

/*
 * Instantiate the appropriate type of TokenStore depending on whether cookies are supported
 */
var auth;
if (_cookies_supported()) {
  auth = new CookieToken();
} else {
  auth = new MemoryToken();
}

module.exports = {
  setAuthToken: auth.setAuthToken,
  getAuthToken: auth.getAuthToken,
  clearAuthToken: auth.clearAuthToken
};
