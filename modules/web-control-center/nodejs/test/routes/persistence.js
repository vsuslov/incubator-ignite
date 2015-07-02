var request = require('supertest'),
    should = require('should'),
    express = require('express'),
    persistenceRouter = require('../../routes/persistences');

var app = express();

app.use(require('body-parser').json());

app.use('/rest/persistence', persistenceRouter);

describe('request.persistence', function(){
    var agent = request.agent(app);

    it('should return 200', function(done){
        agent
            .post('/rest/persistence/pg')
            .send({
                    username: 'nva',
                    password: 'nva.141',
                    host: 'localhost',
                    port: '5432',
                    dbName: 'ggmonitor'
                })
            .end(function(err, res) {
                if (err)
                    throw err;

                done();
            });
    });
});