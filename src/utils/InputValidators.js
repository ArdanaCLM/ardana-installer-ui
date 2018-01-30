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

const IPV4ADDRESS =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const MACADDRESS =
  /^[0-9a-fA-F]{2}([:])(?:[0-9a-fA-F]{2}\1){4}[0-9a-fA-F]{2}$/;
const HOST = /^(?=^.{1,254}$)(^(?:(?!\d+\.)[a-zA-Z0-9_-]{1,63}\.?)+(?:[a-zA-Z]{2,})$)/;
const IPV4ADDRESS_HOST = new RegExp(
  IPV4ADDRESS.toString().slice(1, IPV4ADDRESS.toString().length-1) + '|' +
  HOST.toString().slice(1, HOST.toString().length-1)
);
const PORT = /^0*(?:6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[1-9][0-9]{1,3}|[0-9])$/;
const PCI_ADDRESS = /^[0-9a-fA-F]{4}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}\.[0-9a-fA-F]$/;
const NET_INTERFACE = /^[0-9a-zA-Z.:_]{1,16}$/;
const CIDR =
  /^((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\/(3[0-2]|[1-2]?[0-9])$/;
const STRING_WITH_NO_SPACES = /^\S+$/;
const NETMASK = new RegExp('' +
  /^((255\.){3}(255|254|252|248|240|224|192|128|0+))|/.source +
  /((255\.){2}(255|254|252|248|240|224|192|128|0+)\.0)|/.source +
  /((255\.)(255|254|252|248|240|224|192|128|0+)(\.0+){2})|/.source +
  /((255|254|252|248|240|224|192|128|0+)(\.0+){3})$/.source
);
const IPV4ADDRESS_RANGE =
  /^(?:(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\s*-\s*(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/;  //eslint-disable-line max-len

export function IpV4AddressValidator(ipAddress) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(IPV4ADDRESS.exec(ipAddress) === null) {
    retValue.isValid = false;
    retValue.errorMsg = translate('input.validator.ipv4address.error');
  }
  return retValue;
}

export function MacAddressValidator(macAddress) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(MACADDRESS.exec(macAddress) === null) {
    retValue.isValid = false;
    retValue.errorMsg = translate('input.validator.macaddress.error');
  }

  return retValue;
}

export function PortValidator(port) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(PORT.exec(port) === null) {
    retValue.isValid = false;
    retValue.errorMsg = translate('input.validator.port.error');
  }

  return retValue;
}

export function IpV4AddressHostValidator(host) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(IPV4ADDRESS_HOST.exec(host) === null) {
    retValue.isValid = false;
    retValue.errorMsg = translate('input.validator.ipv4addresshost.error');
  }

  return retValue;
}

export function PCIAddressValidator(str) {
  if(PCI_ADDRESS.exec(str) === null) {
    return {
      isValid: false,
      errorMsg: translate('input.validator.pciaddress.error')
    };
  } else {
    return {
      isValid: true,
      errorMsg: ''
    };
  }
}

export function NetworkInterfaceValidator(str) {
  if(NET_INTERFACE.exec(str) === null) {
    return {
      isValid: false,
      errorMsg: translate('input.validator.networkinterface.error')
    };
  } else {
    return {
      isValid: true,
      errorMsg: ''
    };
  }
}

export function VLANIDValidator(vlanid) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(vlanid && vlanid <= 0 || vlanid > 4094) {
    retValue.isValid = false;
    retValue.errorMsg = translate('input.validator.vlanid.error');
  }

  return retValue;
}


// Convert an IP address (e.g. 10.1.0.24) into its equivalent integer (167837720)
function ipAddrToInt(ip) {
  // Split string into array of octets, converted to integers
  const octets = ip.split('.').map(n => parseInt(n, 10));

  // Convert to an integer.  The trailing >>> 0 converts the number to unsigned so we
  // don't get huge negative values
  return ((octets[0] << 24) + (octets[1] << 16) + (octets[2] << 8) + octets[3]) >>> 0;
}

export function CidrValidator(cidr) {

  const match = CIDR.exec(cidr);
  if(match === null) {
    return {
      isValid: false,
      errorMsg: translate('input.validator.cidr.error')
    };
  }

  // match[1] is the ip address, match[2] is number of leading bits (the part after the slash)
  const ip = ipAddrToInt(match[1]);
  const bits = parseInt(match[2]);

  // Verify that all of the values in the IP address portion after the leading
  // bits are zeros.  For example, the CIDR 192.168.1.0/24 would be an integer address
  // value of 0xC0A80100, and the last 8 bits (32-24) are required to be zeros.
  if ((ip & (0xffffffff >>> bits)) !== 0)
  {
    return {
      isValid: false,
      errorMsg: translate('input.validator.cidr.error')
    };
  }

  return {
    isValid: true,
    errorMsg: ''
  };
}

export function AddressesValidator(addresses) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  // just one IPV4 address
  if(addresses && addresses.indexOf('-') === -1) {
    if(IPV4ADDRESS.exec(addresses.trim()) === null) {
      retValue.isValid = false;
      retValue.errorMsg = translate('input.validator.addresses.error');
      return retValue;
    }
  }

  if(addresses && addresses.indexOf('-') !== -1) { // just one range
    if (IPV4ADDRESS_RANGE.exec(addresses.trim()) === null) {
      retValue.isValid = false;
      retValue.errorMsg = translate('input.validator.addresses.error');
      return retValue;
    }

    var ips = addresses.replace(/\s/g, '').split('-');
    var s_ip = ips[0];
    var e_ip = ips[1];
    var s_ip_num = ipAddrToInt(s_ip);
    var e_ip_num = ipAddrToInt(e_ip);

    if (s_ip_num >= e_ip_num) {
      retValue.isValid = false;
      retValue.errorMsg = translate('input.validator.addresses.error');
      return retValue;
    }
  }

  return retValue;
}

export function UniqueNameValidator(name, props) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(props && props.names && props.names.length > 0 &&
    name && props.names.indexOf(name) !== -1) {
    retValue.isValid = false;
    retValue.errorMsg = translate('input.validator.uniquename.error');
  }
  else if(props && props.check_nospace) {
    if(STRING_WITH_NO_SPACES.exec(name) === null) {
      retValue.isValid = false;
      retValue.errorMsg = translate('input.validator.name.spaces.error');
    }
  }
  return retValue;
}

export function YamlValidator(text) {
  try {
    safeLoad(text);
    return { isValid: true, errorMsg: '' };
  } catch (e) {
    return { isValid: false, errorMsg: translate('input.validator.yaml.error')};
  }
}

export function NetmaskValidator(netmask) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if (NETMASK.exec(netmask) === null) {
    retValue.isValid = false;
    retValue.errorMsg = translate('input.validator.netmask.error');
  }
  return retValue;
}

// Validate that the ip address belongs to the netmask
export function IpInNetmaskValidator(ip, netmask) {
  const ipInt = ipAddrToInt(ip);
  const netmaskInt = ipAddrToInt(netmask);
  return (ipInt & netmaskInt) >>> 0 === ipInt;
}
