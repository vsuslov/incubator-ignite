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

var router = require('express').Router();
var db = require('../db');
var ds = require('../helpers/data-structures.js'), jdbcTypes = ds.jdbcTypes, javaTypes = ds.javaTypes;

/* GET persistence page. */
router.get('/', function (req, res) {
    res.render('configuration/persistence');
});

/**
 * Get spaces and persistences accessed for user account.
 *
 * @param req Request.
 * @param res Response.
 */
router.post('/list', function (req, res) {
    var user_id = req.currentUserId();

    // Get owned space and all accessed space.
    db.Space.find({$or: [{owner: user_id}, {usedBy: {$elemMatch: {account: user_id}}}]}, function (err, spaces) {
        if (err)
            return res.status(500).send(err.message);

        var space_ids = spaces.map(function (value) {
            return value._id;
        });

        // Get all persistences for spaces.
        db.Persistence.find({space: {$in: space_ids}}).sort('name').exec(function (err, persistences) {
            if (err)
                return res.status(500).send(err.message);

            res.json({spaces: spaces, persistences: persistences});
        });
    });
});

/**
 * Save persistence.
 */
router.post('/save', function (req, res) {
    if (req.body._id)
        db.Persistence.update({_id: req.body._id}, req.body, {upsert: true}, function (err) {
            if (err)
                return res.status(500).send(err.message);

            res.send(req.body._id);
        });
    else {
        db.CacheTypeMetadata.findOne({name: req.body.name}, function (err, persistence) {
            if (err)
                return res.status(500).send(err.message);

            if (persistence)
                return res.status(500).send('Persistence with name: "' + persistence.name + '" already exist.');

            (new db.Persistence(req.body)).save(function (err, persistence) {
                if (err)
                    return res.status(500).send(err.message);

                res.send(persistence._id);
            });
        });
    }
});

/**
 * Remove persistence by ._id.
 */
router.post('/remove', function (req, res) {
    db.Persistence.remove(req.body, function (err) {
        if (err)
            return res.status(500).send(err.message);

        res.sendStatus(200);
    })
});

// simple countdown latch
function CDL(countdown, completion) {
    this.countDown = function () {
        if (--countdown < 1) completion();
    };
}

/**
 * @param name Source name.
 * @return String converted to java class name notation.
 */
function toJavaClassName(name) {
    var len = name.length;

    var buf = [];

    var capitalizeNext = true;

    for (var i = 0; i < len; i++) {
        var ch = name.charAt(i);

        if (' ' == ch || '_' == ch)
            capitalizeNext = true;
        else if (capitalizeNext) {
            buf.push(ch.toUpperCase());

            capitalizeNext = false;
        }
        else
            buf.push(ch.toLowerCase());
    }

    return buf.join("");
}

/**
 * @param name Source name.
 * @return String converted to java field name notation.
 */
function toJavaFieldName(name) {
    var javaName = toJavaClassName(name);

    return javaName.charAt(0).toLowerCase() + javaName.substring(1);
}


