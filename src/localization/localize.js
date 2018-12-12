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

import * as en_bundle from './bundles/en.json';
import * as en_bundle_branding from './bundles/en_branding.json';
import * as ja_bundle from './bundles/ja.json';
import * as ja_bundle_branding from './bundles/ja_branding.json';

export const en = 'en';
export const ja = 'ja';

const bundles = {
  [en]: {
    ...en_bundle.default,
    ...en_bundle_branding.default,
  },
  [ja]: {
    ...ja_bundle.default,
    ...ja_bundle_branding.default,
  }
};

const supportedLangs = [en, ja],
  fallbackLang = en;

var foundLang =
  supportedLangs.find(sLang => window.navigator.language === sLang) ||
  supportedLangs.find(sLang => window.navigator.language.substring(0, 2) === sLang.substring(0, 2));

const catalog = foundLang && bundles[foundLang] ? bundles[foundLang] : bundles[fallbackLang];

function formatString(string, args) {
  let result = string;
  args.forEach((arg, index) => {
    result = result.replace(`{${index}}`, arg.toString());
  });
  return result;
}

function translateInner(key, catalog, ...args) {
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
    console.error(`caught error while translating ${key} : ${e.message || e}`); // eslint-disable-line no-console
  }
  if(result === undefined || result.length === 0) {
    if(foundLang !== fallbackLang) {
      // fallback if we are not already trying the fallback language
      console.warn(`falling back to '${fallbackLang}' for ${key}`); // eslint-disable-line no-console
      return translateInner(key, bundles[fallbackLang], ...args);
    } else {
      console.warn(`failed to translate ${key}`); // eslint-disable-line no-console
      return key;
    }
  }
  return result;
}

export const translateForceLang = (key, language, ...args) => translateInner(key, bundles[language], ...args);
export const translate = (key, ...args) => translateInner(key, catalog, ...args);

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
