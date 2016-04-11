var request = require('supertest')
var Server = require('../lib/Server');

describe('game', function() {
  beforeEach(function() {
    var server = new Server();
    this.app = server.app;
    truncateTables();
  })

  describe('POST /users', function() {
    it('should allow creation', function(done) {
      var app = this.app;
      request(app)
        .post('/users')
        .send({name: 'joshbuddy', password: 'password'})
        .expect(201, 'user created', done);
    })

    describe('with a preexisting user', function() {
      beforeEach(function(done) {
        var app = this.app;
        request(app)
          .post('/users')
          .send({name: 'joshbuddy', password: 'password'})
          .expect(201, 'user created', done);
      })

      it('should prevent creation', function(done) {
        var app = this.app;
        request(app)
          .post('/users')
          .send({name: 'joshbuddy', password: 'password'})
          .expect(400, 'name already taken', done);
      })
    })
  })

});