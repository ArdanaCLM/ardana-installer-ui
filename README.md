# Ardana Installer - Day Zero Experience

This web application uses Node.js + Express as the web server and AngularJS as the front-end framework. This application provides a simple user interface to configure and deploy a cloud.

## Installation

#### Prerequisites

This application assumes you have the ardana-input-model project checkout in the parent folder. The folder structure should look like this:

```
.
..
ardana-input-model
ardana-installer-ui
```

#### OS X
 - Download Node.js at https://nodejs.org/download/
 - Clone the **master** branch of the repository
 - Run `npm install`

#### Linux
```
sudo apt-get update
sudo apt-get install -y git nodejs npm
sudo update-alternatives --install /usr/bin/node node /usr/bin/nodejs 10
git clone -b master git://git.suse.provo.cloud/ardana/ardana-installer-ui
cd ardana-installer-ui
npm install
```

## Testing
Unit tests with Karma can be run with `npm run test`. End-to-end tests with Protractor can be run with `npm run e2e`. You will first need to start the application with `npm run devstart` in a different terminal window.
