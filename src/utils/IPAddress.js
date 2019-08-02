// (c) Copyright 2019 SUSE LLC
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
import ipaddr from 'ipaddr.js';

export function isIPAddressValid(ipAddress) {
  return ipaddr.isValid(ipAddress);
}

export function isCidrValid(cidr) {
  try {
    ipaddr.parseCIDR(cidr);
    return true;
  } catch (e) {
    return false;
  }
}

export function isIPv4AddressValid(ipAddress) {
  return ipaddr.IPv4.isValid(ipAddress);
}

export function isIPv4CidrValid(cidr) {
  try {
    ipaddr.IPv4.parseCIDR(cidr);
    return true;
  } catch (e) {
    return false;
  }
}

export function ipByteArray(ipAddress) {
  return ipaddr.parse(ipAddress).toByteArray();
}

export function toSubnetNetmask(cidr) {

  const [addr, prefix] = ipaddr.parseCIDR(cidr);

  if (addr.kind() !== 'ipv4') {
    throw new Error('Unable to convert ipv6 address to subnet/netmask');
  }
  const subnet = ipaddr.IPv4.networkAddressFromCIDR(cidr).toString();
  const mask = ipaddr.IPv4.subnetMaskFromPrefixLength(prefix).toString();
  return [subnet.toString(), mask];
}

export function toCidr(subnet, mask) {

  const len = ipaddr.parse(mask).prefixLengthFromSubnetMask();
  return [subnet, len].join('/');
}

export function urlAddress(hostOrIp) {
  /* Creates an address suitable for inclusion in a URL by
   * wrapping any ipv6 literal in brackets, per RFC 2732.  If
   * the value is not an ipv6 literal, it is returned unchanged
   */
  if (ipaddr.IPv6.isValid(hostOrIp)) {
    return '[' + hostOrIp + ']';
  } else {
    return hostOrIp;
  }
}
