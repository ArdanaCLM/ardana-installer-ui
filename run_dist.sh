#!/bin/bash
# (c) Copyright 2017-2018 SUSE LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Make sure we are starting in the correct dir
SCRIPTDIR=$(dirname "$(readlink -e "${BASH_SOURCE[0]}")")
cd $SCRIPTDIR

die() {
   echo "$@" >&2
   exit 1
}

# Install/update dependencies
if yarn --version &> /dev/null ; then
    yarn install --link-duplicates
else
    npm install
fi

# build the neccessary UI files
./build_ui.sh || die "building UI files failed, exiting"

# Check out a local copy of the installer server
if [ ! -d run ] ; then
    git clone https://github.com/ArdanaCLM/ardana-installer-server run
fi

cd run

main_dir=$(dirname $(git ls-files | grep main.py))

# Create a link named web to point to the ui build dir
ln -nsf $SCRIPTDIR/dist $main_dir/web

# Start the server
tox -e runserver
