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
'use strict';

// New way of setting up express server
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);

var dayZeroApi = require('./app/app.js');

var helmet = require('helmet');
var session = require('express-session');
var uuid = require('node-uuid');

var ardanaApi = require('ardana-service/api');
var config = require('ardana-service/config');
var logger = require('ardana-service/lib/logger');

/** Day 0 config overrides **/
var path = require('path');

var dayZeroConfig = {
    logsDir: path.join(__dirname, '..', 'logs'),
    userModelDir: path.join(__dirname, '..', 'user_model'),
    topLevelBaseDir: path.join(__dirname, '..'),
    dayZeroClientPath: 'client'
};

config.add('dayZeroConfig', {
    type: 'literal',
    store: dayZeroConfig
});

/** ardana-service REST API will be mounted on this path **/
config.override('apiEndpoint', '/dayzeroapi');

var sessionSettings = {
    cookie: {httpOnly: true, secure: true},
    genid: function() {
        return uuid.v4();
    },
    resave: false,
    saveUninitialized: true,
    secret: uuid.v4()
};

dayZeroApi.init(app, config);

app.use(session(sessionSettings));
app.use(helmet());

// Mock API installs itself ONLY if in development environment and mocked is set
if (process.env.NODE_ENV === 'development' && config.isMocked()) {
    require('ardana-service/mock-api').init(app, config, server);
}

function startServer() {
    server.listen(config.get('port'), function() {
        logger.info('\x1b[32mHTTP Server starts listening on %d ...\x1b[0m', config.get('port'));
    });
}

ardanaApi.init(app, config, server).then(function() {
    logger.info('\x1b[32mInitialised ardana-service.\x1b[0m');
    // TODO: for this to work, endpoints must be attached after csrf middleware is installed
    //var csrf = require('csurf');
    //app.use(csrf());
    //app.use(function(request, response, next) {
    //    console.log('Oooops! This should never print!');
    //    response.locals.csrftoken = request.csrfToken();
    //    next();
    //});
}).catch(function(err) {
    logger.error('\x1b[31mFailed to intialise ardana-service!\x1b[0m', err);
}).finally(startServer);
