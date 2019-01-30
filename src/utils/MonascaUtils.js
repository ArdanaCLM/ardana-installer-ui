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
import { fetchJson } from '../utils/RestUtils.js';

/**
 * checks to see if Monasca is installed
 */
export async function isMonascaInstalled() {
  try {
    let installCheck = await fetchJson('/api/v2/monasca/is_installed');
    if (installCheck ?.installed) {
      return true;
    }
  } catch (error) {
    console.log('error checking if Monasca is installed:' + error);// eslint-disable-line no-console
  }

  return false;
}



/**
 * query monasca for disk utilization details
 * @param {String} servername - the name of the server to query monasca with
 */
export async function loadServerDiskUtilization (servername) {
  //const query = 'metric_dimensions=service:' + lookupName + '&group_by=state,severity';
  let now_utc = (new Date()).getTime();
  //go back to 1 minute so we can have data
  let backtime_utc = now_utc - Number(60 * 1000);
  let start_time = new Date(backtime_utc).toISOString();
  let mountPoints = [];
  let query = 'name=disk.space_used_perc&dimensions=hostname:' + servername +
      '&group_by=*&start_time=' + start_time;

  try {
    let has_monasca = await isMonascaInstalled();
    if(has_monasca) {
      let used_perc_Data = await fetchJson('/api/v2/monasca/passthru/metrics/measurements?' + query);
      //TODO - consider using a query for disk.total_space_mb and matching it up
      // with the volume group specifications to know the actual free space and used
      // rather than just a percentage
      // the disk.total_space_mb measurement is for the whole disk, not per mount point
      for (let entry in used_perc_Data.elements) {
        let entry_val = used_perc_Data.elements[entry];
        if (entry_val.measurements.length > 0) {
          mountPoints.push({
            'name': entry_val.dimensions.mount_point,
            'usedpct': entry_val.measurements[0][1]//0 is the first datapoint, 1 is value (0 again would be timestamp)
          });
        }
      }
    }
  } catch(error) {
    console.log('failed to load disk metrics for server:' + servername);// eslint-disable-line no-console
  }

  return mountPoints;
}
