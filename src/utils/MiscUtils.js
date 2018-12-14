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

/**
 * usage:  sleep(500).then(() => {console.log('do something after the sleep')});
 */
export function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * closest polyfil from:
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill
 */
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    var el = this;
    if (!document.documentElement.contains(el)) return null;
    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el?.nodeType === 1);
    return null;
  };
}

/**
 * Helper function used when run API action through PlaybookProgress
 * @param logger a logging handler which records the messages to the log
 *        window during playbook/API progress.
 * @param response either a success response or contents of an error response
 *        from API call
 * @param msg a message
 */
export function logProgressResponse (logger, response, msg)  {
  if(msg) {
    logger(msg);
  }
  let lines = '';
  if (Array.isArray(response)) {
    lines = response.map(item => JSON.stringify(item)).join('\n');
    logger(lines);
    logger('');
  }
  else {
    for (const category of ['failed','disabled','deleted','migrating']) {
      if(response[category]) {
        const lines = response[category].map(item => JSON.stringify(item)).join('\n');
        logger(category + ':');
        logger(lines);
        logger('');
      }
    }
  }
}

/**
 * Helper function used when run API action through PlaybookProgress
 * @param logger a logging handler which records the messages to the log
 *        window during playbook/API progress.
 * @param error error response
 * @param msg a message
 */
export function logProgressError(logger, error, msg)  {
  logger(msg);
  if (error.value?.contents?.failed) {
    let failedLines =
      error.value.contents.failed.map(item => JSON.stringify(item)).join('\n');
    logger(failedLines);
    logger('');
  }
}


