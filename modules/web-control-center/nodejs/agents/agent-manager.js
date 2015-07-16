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

var https = require('https');

var ignite = require('apache-ignite');

var db = require('../db');

var fs = require('fs');

var AgentServer = require('./agent-server').AgentServer;

/**
 * @constructor
 * @param {Number} port
 */
function AgentManager(port) {
    this._port = port;

    this._clients = {};
}

AgentManager.prototype.startup = function() {
    this._server = https.createServer({
        key: fs.readFileSync(config.get('monitor:server:key')),
        cert: fs.readFileSync(config.get('monitor:server:cert')),
        passphrase: config.get('monitor:server:keyPassphrase')
    });

    this._server.listen(this._port);

    this._wss = new WebSocketServer({ server: this._server });

    var self = this;

    this._wss.on('connection', function(ws) {
        var client = new Client(ws, self);
    });
};

/**
 * @param userId
 * @param {Client} client
 */
AgentManager.prototype._removeClient = function(userId, client) {
    var connections = this._clients[userId];

    if (connections) {
        removeFromArray(connections, client);

        if (connections.length == 0)
            delete this._clients[userId];
    }
};

/**
 * @param userId
 * @param {Client} client
 */
AgentManager.prototype._addClient = function(userId, client) {
    var existingConnections = this._clients[userId];

    if (!existingConnections) {
        existingConnections = [];

        this._clients[userId] = existingConnections;
    }

    existingConnections.push(client);
};

/**
 * @param userId
 * @return {Client}
 */
AgentManager.prototype.findClient = function(userId) {
    var clientsList = this._clients[userId];

    if (!clientsList)
        return null;

    return clientsList[0];
};

/**
 * For tests only!!!
 * @return {Client}
 */
AgentManager.prototype.getOneClient = function() {
    for (var userId in this._clients) {
        if (this._clients.hasOwnProperty(userId)) {
            var m = this._clients[userId];

            if (m.length > 0)
                return m[0];
        }
    }

    return null;
};


/**
 * @constructor
 * @param {AgentManager} manager
 * @param {WebSocket} ws
 */
function Client(ws, manager) {
    var self = this;

    this._manager = manager;
    this._ws = ws;

    ws.on('close', function() {
        if (self.user) {
            self._manager._removeClient(self.user._id, self);
        }
    });

    ws.on('message', function (msg) {
        self._handleMessage(JSON.parse(msg))
    });

    this._restCounter = 0;

    this._cbMap = {};
}

/**
 * @param {String|Object} msg
 * @param {Function} cb
 */
Client.prototype.sendMessage = function(msg, cb) {
    if (typeof msg == 'object') {
        msg = JSON.stringify(msg);
    }

    this._ws.send(msg, cb);
};

/**
 * @param {String} path
 * @param {Object} params
 * @param {Function} cb
 * @param {String} method
 * @param {String} body
 * @param {Object} headers
 */
Client.prototype.invokeRest = function(path, params, cb, method, body, headers) {
    if (typeof(params) != 'object')
        throw "'params' argument must be an object";

    if (typeof(cb) != 'function')
        throw "callback must be a function";

    if (body && typeof(body) != 'string')
        throw "body must be a string";

    if (headers && typeof(headers) != 'object')
        throw "headers must be an object";

    if (!method)
        method = 'GET';
    else
        method = method.toUpperCase();

    if (method != 'GET' && method != 'POST')
        throw "Unknown HTTP method: " + method;

    var reqId = this._restCounter++;

    this._cbMap[reqId] = cb;

    this.sendMessage({
        id: reqId,
        type: 'RestRequest',
        method: method,
        params: params,
        path: path,
        body: body,
        headers: headers
    }, function(err) {
        if (err) {
            delete this._cbMap[reqId];

            cb(err)
        }
    })
};

/**
 * @param {Object} msg
 */
Client.prototype._handleMessage = function(msg) {
    var self = this;

    switch (msg.type) {
        case 'AuthMessage':
            var account = db.Account.findByUsername(msg.login, function(err, account) {
                if (err) {
                    ws.send("{type: 'AuthResult', success: false}");
                }
                else {
                    account.authenticate(msg.password, function(err, user, res) {
                        if (!user) {
                            self._ws.send(JSON.stringify({type: 'AuthResult', success: false, message: res.message}));
                        }
                        else {
                            self._ws.send("{type: 'AuthResult', success: true}");

                            self._user = account;

                            self._manager._addClient(account._id, self);

                            self._ignite = new ignite.Ignite(new AgentServer(self));
                        }
                    });
                }
            });

            break;

        case 'RestResult':
            var cb = this._cbMap[msg.requestId];

            if (!cb)
                break;

            delete this._cbMap[msg.requestId];

            if (!msg.executed) {
                cb(msg.message)
            }
            else {
                cb(null, msg.code, msg.message)
            }

            break;

        default:
            this._ws.close()
    }
};

/**
 * @return {Ignite}
 */
Client.prototype.ignite = function() {
    return this._ignite;
};

function removeFromArray(arr, val) {
    var idx;

    while ((idx = arr.indexOf(val)) !== -1) {
        arr.splice(idx, 1);
    }
}

exports.AgentManager = AgentManager;

var manager = null;

/**
 * @return {AgentManager}
 */
exports.getOrCreate = function() {
    if (!manager) {
        manager = new AgentManager(config.get('monitor:server:port'));

        manager.startup();
    }

    return manager;
};
