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
import React from 'react';

const bundles = {
  en: import('./bundles/en.json'),
  en_branding: import('./bundles/en_branding.json'),
  ja: import('./bundles/ja.json'),
  ja_branding: import('./bundles/ja_branding.json')
};
const supportedLangs = ['en', 'ja'];

let catalog;

var foundLang =
  supportedLangs.find(sLang => window.navigator.language === sLang) ||
  supportedLangs.find(sLang => window.navigator.language.substring(0, 2) === sLang.substring(0, 2));

export async function loadBundle() {
  const promises = [
    bundles[foundLang],
    bundles[`${foundLang}_branding`]
  ];
  const [ base, branding ] = await Promise.all(promises);
  catalog = {
    ...base,
    ...branding
  };
}

function formatString(string, args) {
  let result = string;
  args.forEach((arg, index) => {
    result = result.replace(`{${index}}`, arg.toString());
  });
  return result;
}

export function translate(key, ...args) {

  const hasReact = args && args.some(arg => React.isValidElement(arg));
  let result;

  try {
    // React components cannot be handled with formatString, so if any
    // args are react components, then manually parse the format string and
    // build up the result with
    if (hasReact) {
      // Find any references in the key (e.g. {0})
      let matches = catalog[key].split(/(\{\d\})/);
      let pieces = [];
      for (const piece of matches) {
        let ref = piece.match(/\{(\d)\}/);

        if (ref) {
          pieces.push(args[ref[1]]);
        } else {
          pieces.push(piece);
        }
      }

      // Add a unique key to each part of the translated result.  Symbol() is a JavaScript feature
      // that will yield unique keys.
      const keyed = pieces.map((p) => <React.Fragment key={Symbol(p).toString()}>{p}</React.Fragment>);
      result = (<>{keyed}</>);
    } else {
      result = formatString(catalog[key], args);
    }
  } catch (e) {
    console.warn(`Unable to translate ${key}`); // eslint-disable-line no-console
    result = key;
  }
  if(result === undefined || result.length === 0) {
    console.warn(`Unable to translate ${key}`); // eslint-disable-line no-console
    return key;
  }
  return result;
}

function titleize(key) {
  if(!key) return '';
  return key.replace(/[-_.]/g, ' ')                    // change _, - and . to space
    .split(' ')                                        // split into words
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))  // capitalize the first letter of each word
    .join(' ');                                        // join elements back together into a single string
}

export function translateModelName(key) {
  // Since it is possible for new model names to be introduced or even modified by the customer,
  // the translation of these names needs to have some human readable fallbacks the situations where
  // there is no pre-existing translation
  try {
    let translation = catalog['model.name.' + key];
    return translation || titleize(key);
  } catch(e) {
    console.warn(`Unable to translate modelname "${key}"`); // eslint-disable-line no-console
    return titleize(key);
  }
}
