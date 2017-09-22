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

# Install packages
sudo apt-get update
sudo apt-get install -y --allow-unauthenticated apt-transport-https wget default-jre \
                         xfonts-100dpi xfonts-75dpi xfonts-scalable \
                         xfonts-cyrillic xvfb x11-apps \
                         git make g++

# Setup node and Chrome

if [ $(which npm) ]; then
    echo "Continuing installation using local npm!";
else
    echo "deb https://deb.nodesource.com/node_5.x `lsb_release -c -s` main" > nodesource.list
    echo "deb-src https://deb.nodesource.com/node_5.x `lsb_release -c -s` main" >> nodesource.list
    sudo -E apt-key adv --recv-key --keyserver keyserver.ubuntu.com 1655A0AB68576280
    sudo cp nodesource.list /etc/apt/sources.list.d/nodesource.list
    sudo apt-get update
    sudo apt-get install -y nodejs
fi

wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo -E sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# Run npm install
npm install

export no_proxy=localhost

sudo /usr/bin/Xvfb :99 -ac -screen 0 1920x1080x24 &
export DISPLAY=:99
npm run e2e