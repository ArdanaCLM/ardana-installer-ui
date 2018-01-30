(c) Copyright 2017-2018 SUSE LLC

# SUSE OpenStack Cloud Deployer
The cloud installer that will reside with SUSE Manager

## How to run
Move to the root of the project and run `npm install` which will install any dependencies

After that, run `npm start` which will bundle the react app and start the express server

You will get the express server (UI) running on `localhost:3000`.

To run the selenium tests:
1. perform initial setup `npm run protractor-setup` (once, does not need to be done each time)
2. start the app in another terminal `npm start`
3. run the tests `npm run protractor`
For more information on protractor/selenium locators see http://www.protractortest.org/#/locators

# Building and running the production version of the installer
Build just the ui components (output to "dist" folder):  
`build_ui.sh`

Build just the ui components and package them into a tarball:  
`build_ui.sh -t`

Build the entire app (output to manager_cloud_installer_server_venv):  
`build_dist.sh`

Build the entire app and create tarball out of the output:  
`build_dist.sh -t`

`build_dist.sh -t` will create a cloudinstaller-{SHA}.tar file that can be untarred in another location.  

To run the application from that location, together with a local copy of the ardana-installer-server:
`run_dist.sh`

Note!  
You will need an appropriate ardana-service backend to provide data model information. A link to that repo will be put here if/when it becomes public  

# Open Build Service (OBS)
In order to build with OBS, a tarball containing the contents of the node_modules must be created
and added to the package.  Create a clean node_modules directory with either:
```
yarn install --link-duplicates
```

or:

```
rm -rf node_modules
npm install
```

and then create the tarball with:

```
tar cjf node_modules.tar.bz2 node_modules
```
