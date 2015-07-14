/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var WebSocketServer = require('ws').Server;

var config = require('../helpers/configuration-loader.js');

var http = require('http');

var db = require('../db');

var srv;

var clients = {};

function Client(ws) {
    var self = this;

    this.ws = ws;

    ws.on('close', function() {
        if (self.userId) {
            var connections = clients[self.userId];

            if (connections) {
                removeFromArray(connections, self);
            }
        }
    });

    ws.on('message', function (msg) {
        var m = JSON.parse(msg);

        switch (m.type) {
            case 'AuthMessage':
                var account = db.Account.findByUsername(m.login, function(err, account) {
                    if (err) {
                        ws.send("{type: 'AuthResult', success: false}");
                    }
                    else {
                        account.authenticate(m.password, function(err, user, res) {
                            if (!user) {
                                ws.send(JSON.stringify({type: 'AuthResult', success: false, message: res.message}));
                            }
                            else {
                                ws.send("{type: 'AuthResult', success: true}");

                                self.userId = account._id;

                                var existingConnections = clients[account._id];

                                if (!existingConnections) {
                                    existingConnections = [];

                                    clients[account._id] = existingConnections;
                                }

                                existingConnections.push(self);
                            }
                        });
                    }
                });

                break;

            default:
                ws.close()
        }
    });
}

function Server() {
    var server = http.createServer();

    server.listen(config.get('monitor:agentsServerPort'));

    var wss = new WebSocketServer({ server: server });

    wss.on('connection', function(ws) {
        var client = new Client(ws);
    })
}

function removeFromArray(arr, val) {
    var idx;

    while ((idx = arr.indexOf(val)) !== -1) {
        arr.splice(idx, 1);
    }
}

exports.startServer = function() {
    srv = new Server();
};

exports.findClient = function(userId) {
    return clients[userId];
};
