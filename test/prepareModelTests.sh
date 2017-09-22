#!/usr/bin/env bash
#
# (c) Copyright 2015-2017 Hewlett Packard Enterprise Development LP
# (c) Copyright 2017 SUSE LLC
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.
#

CONFIG_YML=${PWD}/e2e/config/test-config.yml
TMPL_PATH=${PWD}/e2e/testdata/examples
TMPL_SERVICES=${PWD}/e2e/testdata/services
CONFIG_PROCESSOR_VENV=venv
CLOUD_DIR=${PWD}/e2e/testdata/openstack/my_cloud/definition

CONFIG_PROCESSOR_GIT_URL=git://git.suse.provo.cloud/ardana/ardana-configuration-processor
ARDANA_INPUT_MODEL_GIT_URL=git://git.suse.provo.cloud/ardana/ardana-input-model

git checkout ${CONFIG_YML}

if [ ! -d "tmp/ardana-input-model" ]; then
    pushd tmp
    git clone $ARDANA_INPUT_MODEL_GIT_URL
    cp -r ardana-input-model/2.0/examples ${TMPL_PATH}
    cp -r ardana-input-model/2.0/services ${TMPL_SERVICES}
    popd
fi

# Patch config.yml
sed -i '/config-processor-run/d' e2e/config/test-config.yml
sed -i 's@./templates@e2e/testdata/examples@g' e2e/config/test-config.yml
sed -i 's/mock: true/mock: false/g' e2e/config/test-config.yml

# required to build config-processor venv
sudo apt-get install libffi-dev libssl-dev

pushd tmp
git clone $CONFIG_PROCESSOR_GIT_URL
pushd ardana-configuration-processor
git checkout master
virtualenv -p /usr/bin/python2.7 ${CONFIG_PROCESSOR_VENV}
source ${CONFIG_PROCESSOR_VENV}/bin/activate
pushd  ConfigurationProcessor
pip install -r requirements.txt
python setup.py install
popd
mkdir -p ${CONFIG_PROCESSOR_VENV}/share/ardana-config-processor
cp -r Driver ${CONFIG_PROCESSOR_VENV}/share/ardana-config-processor/
cp -r Data ${CONFIG_PROCESSOR_VENV}/share/ardana-config-processor/
popd
popd

CP_PATH=${PWD}/tmp/ardana-configuration-processor

tee -a ${CONFIG_YML}<< EOF
configProcessor:
    rootPath: ${CP_PATH}
    schemaPath: ${CP_PATH}/venv/share/ardana-config-processor/Data/Site
EOF

tee -a ${CONFIG_YML}<< EOF
paths:
    templatesDir: ${TMPL_PATH}
    servicesPath: ${TMPL_SERVICES}
    cloudDir: ${CLOUD_DIR}
EOF