//
router.post('/pg', function (req, res) {
    var pg = require('pg');
    var util = require('util');

    var host = req.body.host;
    var port = req.body.port;

    var username = req.body.username;
    var password = req.body.password;

    var dbName = req.body.dbName;

    var connectionString = util.format('postgres://%s:%s@%s:%d/%s', username, password, host, port, dbName);

    pg.connect(connectionString, function (err, client, done) {
        var sendError = function (err) {
            done();

            res.status(500).send(err.message);
        };

        if (err)
            return sendError(err);

        var sendResponse = function () {
            done();

            console.log(JSON.stringify(tables));

            res.status(200).send(tables);
        }, jdbcType = function (dataType) {
            switch (dataType) {
                case 'smallint':
                case 'int2':
                    return jdbcTypes.SMALLINT;
                case 'integer':
                case 'int':
                case 'int4':
                    return jdbcTypes.INTEGER;
                case 'oid':
                case 'bigint':
                case 'int8':
                    return jdbcTypes.BIGINT;
                case 'money':
                    return jdbcTypes.DOUBLE;
                case 'decimal':
                case 'numeric':
                    return jdbcTypes.NUMERIC;
                case 'float4':
                    return jdbcTypes.REAL;
                case 'float':
                case 'float8':
                    return jdbcTypes.DOUBLE;
                case 'char':
                case 'bpchar':
                    return jdbcTypes.CHAR;
                case 'varchar':
                case 'text':
                case 'name':
                    return jdbcTypes.VARCHAR;
                case 'bytea':
                    return jdbcTypes.BINARY;
                case 'boolean':
                case 'bool':
                case 'bit':
                    return jdbcTypes.BIT;
                case 'date':
                    return jdbcTypes.DATE;
                case 'time':
                case 'timetz':
                    return jdbcTypes.TIME;
                case 'timestamp':
                case 'timestamptz':
                    return jdbcTypes.TIMESTAMP;
            }
        }, javaType = function (dataType) {
            switch (dataType) {
                case jdbcTypes.SMALLINT:
                case jdbcTypes.INTEGER:
                    return javaTypes.INTEGER;
                case jdbcTypes.BIGINT:
                    return javaTypes.LONG;
                case jdbcTypes.DOUBLE:
                    return javaTypes.DOUBLE;
                case jdbcTypes.NUMERIC:
                    return javaTypes.BIGDECIMAL;
                case jdbcTypes.REAL:
                    return javaTypes.FLOAT;
                case jdbcTypes.CHAR:
                case jdbcTypes.VARCHAR:
                    return javaTypes.STRING;
                case jdbcTypes.BINARY:
                    return javaTypes.BYTE_ARRAY;
                case jdbcTypes.BIT:
                    return javaTypes.BOOLEAN;
                case jdbcTypes.DATE:
                    return javaTypes.DATE;
                case jdbcTypes.TIME:
                    return javaTypes.TIME;
                case jdbcTypes.TIMESTAMP:
                    return javaTypes.TIMESTAMP;
            }
        };

        var tables = [];

        client.query(
            'SELECT table_schema, table_name ' +
            'FROM information_schema.tables ' +
            'WHERE table_schema = ANY (current_schemas(false)) ' +
            'ORDER BY table_schema, table_name', function (err, result) {

                if (err)
                    return sendError(err);

                if (result.rows.length > 0) {
                    // usage
                    var latch = new CDL(result.rows.length, sendResponse);

                    result.rows.forEach(function (table) {

                        var indisprimary = client.query(
                            "SELECT a.attname " +
                            "FROM pg_index i " +
                            "JOIN pg_attribute a " +
                            "  ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) " +
                            "WHERE  i.indrelid = $1::regclass AND i.indisprimary", [table.table_schema + '.' + table.table_name],
                            function (err, result) {
                                if (err)
                                    return sendError(err);

                                var pks = result.rows.map(function (row) {
                                    return row.attname;
                                });

                                client.query(
                                    'SELECT column_name, udt_name, is_nullable ' +
                                    'FROM information_schema.columns ' +
                                    'WHERE table_schema = $1 AND table_name = $2', [table.table_schema, table.table_name],
                                    function (err, result) {
                                        if (err)
                                            return sendError(err);

                                        var cols = [];

                                        result.rows.forEach(function (column) {
                                            var dataType = jdbcType(column.udt_name);

                                            cols.push({
                                                pk: pks.indexOf(column.column_name) >= 0,
                                                use: true,
                                                notNull: column.is_nullable == 'NO',
                                                dbName: column.column_name,
                                                dbType: dataType,
                                                javaName: toJavaFieldName(column.column_name),
                                                javaType: javaType(dataType)
                                            });
                                        });

                                        var valClsName = toJavaClassName(table.table_name);

                                        tables.push({
                                            use: pks.length > 0,
                                            schemaName: table.table_schema, tableName: table.table_name,
                                            keyClass: valClsName + 'Key', valueClass: valClsName,
                                            columns: cols
                                        });

                                        latch.countDown();
                                    })
                            });
                    });
                }
            });
    });
});

module.exports = router;