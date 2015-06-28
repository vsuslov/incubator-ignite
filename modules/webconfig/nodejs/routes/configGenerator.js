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

var db = require('../db');

var router = require('express').Router();

var generatorXml = require('./../utils/generatorXml');
var generatorJava = require('./../utils/generatorJava');

router.get('/', function(req, res) {
    var lang = req.query.lang;
    var name = req.query.name;

    var user_id = req.user._id;
    
    db.Space.find({$or: [{owner: user_id}, {usedBy: {$elemMatch: {account: user_id}}}]}, function (err, spaces) {
        if (err)
            return res.status(500).send(err.message);

        var space_ids = spaces.map(function(value) {
            return value._id;
        });

        // Get all clusters for spaces.
        db.Cluster.find({name: name, space: {$in: space_ids}}).populate('caches').exec(function (err, clusters) {
            if (err)
                return res.status(500).send(err.message);

            if (clusters.length == 0) {
                res.sendStatus(404);

                return
            }

            var cluster = clusters[0];

            switch (lang) {
                case 'xml':
                    res.send(generatorXml.generateClusterConfiguration(cluster));
                    break;

                case 'java':
                    res.send(generatorJava.generateClusterConfiguration(cluster, req.query.generateJavaClass));
                    break;

                default:
                    res.status(404).send("Unknown language: " + lang);
                    break;
            }
        });
    });
});

module.exports = router;