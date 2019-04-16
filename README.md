(c) Copyright 2017-2018 SUSE LLC

# SUSE OpenStack Cloud Deployer

The GUI installer for SUSE Openstack Cloud.

## How to run

Move to the root of the project and run `npm install` which will
install any dependencies

After that, run `npm start` which will bundle the react app and start
the express server

You will get the express server (UI) running on `localhost:2209`.

To run the selenium tests:
1. Assuming `npm install` is already run, perform initial setup `npm run protractor-setup` (once, does not
   need to be done each time)
2. start the app in another terminal `npm start`
3. run the tests `npm run protractor-day0` (for running day0 Installer tests)
4. run the tests `npm run protractor-day2` (for running day2 CLM Admin Console tests)

For more information on protractor/selenium locators see http://www.protractortest.org/#/locators

# Building and running the production version of the installer

Build just the ui components (output to "dist" folder):

    build_ui.sh

To run the application from that location, together with a local copy
of the ardana-installer-server:

    run_dist.sh

## Note!

You will need the ardana-service to provide data model information.  The source 
code for that service resides in the git repo https://github.com/ArdanaCLM/ardana-service.

# Open Build Service (OBS)

In order to build with OBS, a tarball containing the contents of the `node_modules` directory must be created
and added to the package.  Run the command:

    ./build_deps.sh

to refresh `node_modules` and create `node_modules.tar.bz2`.

# Docker

To build the docker container:

   docker build -t ardana-installer-ui .

To run the built container:

   docker run -it -p 2209:2209 ardana-installer-ui
