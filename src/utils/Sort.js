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
export function alphabetically(a,b) {
  const x = a.toUpperCase();
  const y = b.toUpperCase();
  return ((x < y) ? -1 : (x > y) ? 1 : 0);
}

export function byServerNameOrId(a,b) {
  return alphabetically(a['name'] || a['id'], b['name'] || b['id']);
}

// This function is useful for sorting the results of Object.entries(),
// which produces an array of arrays, and each of these array's first
// element is the keyname.  For example, if we have
//    const obj = {'keyfoo': 'somevalue', 'keybar': 'anothervalue'}
// Then Object.entries(obj) returns
//    [ ['keyfoo', 'somevalue'], ['keybar', 'anothervalue'] ], and this
//  function can be used as:
//    Object.entries(obj).sort(byEntry) to yield:
//    [ ['keybar', 'anothervalue'], ['keyfoo', 'somevalue'] ]
//
export function byEntry(a,b) {
  // Function to return a value of 1,0, or -1 (when a[0] is > = or < b[0]). Works with strings or numbers
  return (a[0]>b[0]) - (b[0]<a[0]);
}

// This function is for sorting the arrays of objects on one or more properties
// within each object.  If a given property name is passed with a leading '-', then
// the sort order is reversed (descending) on that particular property.
export function byProperty(...properties) {
  return function(a,b) {
    for (let property of properties) {
      let sign = 1;
      if (property[0] === '-') {
        property = property.slice(1);
        sign = -1;
      }
      const result = (a[property]>b[property]) - (b[property]>a[property]);
      if (result !== 0)
        return result*sign;
    }
    return 0;
  };
}
