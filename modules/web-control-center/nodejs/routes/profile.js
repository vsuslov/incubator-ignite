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

router.all('/profile/*', function(req, res, next) {
    var userId = req.body._id;

    if (userId != req.currentUserId() && userId != req.user._id)
        return res.sendStatus(403);
    else
        next();
});

/**
 * Get list of user accounts.
 */
router.get('/profile', function(req, res) {
    var user_id = req.currentUserId();

    db.Account.findById(user_id, function (err, user) {
        if (err)
            return res.status(500).send(err.message);

        res.render('profile', {editableUser: user});
    });
});

router.post('/profile/saveUser', function(req, res) {
    var u = {
        username: req.body.username
    }; 
    
    db.Account.findByIdAndUpdate(req.body._id, u, {new: true}, function(err, val) {
        if (err)
            return res.status(500).send(err);
        
        res.json(uiUtils.filterUser(val));
    })
});

router.post('/profile/changePassword', function(req, res) {
    var pass = req.body.pass;
    
    if (!pass || pass.length == 0)
        return res.sendStatus(500);
    
    db.Account.findById(req.body._id, function(err, user) {
        if (err)
            return res.status(500).send(err);
        
        user.salt = user.makeSalt();
        user.hash = user.encryptPassword(pass);
        
        user.save(function (err) {
            if (err)
                return res.status(500).send(err);

            res.json(uiUtils.filterUser(val));
        });
    })
});

module.exports = router;