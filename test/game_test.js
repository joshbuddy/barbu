var request = require('supertest')
var Server = require('../lib/Server');
var assert = require('assert');

var createJosh = function() {
  beforeEach(function(done) {
    var agent = this.agent || request(this.app);
    agent
      .post('/users')
      .send({name: 'josh', password: 'password'})
      .expect(201, 'user created', done);
  })
}

var createEric = function() {
  beforeEach(function(done) {
    var agent = this.agent || request(this.app);
    agent
      .post('/users')
      .send({name: 'eric', password: 'password'})
      .expect(201, 'user created', done);
  })
}

var createJenny = function() {
  beforeEach(function(done) {
    var agent = this.agent || request(this.app);
    agent
      .post('/users')
      .send({name: 'jenny', password: 'password'})
      .expect(201, 'user created', done);
  })
}

var createMoxy = function() {
  beforeEach(function(done) {
    var agent = this.agent || request(this.app);
    agent
      .post('/users')
      .send({name: 'moxy', password: 'password'})
      .expect(201, 'user created', done);
  })
}

describe('Game server', function() {
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
        .send({name: 'josh', password: 'password'})
        .expect(201, 'user created', done);
    })

    describe('with a preexisting user', function() {

      createJosh();

      it('should prevent creation', function(done) {
        var app = this.app;
        request(app)
          .post('/users')
          .send({name: 'josh', password: 'password'})
          .expect(400, 'name already taken', done);
      })
    })
  })

  describe('POST /login', function() {

    createJosh();

    it("should allow login", function(done) {
        var app = this.app;
        request(app)
          .post('/login')
          .send({name: 'josh', password: 'password'})
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
          .send({name: 'josh', password: 'something'})
          .expect(401, 'unauthorized', done);
    })
  });

  describe('POST /games', function() {
    createMoxy();
    createJenny();
    createEric();

    beforeEach(function() {
      this.agent = request.agent(this.app);
    })

    // logged in as josh
    createJosh();

    it("should allow creating a game", function(done) {
      this.agent
        .post('/games')
        .send({users: ['josh', 'jenny', 'moxy', 'eric']})
        .expect(201, 'created', done);
    })

    it("should disallow creating a game with invalid players", function(done) {
      this.agent
        .post('/games')
        .send({users: ['josh', 'jenny', 'moxy', 'ella']})
        .expect(400, 'player ella not found', done);
    })
  });
});

