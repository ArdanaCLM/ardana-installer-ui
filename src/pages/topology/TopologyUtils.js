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
import { fetchJson } from '../../utils/RestUtils.js';

// Intead of doing this base-class thing, just use something like ConfigHelper.js used
// to do for the config promise, which is to always return a promise, which may or may
// not have been resolved already
//
var modelPromise;

function loadInternalModel() {
  return fetchJson('/api/v2/model/cp_internal/CloudModel.yaml');
}

// Prevent wrapping on hyphens by replacing normal hyphen characters with the non-wrapping-hyphen character
export function noHyphenWrap(s) {
  return s.replace(/-/g, '\u2011');
}

export function getInternalModel() {
  modelPromise = modelPromise || loadInternalModel();
  return modelPromise;
}
