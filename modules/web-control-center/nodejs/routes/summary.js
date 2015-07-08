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

var generatorXml = require('./../generator/xml');
var generatorJava = require('./../generator/java');

/* GET summary page. */
router.get('/', function(req, res) {
    res.render('summary');
});

router.post('/generator', function(req, res) {
    var lang = req.body.lang;

    // Get cluster.
    db.Cluster.findById(req.body._id).populate('caches').exec(function (err, cluster) {
        if (err)
            return res.status(500).send(err.message);

        if (!cluster) {
            res.sendStatus(404);

            return
        }

        switch (lang) {
            case 'xml':
                res.send(generatorXml.generateClusterConfiguration(cluster));
                break;

            case 'java':
                res.send(generatorJava.generateClusterConfiguration(cluster, req.body.generateJavaClass));
                break;

            default:
                res.status(404).send("Unknown language: " + lang);
                break;
        }
    });
});

module.exports = router;