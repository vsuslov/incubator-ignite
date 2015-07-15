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
var passport = require('passport');
var db = require('../db');

// GET dropdown-menu template.
router.get('/select', function (req, res) {
    res.render('templates/select', {});
});

// GET dropdown-menu template.
router.get('/confirm', function (req, res) {
    res.render('templates/confirm', {});
});

/* GET login page. */
router.get('/login', function (req, res) {
    res.render('login');
});

/**
 * Register new account.
 */
router.post('/register', function (req, res, next) {
    db.Account.count(function (err, cnt) {
        if (err)
            return res.status(401).send(err.message);

        req.body.admin = cnt == 0;

        db.Account.register(new db.Account(req.body), req.body.password, function (err, account) {
            if (err)
                return res.status(401).send(err.message);

            if (!account)
                return res.status(500).send('Failed to create account.');

            new db.Space({name: 'Personal space', owner: account._id}).save();

            req.logIn(account, {}, function (err) {
                if (err)
                    return res.status(401).send(err.message);

                return res.redirect('/configuration/clusters');
            });
        });
    });
});

/**
 * Login in exist account.
 */
router.post('/login', function (req, res, next) {
    passport.authenticate('local', function (err, user) {
        if (err)
            return res.status(401).send(err.message);

        if (!user)
            return res.status(401).send('Invalid email or password');

        req.logIn(user, {}, function (err) {
            if (err)
                return res.status(401).send(err.message);

            res.redirect('/configuration/clusters');
        });
    })(req, res, next);
});

/**
 * Logout.
 */
router.get('/logout', function (req, res) {
    req.logout();

    res.redirect('/');
});

/* GET home page. */
router.get('/', function (req, res) {
    if (req.isAuthenticated())
        res.redirect('/configuration/clusters');
    else
        res.render('index');
});

///* GET sql page. */
//router.get('/sql', function(req, res) {
//    res.render('sql', { user: req.user });
//});
//
///* GET clients page. */
//router.get('/clients', function(req, res) {
//    res.render('clients', { user: req.user });
//});

module.exports = router;
