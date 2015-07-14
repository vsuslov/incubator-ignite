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

router.get('/', function (req, res) {
    res.render('settings/admin');
});

/**
 * Get list of user accounts.
 */
router.post('/list', function(req, res) {
    db.Account.find({}).select('-attempts -hash -salt').exec(function (err, users) {
        if (err)
            return res.status(500).send(err.message);

        res.json(users);
    });
});

router.post('/remove', function (req, res) {
    var userId = req.body.userId;

    db.Account.findByIdAndRemove(userId, function (err) {
        if (err)
            return res.status(500).send(err);

        res.sendStatus(200);
    });
});

router.post('/save', function (req, res) {
    var userId = req.body.userId;
    var adminFlag = req.body.adminFlag;

    db.Account.findByIdAndUpdate(userId, {admin: adminFlag}, function (err) {
        if (err)
            return res.status(500).send(err.message);

        res.sendStatus(200);
    });
});

router.get('/become', function (req, res) {
    var viewedUserId = req.query.viewedUserId;

    if (!viewedUserId) {
        req.session.viewedUser = null;

        return res.redirect('/admin');
    }

    db.Account.findById(viewedUserId, function (err, viewedUser) {
        if (err)
            return res.sendStatus(404);

        req.session.viewedUser = viewedUser;

        res.redirect('/');
    })
});

module.exports = router;