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
import { config } from './ConfigHelper.js';
import { redirectToLogin } from './RouteUtils.js';
import { getAuthToken } from './Auth.js';

// Merge init objects together.  Any nested 'headers' objects will also be merged
function mergeInits(...inits) {
  let mergedHeaders = {};

  // Combine headers together
  for (let init of inits) {
    if (init.headers) {
      Object.assign(mergedHeaders, init.headers);
    }
  }

  return Object.assign({}, ...inits, {'headers': mergedHeaders});
}

function doJson(url, method, body, init, forceLogin=true, noCache=false) {

  let myInit = {
    method: method,
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    }
  };

  if(noCache) {
    myInit.headers['pragma'] = 'no-cache';
    myInit.headers['cache-control'] = 'no-cache';
  }

  const token = getAuthToken();
  if (token) {
    myInit.headers['X-Auth-Token'] = token;
  }

  if (init) {
    myInit = mergeInits(myInit, init);
  }

  if (! ('body' in myInit)) {
    if (body === undefined && (method === 'POST' || method === 'PUT')) {
      myInit.body = JSON.stringify('');
    } else if (typeof(body) === 'string') {
      myInit.body = body;
    } else {
      myInit.body = JSON.stringify(body);
    }
  }

  const fullUrl = buildUrl(url);

  return fetch(fullUrl, myInit)
    .then(res => extractResponse(res, forceLogin));
}

/**
 * Perform a fetch from a REST endpoint, convert the fetched JSON into a Javascript object, and return
 * a promise
 *
 * @param {String} url - URL or partial URL (one without the leading http).  If a partial URL
 *                       is received the request will be directed to the "shim".
 * @param {Object} init - optional argument that will be passed to the fetch() function.  It often
 *                       will contain HTTP headers when supplied.
 * @param {boolean} forceLogin - optional argument that indicates that requests that are rejected
 *                        with auth errors (401, 403) should cause UI to navigate to the login page. This
 *                        will normally be true, but in some corner cases (like the login page itself) it
 *                        will be set to false.
 * @param {boolean} noCache - optional argument that indicates whether the query will load from cache
 */
export function fetchJson(url, init, forceLogin=true, noCache=false) {
  return doJson(url, 'GET', undefined, init, forceLogin, noCache);
}



/**
 * Perform a post to a REST endpoint, converting the passed body to JSON, and return the result
 * as a promise
 *
 * @param {String} url - URL or partial URL (one without the leading http).  If a partial URL
 *                       is received the request will be directed to the "shim".
 * @param {Object} body - Javascript object that will be converted to Json and posted to the URL.  If body
 *                        is undefined, then an empty string will be POSTed
 * @param {Object} init - optional argument that will be passed to the fetch() function.  It often
 *                        will contain HTTP headers when supplied.
 * @param {Object} forceLogin - optional argument that indicates that requests that are rejected
 *                        with auth errors (401, 403) should cause UI to navigate to the login page. This
 *                        will normally be true, but in some corner cases (like the login page itself) it
 *                        will be set to false.
 */
export function postJson(url, body, init, forceLogin=true) {
  return doJson(url, 'POST', body, init, forceLogin);
}


/**
 * Perform a put from a REST endpoint, converting the passed body to JSON, and return the result
 * as a promise
 *
 * @param {String} url - URL or partial URL (one without the leading http).  If a partial URL
 *                       is received the request will be directed to the "shim".
 * @param {Object} body - Javascript object that will be converted to Json and posted to the URL.  If body
 *                        is undefined, then an empty string will be POSTed
 * @param {Object} init - optional argument that will be passed to the fetch() function.  It often
 *                        will contain HTTP headers when supplied.
 */
export function putJson(url, body, init) {
  return doJson(url, 'PUT', body, init);
}

/**
 * Perform a delete from a REST endpoint, and return a promise
 *
 * @param {String} url - URL or partial URL (one without the leading http).  If a partial URL
 *                       is received the request will be directed to the "shim".
 */
export function deleteJson(url) {
  return doJson(url, 'DELETE');
}

/**
 * Common error-checking function that returns a promise the yields the json
 * text of the response (when valid) or returns rejected Promise with the text of the
 * error message
 */
function extractResponse(response, forceLogin) {

  return response.text()
    .then(txt => {

      // Attempt to extract the text (and convert from JSON) if possible, even
      // if the response was an error, in order to provide that information back to
      // the caller
      let value;

      try {
        // JSON.parse is used here instead of response.json because sometimes
        // the return value is just text, and it makes the promise chain handling
        // overly convoluted to try to use response.json sometimes and response.txt
        // when that fails, while at the same time propagating exceptions up when
        // the ardana service reports an error.
        value = JSON.parse(txt);
      } catch (SyntaxError) {
        // Unable to convert to json, returning text
        value = txt;
      }

      if (response.ok) {
        return value;
      } else {
        // if the status is 401 or 403, redirect to the login page
        if(forceLogin && [401,403].includes(response.status)) {
          redirectToLogin();
        }
        return Promise.reject(new RestError(response.statusText, response.status, value));
      }
    });
}


/**
 * Return a promise that returns the full URL (a promise is used because
 * the information needed to build the URL comes from an asynchonous function)
 */
function buildUrl(url) {

  if (url.startsWith('http')) {
    return url;
  } else {
    const baseUrl = config['shimurl'];
    // prepend the baseUrl if we receive a URL without a scheme.  Note that the
    // incoming url may contain a leading / but is not required to.
    return baseUrl + '/' + url.replace(/^\//, '');
  }
}

/**
 * Use a custom Error for representing errors from these json functions
 */
class RestError extends Error {
  constructor(message, status, value) {
    super(message);
    this.status = status;
    this.value = value;
  }
}
