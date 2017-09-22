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
NODE_VERSION := v5.5.0
VERSION := $(shell sed -rn 's/.*"version".*"(.*)".*/\1/p' package.json)
COMMIT := $(shell git rev-parse HEAD | colrm 8)

tarball: clean
	# print parsed version
	@echo "Parsed version: $(value VERSION)"
	@echo "Parsed Commit: $(value COMMIT)"
	# patch package.json for Jenkins environment

	# install client-side dependencies
	npm install
	npm run production
	npm uninstall karma
	npm prune --production
	# some devs were seeing issues with running npm prune only once
	npm prune --production

	# create a dist folder and copy contents over
	mkdir ardana-installer-ui
	cp -r client ardana-installer-ui
	cp -r server ardana-installer-ui

	# clean up client
	rm -r ardana-installer-ui/client/tests
	rm -rf ardana-installer-ui/client/.coverage-karma
	rm -r ardana-installer-ui/client/app/scss
	rm ardana-installer-ui/client/app/app.scss
	rm ardana-installer-ui/client/karma.conf.js
	rm ardana-installer-ui/client/index.html.tmpl*

	# clean up server
	rm -r ardana-installer-ui/server/tests

	cp -r node_modules ardana-installer-ui

	# parse installed version of embedded ardana-service
	npm list ardana-service | \
		sed -rn 's/.*ardana-service@([^ ]+).*ardana-service#([0-9a-f]+).*/v\1 (DayZero) - git commit: \2/p' \
		> ardana-installer-ui/.version

	# download Node.js to package with tarball
	wget -N http://nodejs.org/dist/$(NODE_VERSION)/node-$(NODE_VERSION)-linux-x64.tar.gz
	tar xzf node-$(NODE_VERSION)-linux-x64.tar.gz -C ardana-installer-ui
	mv ardana-installer-ui/node-$(NODE_VERSION)-linux-x64 ardana-installer-ui/nodejs

	# re-pack node for easier use
	cd ardana-installer-ui; pwd; \
	tar -czvf nodejs.tar.gz nodejs; \
	rm -rf nodejs

	# create tarball
	tar -czvf ardana-installer-ui-$(VERSION)-$(COMMIT).tar.gz ardana-installer-ui

	# clear out un-needed files and folders
	rm -f node-$(NODE_VERSION)-linux-x64.tar.gz
	rm -r ardana-installer-ui

clean:
	# start out with clean environment
	rm -rf ardana-installer-ui
	rm -rf node_modules
	rm -rf client/lib
	rm -f *.gz
