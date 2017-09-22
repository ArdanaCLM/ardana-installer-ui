/**
 * (c) Copyright 2015-2017 Hewlett Packard Enterprise Development LP
 * (c) Copyright 2017 SUSE LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */
(function() {
    'use strict';

    angular
        .module('dayzero.mock', [])
        .factory('DataMock', DataMock);

    function DataMock() {
        return {
            dataChanged: angular.noop,
            setData: angular.noop,
            options: {
                install_os: true
            },
            data: {
                baremetal: {
                    'subnet': '192.168.10.0',
                    'netmask': '255.255.255.0',
                    'server-interface': 'eth2'
                },
                servers: [
                    {
                        'id': 'controller1',
                        'role': 'ROLE-CONTROLLER',
                        'mac-addr': 'b2:72:8d:ac:7c:6f',
                        'ip-addr': '192.168.10.3',
                        'ilo-ip': '192.168.9.3',
                        'ilo-user': 'admin',
                        'ilo-password': 'password'
                    },
                    {
                        'id': 'controller2',
                        'role': 'ROLE-CONTROLLER',
                        'mac-addr': '8a:8e:64:55:43:76',
                        'ip-addr': '192.168.10.4',
                        'ilo-ip': '192.168.9.4',
                        'ilo-user': 'admin',
                        'ilo-password': 'password'
                    },
                    {
                        'id': 'controller3',
                        'role': 'ROLE-CONTROLLER',
                        'mac-addr': '26:67:3e:49:5a:a7',
                        'ip-addr': '192.168.10.5',
                        'ilo-ip': '192.168.9.5',
                        'ilo-user': 'admin',
                        'ilo-password': 'password'
                    },
                    {
                        'id': 'compute1',
                        'role': 'ROLE-COMPUTE',
                        'mac-addr': 'd6:70:c1:36:43:f7',
                        'ip-addr': '192.168.10.6',
                        'ilo-ip': '192.168.9.6',
                        'ilo-user': 'admin',
                        'ilo-password': 'password'
                    },
                    {
                        'id': 'compute2',
                        'role': 'ROLE-COMPUTE',
                        'mac-addr': '8e:8e:62:a6:ce:76',
                        'ip-addr': '192.168.10.7',
                        'ilo-ip': '192.168.9.7',
                        'ilo-user': 'admin',
                        'ilo-password': 'password'
                    },
                    {
                        'id': 'compute3',
                        'role': 'ROLE-COMPUTE',
                        'mac-addr': '22:f1:9d:ba:2c:2d',
                        'ip-addr': '192.168.10.8',
                        'ilo-ip': '192.168.9.8',
                        'ilo-user': 'admin',
                        'ilo-password': 'password'
                    },
                    {
                        'id': 'vsa1',
                        'role': 'ROLE-VSA',
                        'mac-addr': '8b:f6:9e:ca:3b:78',
                        'ip-addr': '192.168.10.9',
                        'ilo-ip': '192.168.9.9',
                        'ilo-user': 'admin',
                        'ilo-password': 'password'
                    }
                ],
                control_plane: {
                    'control-planes': [
                        {
                            'name': 'ccp',
                            'region-name': 'region1',
                        }
                    ]
                },
                'disk-models': [
                    {
                        'name': 'DISK_SET_COMPUTE',
                        'volume-groups': [
                            {
                                'name': 'ardana-vg',
                                'physical-volumes': [
                                    '/dev/sda_root'
                                ],
                                'logical-volumes': [
                                    {
                                        'name': 'root',
                                        'size': '35%',
                                        'fstype': 'ext4',
                                        'mount': '/'
                                    },
                                    {
                                        'name': 'log',
                                        'size': '50%',
                                        'mount': '/var/log',
                                        'fstype': 'ext4',
                                        'mkfs-opts': '-O large_file'
                                    },
                                    {
                                        'name': 'crash',
                                        'size': '10%',
                                        'mount': '/var/crash',
                                        'fstype': 'ext4',
                                        'mkfs-opts': '-O large_file'
                                    }
                                ]
                            },
                            {
                                'name': 'vg-comp',
                                'physical-volumes': [
                                    '/dev/sdb'
                                ],
                                'logical-volumes': [
                                    {
                                        'name': 'compute',
                                        'size': '95%',
                                        'mount': '/var/lib/nova',
                                        'fstype': 'ext4',
                                        'mkfs-opts': '-O large_file'
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        'name': 'DISK_SET_CONTROLLER',
                        'volume-groups': [
                            {
                                'name': 'ardana-vg',
                                'physical-volumes': [
                                    '/dev/sda_root'
                                ],
                                'logical-volumes': [
                                    {
                                        'name': 'root',
                                        'size': '30%',
                                        'fstype': 'ext4',
                                        'mount': '/'
                                    },
                                    {
                                        'name': 'log',
                                        'size': '40%',
                                        'mount': '/var/log',
                                        'fstype': 'ext4',
                                        'mkfs-opts': '-O large_file'
                                    },
                                    {
                                        'name': 'crash',
                                        'size': '10%',
                                        'mount': '/var/crash',
                                        'fstype': 'ext4',
                                        'mkfs-opts': '-O large_file'
                                    },
                                    {
                                        'name': 'elasticsearch',
                                        'size': '10%',
                                        'mount': '/var/lib/elasticsearch',
                                        'fstype': 'ext4'
                                    },
                                    {
                                        'name': 'zookeeper',
                                        'size': '5%',
                                        'mount': '/var/lib/zookeeper',
                                        'fstype': 'ext4'
                                    }
                                ],
                                'consumer': {
                                    'name': 'os'
                                }
                            }
                        ],
                        'device-groups': [
                            {
                                'name': 'swiftobj',
                                'devices': [
                                    {
                                        'name': '/dev/sdb'
                                    },
                                    {
                                        'name': '/dev/sdc'
                                    }
                                ],
                                'consumer': {
                                    'name': 'swift',
                                    'attrs': {
                                        'rings': [
                                            'account',
                                            'container',
                                            'object-0'
                                        ]
                                    }
                                }
                            }
                        ]
                    },
                    {
                        'name': 'DISK_SET_VSA',
                        'volume-groups': [
                            {
                                'name': 'ardana-vg',
                                'physical-volumes': [
                                    '/dev/sda_root'
                                ],
                                'logical-volumes': [
                                    {
                                        'name': 'root',
                                        'size': '30%',
                                        'fstype': 'ext4',
                                        'mount': '/'
                                    },
                                    {
                                        'name': 'log',
                                        'size': '45%',
                                        'mount': '/var/log',
                                        'fstype': 'ext4',
                                        'mkfs-opts': '-O large_file'
                                    },
                                    {
                                        'name': 'crash',
                                        'size': '20%',
                                        'mount': '/var/crash',
                                        'fstype': 'ext4',
                                        'mkfs-opts': '-O large_file'
                                    }
                                ],
                                'consumer': {
                                    'name': 'os'
                                }
                            }
                        ],
                        'device_groups': [
                            {
                                'name': 'vsa-data',
                                'consumer': {
                                    'name': 'vsa',
                                    'usage': 'data'
                                },
                                'devices': [
                                    {
                                        'name': '/dev/sdc'
                                    }
                                ]
                            },
                            {
                                'name': 'vsa-cache',
                                'consumer': {
                                    'name': 'vsa',
                                    'usage': 'adaptive-optimization'
                                },
                                'devices': [
                                    {
                                        'name': '/dev/sdb'
                                    }
                                ]
                            }
                        ]
                    }
                ],
                'interface-models': [
                    {
                        'name': 'INTERFACE_SET_CONTROLLER',
                        'network-interfaces': [
                            {
                                'name': 'BOND0',
                                'device': {
                                    'name': 'bond0'
                                },
                                'bond-data': {
                                    'options': {
                                        'bond-mode': 'active-backup',
                                        'bond-miimon': 200
                                    },
                                    'provider': 'linux',
                                    'devices': [
                                        {
                                            'name': 'eth0'
                                        },
                                        {
                                            'name': 'eth1'
                                        },
                                        {
                                            'name': 'eth3'
                                        },
                                        {
                                            'name': 'eth4'
                                        }
                                    ]
                                },
                                'network-groups': [
                                    'EXTERNAL_API',
                                    'EXTERNAL_VM',
                                    'GUEST',
                                    'MGMT'
                                ]
                            }
                        ]
                    },
                    {
                        'name': 'INTERFACE_SET_COMPUTE',
                        'network-interfaces': [
                            {
                                'name': 'BOND0',
                                'device': {
                                    'name': 'bond0'
                                },
                                'bond-data': {
                                    'options': {
                                        'bond-mode': 'active-backup',
                                        'bond-miimon': 200
                                    },
                                    'provider': 'linux',
                                    'devices': [
                                        {
                                            'name': 'eth3'
                                        },
                                        {
                                            'name': 'eth4'
                                        }
                                    ]
                                },
                                'network-groups': [
                                    'EXTERNAL_VM',
                                    'GUEST',
                                    'MGMT'
                                ]
                            }
                        ]
                    },
                    {
                        'name': 'INTERFACE_SET_VSA',
                        'network-interfaces': [
                            {
                                'name': 'BOND0',
                                'device': {
                                    'name': 'bond0'
                                },
                                'bond-data': {
                                    'options': {
                                        'bond-mode': 'active-backup',
                                        'bond-miimon': 200
                                    },
                                    'provider': 'linux',
                                    'devices': [
                                        {
                                            'name': 'eth3'
                                        },
                                        {
                                            'name': 'eth4'
                                        }
                                    ]
                                },
                                'network-groups': [
                                    'MGMT'
                                ]
                            }
                        ]
                    },
                    {
                        'name': 'INTERFACE_SET_SINGLE_NICS',
                        'network-interfaces': [
                            {
                                'name': 'eth0',
                                'device': {
                                    'name': 'eth0'
                                }
                            },
                            {
                                'name': 'eth5',
                                'device': {
                                    'name': 'eth5'
                                }
                            }
                        ]
                    }
                ],
                'network-groups': {
                    EXTERNAL_API: {
                        'name': 'EXTERNAL_API',
                        networks: [
                            {
                                'name': 'NET_EXTERNAL_API',
                                'vlanid': 101,
                                'tagged-vlan': true,
                                'cidr': '10.0.1.0/24',
                                'gateway-ip': '10.0.1.1',
                                'network-group': 'EXTERNAL_API'
                            }
                        ]
                    },
                    EXTERNAL_VM: {
                        'name': 'EXTERNAL_VM',
                        networks: [
                            {
                                'name': 'NET_EXTERNAL_VM',
                                'vlanid': 102,
                                'tagged-vlan': true,
                                'network-group': 'EXTERNAL_VM'
                            }
                        ]
                    },
                    GUEST: {
                        'name': 'GUEST',
                        networks: [
                            {
                                'name': 'NET_GUEST',
                                'vlanid': 103,
                                'tagged-vlan': true,
                                'cidr': '10.1.1.0/24',
                                'gateway-ip': '10.1.1.1',
                                'network-group': 'GUEST'
                            }
                        ]
                    },
                    MGMT: {
                        'name': 'MGMT',
                        networks: [
                            {
                                'name': 'NET_MGMT',
                                'vlanid': 100,
                                'tagged-vlan': false,
                                'cidr': '10.2.1.0/24',
                                'gateway-ip': '10.2.1.1',
                                'network-group': 'MGMT'
                            }
                        ]
                    }
                },
                'nic-mappings': [
                    {
                        'name': 'HP_DL360_4PORT',
                        'physical-ports': [
                            {
                                'logical-name': 'eth0',
                                'type': 'simple-port',
                                'bus-address': '0000:07:00.0'
                            },
                            {
                                'logical-name': 'eth1',
                                'type': 'simple-port',
                                'bus-address': '0000:08:00.0'
                            },
                            {
                                'logical-name': 'eth3',
                                'type': 'simple-port',
                                'bus-address': '0000:09:00.0'
                            },
                            {
                                'logical-name': 'eth4',
                                'type': 'simple-port',
                                'bus-address': '0000:0a:00.0'
                            }
                        ]
                    },
                    {
                        'name': 'MY_2PORT_SERVER',
                        'physical-ports': [
                            {
                                'logical-name': 'eth3',
                                'type': 'simple-port',
                                'bus-address': '0000:04:00.0'
                            },
                            {
                                'logical-name': 'eth4',
                                'type': 'simple-port',
                                'bus-address': '0000:04:00.1'
                            }
                        ]
                    }
                ],
                'server-roles': [
                    {
                        'name': 'ROLE-CONTROLLER',
                        'interface-model': 'INTERFACE_SET_CONTROLLER',
                        'disk-model': 'DISK_SET_CONTROLLER'
                    },
                    {
                        'name': 'ROLE-COMPUTE',
                        'interface-model': 'INTERFACE_SET_COMPUTE',
                        'disk-model': 'DISK_SET_COMPUTE'
                    },
                    {
                        'name': 'ROLE-VSA',
                        'interface-model': 'INTERFACE_SET_VSA',
                        'disk-model': 'DISK_SET_VSA'
                    }
                ]
            }
        };
    }

})();
