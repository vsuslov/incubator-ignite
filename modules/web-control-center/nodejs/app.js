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

var flash = require('connect-flash');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);

var pageRoutes = require('./routes/pages');
var clustersRouter = require('./routes/clusters');
var cachesRouter = require('./routes/caches');
var persistencesRouter = require('./routes/persistences');
var authRouter = require('./routes/auth');
var configGenerator = require('./routes/configGenerator');
var adminRouter = require('./routes/admin');

var passport = require('passport');

var db = require('./db');

var app = express();

// Views engine setup.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Site favicon.
app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(require('less-middleware')(path.join(__dirname, 'public'), {
    render: {
        compress: false
    }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser('keyboard cat'));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: new mongoStore({
        mongooseConnection: db.mongoose.connection
    })
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(db.Account.serializeUser());
passport.deserializeUser(db.Account.deserializeUser());

passport.use(db.Account.createStrategy());

var mustAuthenticated = function (req, res, next) {
    req.isAuthenticated() ? next() : res.redirect('/');
};

var adminOnly = function(req, res, next) {
    if (!req.isAuthenticated() || !req.user.admin)
        res.sendStatus(403);
    else
        next();
};

app.all('/configuration/clusters', mustAuthenticated);
app.all('/configuration/caches', mustAuthenticated);
app.all('/configuration/summary', mustAuthenticated);

app.all('/admin/*', mustAuthenticated, adminOnly);

app.use('/', pageRoutes);
app.use('/rest/clusters', clustersRouter);
app.use('/rest/caches', cachesRouter);
app.use('/rest/persistences', persistencesRouter);
app.use('/rest/auth', authRouter);
app.use('/rest/configGenerator', configGenerator);

app.use('/admin', adminRouter);


// Catch 404 and forward to error handler.
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Error handlers.

// Development error handler: will print stacktrace.
if (app.get('env') === 'development') {
    app.use(function (err, req, res) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// Production error handler: no stacktraces leaked to user.
app.use(function (err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
