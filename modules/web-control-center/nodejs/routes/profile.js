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

router.all('/profile/*', function (req, res, next) {
    var userId = req.body._id;

    if (userId != req.currentUserId() && userId != req.user._id)
        return res.sendStatus(403);
    else
        next();
});

/**
 * Get list of user accounts.
 */
router.get('/', function (req, res) {
    var user_id = req.currentUserId();

    db.Account.findById(user_id, function (err, user) {
        if (err)
            return res.status(500).send(err.message);

        res.render('profile');
    });
});

router.post('/saveUser', function (req, res) {
    var params = req.body;

    if (params.changeUsername || params.changeEmail) {
        var u = {};

        if (params.changeUsername)
            u.username = params.userName;

        if (params.changeEmail)
            u.email = params.email;

        db.Account.findByIdAndUpdate(req.body._id, u, {new: true}, function (err, val) {
            if (err)
                return res.status(500).send(err);

            res.json(uiUtils.filterUser(val));
        })
    }

    if (params.changeEmail) {
        // TODO
    }

    if (params.changePassword) {
        var oldPassword = params.oldPassword;
        var newPassword = params.newPassword;
        var confirmPassword = params.confirmPassword;

        var zz = user.verifyPassword(oldPassword);

        if (!oldPassword || oldPassword.length == 0 || !zz)
            return res.status(500).send('Wrong value for old password');

        if (!newPassword || newPassword.length == 0)
            return res.status(500).send('Wrong value for new password');

        if (!confirmPassword || confirmPassword.length == 0 || newPassword != oldPassword)
            return res.status(500).send('New password does not match confirmation');

        db.Account.findById(params._id, function (err, user) {
            if (err)
                return res.status(500).send(err);

            user.setPassword(newPassword, function (err, updatedUser) {
                if (err)
                    return res.status(500).send(err);

                updatedUser.save(function (err) {
                    if (err)
                        return res.status(500).send(err);

                    res.json(uiUtils.filterUser(user));
                });
            });
        });
    }
});

module.exports = router;