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
import { translate } from '../localization/localize.js';
import { safeLoad } from 'js-yaml';
import { List } from 'immutable';
import { isIPAddressValid, isIPv4AddressValid, isIPv4CidrValid, ipByteArray, isCidrValid } from './IPAddress';

const MACADDRESS = /^[0-9a-fA-F]{2}([:])(?:[0-9a-fA-F]{2}\1){4}[0-9a-fA-F]{2}$/;
const HOST = /^(?=^.{1,254}$)(^(?:(?!\d+\.)[a-zA-Z0-9_-]{1,63}\.?)+(?:[a-zA-Z]{2,})$)/;
const PORT = /^0*(?:6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[1-9][0-9]{1,3}|[0-9])$/;
const PCI_ADDRESS = /^[0-9a-fA-F]{4}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}\.[0-9a-fA-F]$/;
const NET_INTERFACE = /^[0-9a-zA-Z.:_]{1,16}$/;

export function IpAddressValidator(ipAddress) {
  if(! isIPAddressValid(ipAddress)) {
    return translate('input.validator.ipaddress.error');
  }
}

export function MacAddressValidator(macAddress) {
  if(MACADDRESS.exec(macAddress) === null) {
    return translate('input.validator.macaddress.error');
  }
}

export function PortValidator(port) {
  if(PORT.exec(port) === null) {
    return translate('input.validator.port.error');
  }
}

export function IpAddressHostValidator(host) {
  if(! isIPAddressValid(host) && host.match(HOST) === null) {
    return translate('input.validator.ipaddresshost.error');
  }
}

export function PCIAddressValidator(str) {
  if(PCI_ADDRESS.exec(str) === null) {
    return translate('input.validator.pciaddress.error');
  }
}

export function NetworkInterfaceValidator(str) {
  if(NET_INTERFACE.exec(str) === null) {
    return translate('input.validator.networkinterface.error');
  }
}

export function VLANIDValidator(vlanid) {
  if(vlanid && vlanid <= 0 || vlanid > 4094) {
    return translate('input.validator.vlanid.error');
  }
}

export function CidrValidator(cidr) {
  if (! isCidrValid(cidr)) {
    return translate('input.validator.cidr.error');
  }
}

export function IPv4CidrValidator(cidr) {
  if (! isIPv4CidrValid(cidr)) {
    return translate('input.validator.cidr.error');
  }
}

export function AddressesValidator(addrs) {
  const addresses = addrs?.trim() || '';

  // just one address
  if(! addresses.includes('-')) {
    if(! isIPv4AddressValid(addresses)) {
      return translate('input.validator.addresses.error');
    }
  }

  else {

    const ips = addresses.replace(/\s/g, '').split('-');
    if(!isIPv4AddressValid(ips[0]) || !isIPv4AddressValid(ips[1])) {
      return translate('input.validator.addresses.error');
    }
    let start_ip = ipByteArray(ips[0]);
    let end_ip = ipByteArray(ips[1]);

    let ordered = true;
    for (let i=0; i<start_ip.length; i++) {
      if (start_ip[i] < end_ip[i]) {
        break;
      }
      if (start_ip[i] > end_ip[i]) {
        ordered = false;
        break;
      }

      // If we have reached the last byte and all values are the same
      // then the two addresses are identical and thus not ordered
      if (i == start_ip.length-1) {
        ordered = false;
      }
    }

    if (! ordered) {
      return translate('input.validator.addresses.error');
    }
  }
}

export const UniqueNameValidator = (names) =>
  createExcludesValidator(names, translate('input.validator.uniquename.error'));
export const UniqueIdValidator = (ids) => createExcludesValidator(ids, translate('input.validator.uniqueid.error'));

export function NoWhiteSpaceValidator(errorMessage) {
  function validator(value) {
    // if the string contains whitespace
    if(/\s/.test(value)) {
      return errorMessage;
    }
  }

  return validator;
}

export function YamlValidator(text) {
  try {
    safeLoad(text);
  } catch (e) {
    return translate('input.validator.yaml.error');
  }
}

// Return a validator that requires the entered value to
// NOT be in the given list or set.
//
// Note that the counterpart to this validator, createIncludesValidator,
// is generally unnecessary, since a pulldown list would normally
// be used in the situation where there is a fixed set of valid inputs.
export function createExcludesValidator(values, errorMsg) {

  console.assert(values !== undefined,                  // eslint-disable-line no-console
    'Error: createExcludesValidator called without values');

  function validator(value) {

    if (values === undefined)
      return;

    let exists;
    // Use the value of the has() function if such a function is present, otherwise use the
    // exists() function if present. Immutable lists are the exception as they possess both has()
    // and includes(), and they should use the latter.
    //
    // Note that while this is slightly wordier than than compact construct:
    //    values.has?(value) || value?.includes(value)
    // this construct was not used since some types (particularly immutable Maps) have both a
    // 'has' (for checking keys) and an 'includes' (for checking values), and we only want to use
    // the has; i.e. we don't want to search through the values if the keys are known not to contain
    // the value.
    if (values.has && ! List.isList(values)) {
      exists = values.has(value);
    } else if (values.includes) {
      exists = values.includes(value);
    }

    if (exists) {
      return errorMsg || translate('duplicate.error', value);
    }
  }

  return validator;
}

// Return a single validator function that in turn invokes multiple validators, and
// returning the result if any fail.
// This permits checking against multiple criteria simply; without this, checking
// against multiple criteria requires either creating a single function that has multiple
// ways of using it (depending on which criteria are to be enforced), or it requires
// a writing a combinatorial number of functions depending on the criteria
export function chainValidators(...validators) {

  function chained(value) {
    for (let validator of validators) {
      const result = validator(value);
      if (result) {
        return result;
      }
    }
  }

  return chained;
}
