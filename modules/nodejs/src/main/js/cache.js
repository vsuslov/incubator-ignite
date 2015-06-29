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

var Server = require("./server").Server;
var Command = require("./server").Command;
var SqlFieldsQuery = require("./sql-fields-query").SqlFieldsQuery
var SqlQuery = require("./sql-query").SqlQuery

/**
 * Creates an instance of Cache
 *
 * @constructor
 * @this {Cache}
 * @param {Server} server Server class
 * @param {string} cacheName Cache name
 */
function Cache(server, cacheName) {
    this._server = server;
    this._cacheName = cacheName;
}

/**
 * Get cache value
 *
 * @this {Cache}
 * @param {string} key Key
 * @param {onGet} callback Called on finish
 */
Cache.prototype.get = function(key, callback) {
    this._server.runCommand(this._createCommand("get").addParam("key", key), callback);
};

/**
 * Put cache value
 *
 * @this {Cache}
 * @param {string} key Key
 * @param {string} value Value
 * @param {noValue} callback Called on finish
 */
Cache.prototype.put = function(key, value, callback) {
    this._server.runCommand(this._createCommand("put").addParam("key", key).addParam("val", value),
        callback);
}

/**
 * Remove cache key
 *
 * @this {Cache}
 * @param {string} key Key
 * @param {noValue} callback Called on finish
 */
Cache.prototype.remove = function(key, callback) {
    this._server.runCommand(this._createCommand("rmv").addParam("key", key), callback);
}

/**
 * Remove cache keys
 *
 * @this {Cache}
 * @param {string[]} keys Keys to remove
 * @param {noValue} callback Called on finish
 */
Cache.prototype.removeAll = function(keys, callback) {
    this._server.runCommand(this._createCommand("rmvall").addParams("k", keys), callback);
}

/**
 * Put keys to cache
 *
 * @this {Cache}
 * @param {Object.<string, string>} map collection of entries to put in the cache
 * @param {noValue} callback Called on finish
 */
Cache.prototype.putAll = function(map, callback) {
    var keys = Object.keys(map);

    var values = [];

    for (var key of keys) {
        values.push(map[key]);
    }

    this._server.runCommand(this._createCommand("putall").addParams("k", keys).addParams("v", values), callback);
}

/**
 * Put keys to cache
 *
 * @this {Cache}
 * @param {Object.<string, string>} map collection of entries to put in the cache
 * @param {noValue} callback Called on finish
 */
Cache.prototype.postPutAll = function(map, callback) {
    this._server.runCommand(this._createCommand("putall2").setPostData(JSON.stringify(map)), callback);
}

/**
 * Callback for cache get
 *
 * @callback Cache~onGetAll
 * @param {string} error Error
 * @param {string[]} results Result values
 */

/**
 * Get keys from the cache
 *
 * @this {Cache}
 * @param {string[]} keys Keys
 * @param {Cache~onGetAll} callback Called on finish
 */
Cache.prototype.getAll = function(keys, callback) {
    this._server.runCommand(this._createCommand("getall").addParams("k", keys), callback);
}

/**
 * Execute sql query
 *
 * @param {SqlQuery} qry Query
 */
Cache.prototype.query = function(qry) {
    function onQueryExecute(qry, error, res) {
        if (error !== null) {
            qry.error(error);
            qry.end();

            return;
        }
        console.log("Qry: " + qry.type());

        console.log("Error: " + error);
        console.log("Result: " + res);

        qry.page(res["items"]);

        if (res["last"]) {
            qry.end();
        }
        else {
            var command = this._createCommand("qryfetch");
            command.addParam("qryId", res.queryId).addParam("psz", qry.pageSize());
            this._server.runCommand(command, onQueryExecute.bind(this, qry));
        }
    }

    if (qry.type() === "Sql") {
        this._sqlQuery(qry, onQueryExecute);
    }
    else {
        this._sqlFieldsQuery(qry, onQueryExecute);
    }
}

Cache.prototype._sqlFieldsQuery = function(qry, onQueryExecute) {
    var command = this._createQueryCommand("qryfieldsexecute", qry);
    command.addParams("arg", qry.arguments());

    this._server.runCommand(command, onQueryExecute.bind(this, qry));
}

Cache.prototype._sqlQuery = function(qry, onQueryExecute) {

    if (qry.returnType() == null) {
        qry.error("No type for sql query.");
        qry.end();
        return;
    }

    var command = this._createQueryCommand("qryexecute", qry);
    command.addParams("arg", qry.arguments());
    command.addParam("type", qry.returnType());

    this._server.runCommand(command, onQueryExecute.bind(this, qry));
}

Cache.prototype._createCommand = function(name) {
    var command = new Command(name);
    return command.addParam("cacheName", this._cacheName);
}

Cache.prototype._createQueryCommand = function(name, qry) {
    var command = this._createCommand(name);
    command.addParam("qry", qry.query());
    return command.addParam("psz", qry.pageSize());
}

exports.Cache = Cache