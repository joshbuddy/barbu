var request = require('supertest')
var Server = require('../lib/Server');
var assert = require('assert');

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

  describe('POST /login', function() {
    beforeEach(function(done) {
      var app = this.app;
      request(app)
        .post('/users')
        .send({name: 'joshbuddy', password: 'password'})
        .expect(201, 'user created', done);
    })

    it("should allow login", function(done) {
        var app = this.app;
        request(app)
          .post('/login')
          .send({name: 'joshbuddy', password: 'password'})
          .expect(200, 'authorized', function(err, response) {
            assert(!err, String(err));
            assert(response.headers['set-cookie'], 'no cookie set');
            done()
          });
    })

    it("should reject an incorrect password", function(done) {
        var app = this.app;
        request(app)
          .post('/login')
          .send({name: 'joshbuddy', password: 'something'})
          .expect(401, 'unauthorized', done);
    })
  });
});