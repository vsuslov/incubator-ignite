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
var uiUtils = require('../helpers/ui-utils');

router.get('/', function(req, res) {
    res.render('admin/index');
});

/**
 * Get list of user accounts.
 */
router.post('/list', function(req, res) {
    db.Account.find({}, function (err, users) {
        if (err)
            return res.status(500).send(err.message);

        var uiUsers = [];

        for (var i = 0; i < users.length; i++) {
            uiUsers.push(uiUtils.filterUser(users[i]))
        }

        res.json(uiUsers);
    });
});

router.post('/remove', function(req, res) {
    var userId = req.query.userId;

    db.Account.findByIdAndRemove(userId, function(err) {
        if (!err)
            res.sendStatus(200);
        else
            res.status(500).send(err);
    });
});

router.post('/save', function(req, res) {
    var userId = req.query.userId;
    var adminFlag = req.query.adminFlag;

    db.Account.findByIdAndUpdate(userId, {admin: adminFlag}, function(err) {
        if (!err)
            res.sendStatus(200);
        else
            res.status(500).send(err);
    });
});

router.post('/become', function(req, res) {
    var viewedUserId = req.body.viewedUserId;

    if (!viewedUserId) {
        req.session.viewedUser = null;

        res.redirect('/');

        return
    }

    db.Account.findById(viewedUserId, function(err, viewedUser) {
        if (err)
            return res.sendStatus(404);

        req.session.viewedUser = {_id: viewedUser._id, username: viewedUser.username};

        res.redirect('/');
    })
});

module.exports = router;