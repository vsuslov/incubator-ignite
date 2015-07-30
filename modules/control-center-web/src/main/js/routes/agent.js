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
var agentManager = require('../agents/agent-manager');

/* GET summary page. */
router.post('/topology', function(req, res) {
    var c = agentManager.getAgentManager()._getFirstClient();

    if (!c)
        return res.status(500).send("Client not found");

    var ignite = c.ignite();

    ignite.cluster().then(function (cluster) {
        res.json(cluster);
    }, function (err) {
        res.send(err);
    });
});

module.exports = router;
