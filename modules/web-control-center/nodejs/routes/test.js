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
var bridge = require('../agents/agentManager');



/* GET summary page. */
router.get('/', function(req, res) {
    var c = bridge.findClient("55a2ca51eef88f6c775ed9d0");

    if (!c) {
        return res.send("Client not found");
    }

    c.restQuery("http://ya.ru/", function(error, code, message) {
        if (error) {
            res.send("Failed to execute REST query: " + error);

            return
        }

        res.send("code: " + code + '<br>message: ' + message);
    });
});

module.exports = router;
