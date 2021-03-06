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
import LocalizedStrings from 'react-localization';
import React from 'react';


var supportedLangs = ['en', 'ja'];
var translationData, bundlename, brandingData, bundlebrandingname, allTranslatedData, catalog = {};

for (var i = 0; i < supportedLangs.length; i++) {
  bundlename = './bundles/' + supportedLangs[i] + '.json';
  //require doesn't interpret this as a string correctly unless its converted
  //easiest conversion is to use + ''
  translationData = require(bundlename + '');

  // for branding
  bundlebrandingname = './bundles/' + supportedLangs[i] + '_branding.json';
  brandingData = require(bundlebrandingname + '');

  // combine branding bundle
  allTranslatedData = Object.assign(translationData, brandingData);
  catalog[supportedLangs[i]] = allTranslatedData;
}

// window.navigator.language is the language that user sets at the top of
// installed and enabled languages like en-US, en, ja-JP, ja, zh-CN, zh
// since we have language without country like en or ja as supported languages,
// need to find an exact match or a match of the language part
var strings = new LocalizedStrings(catalog);

var findLang =
  supportedLangs.find(sLang => window.navigator.language === sLang) ||
  supportedLangs.find(sLang => window.navigator.language.substring(0, 2) === sLang.substring(0, 2));

if(findLang) {
  strings.setLanguage(findLang);
}
else { //default
  strings.setLanguage('en');
}

export function translate(key, ...args) {

  const hasReact = args && args.some(arg => React.isValidElement(arg));

  try {
    // React components cannot be handled with String.formatString, so if any
    // args are react components, then manually parse the format string and
    // build up the result with
    if (hasReact) {
      // Find any references in the key (e.g. {0})
      let matches = strings[key].split(/(\{\d\})/);
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
      return (<>{keyed}</>);
    } else {
      // Note!
      // For some bizarre reason, strings.formatString returns an array of strings rather than a single string.
      // The join() corrects this by joining the elements into a single string.
      return strings.formatString(strings[key], ...args).join('');
    }
  } catch (e) {
    console.error('Unable to translate '+key); // eslint-disable-line no-console
    return key;
  }
}

export function translateModelName(key) {
  // Since it is possible for new model names to be introduced or even modified by the customer,
  // the translation of these names needs to have some human readable fallbacks the situations where
  // there is no pre-existing translation
  try {
    // Note!
    // For some bizarre reason, strings.formatString returns an array of strings rather than a single string.
    // The join() corrects this by joining the elements into a signle string.
    return strings.formatString(strings['model.name.' + key]).join('');
  } catch (e) {
    return (key || '')
      .replace(/[-_.]/g, ' ')                            // change _, - and . to space
      .split(' ')                                        // split into words
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))  // capitalize the first letter of each word
      .join(' ');                                        // join elements back together into a single string
  }
}
