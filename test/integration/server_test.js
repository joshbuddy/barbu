'use strict';

const request = require('request');
const assert = require('assert');
const path = require('path');
const child_process = require('child_process');
const EventSource = require('eventsource');

var createJosh = function() {
  beforeEach(function(done) {
    var req = request.defaults({json: true});
    req.post('http://localhost:3000/users', {body: {name: 'josh', password: 'password'}}, (err, response, body) => {
      assert(!err, 'unexpected error '+String(err));
      assert.equal(response.statusCode, 201);
      done();
    })
  })
}

var createEric = function() {
  beforeEach(function(done) {
    var req = request.defaults({json: true});
    req.post('http://localhost:3000/users', {body: {name: 'eric', password: 'password'}}, (err, response, body) => {
      assert(!err, 'unexpected error '+String(err));
      assert.equal(response.statusCode, 201);
      done();
    })
  })
}

var createJenny = function() {
  beforeEach(function(done) {
    var req = request.defaults({json: true});
    req.post('http://localhost:3000/users', {body: {name: 'jenny', password: 'password'}}, (err, response, body) => {
      assert(!err, 'unexpected error '+String(err));
      assert.equal(response.statusCode, 201);
      done();
    })
  })
}

var createMoxy = function() {
  beforeEach(function(done) {
    var req = request.defaults({json: true});
    req.post('http://localhost:3000/users', {body: {name: 'moxy', password: 'password'}}, (err, response, body) => {
      assert(!err, 'unexpected error '+String(err));
      assert.equal(response.statusCode, 201);
      done();
    })
  })
}

var badPlayers = function(names, gameLocation, cb) {
  var badPlayer = (index) => {
    if (index === names.length) return cb();
    var name = names[index];
    var jar = request.jar();
    var req = request.defaults({jar: jar, json: true});

    req.post('http://localhost:3000/login', {body: {name: name, password: 'password'}}, (err, response, body) => {
      assert(!err, 'unexpected error '+String(err));
      assert.equal(response.statusCode, 200);

      var es = new EventSource(`http://localhost:3000${gameLocation}`, {headers: {Cookie: String(jar._jar.store.idx.localhost['/']['connect.sid'])}});

      es.onmessage = (message) => {
        var evt = JSON.parse(message.data);
        if (evt.type === 'question') {
          var wrongAnser = (getAnswer() + 1 % 30) + 1;
          req.put(`http://localhost:3000${gameLocation}`, {body: {guess: wrongAnser}}, (err, response) => {
            assert(!err);
            assert.equal(response.statusCode, 202);
          });
        }
      }

      badPlayer(index + 1);
    });
  }

  badPlayer(0);
}

describe('A server', function() {

  beforeEach(function(done) {
    truncateTables();
    var args = ['./bin/server'];
    var root = path.join(__dirname, '..', '..');
    this.child = child_process.spawn('node', args, {stdio: ['pipe', 'pipe', 'pipe'], cwd: root});
    this.child.stdout.on('data', (buf) => {
      if (buf.toString().indexOf('listening on port') !== -1) return done()
      console.log("out:", buf.toString())
    })
    this.child.stderr.on('data', (buf) => { console.log("out:", buf.toString()) })
    this.child.on('exit', (status, signal) => {
      assert(this.exitCalled, "exited before exit was called with "+status+" and signal "+signal);
    });
  })

  afterEach(function() {
    this.exitCalled = true;
    this.child.kill();
  })

  createJosh();
  createEric();
  createJenny();
  createMoxy();

  it("should play a complete game", function(done) {
    var jar = request.jar();
    var req = request.defaults({jar: jar, json: true});

    req.post('http://localhost:3000/login', {body: {name: 'josh', password: 'password'}}, (err, response, body) => {
      assert(!err, 'unexpected error '+String(err));
      assert.equal(response.statusCode, 200);

      req.post('http://localhost:3000/games', {body: {users: ['josh', 'moxy', 'eric', 'jenny'], name: 'pick-a-number'}}, (err, response, body) => {
        assert(!err, 'unexpected error '+String(err));
        assert.equal(response.statusCode, 303);
        var gameLocation = response.headers.location;

        var expectedEvents = [
          {type: 'update', body: {scores: [0,0,0,0], position: 0}},
          {type: 'question', body: {options:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], position: 0,type: 'pick'}},
          {type: 'update', body: {scores: [1,0,0,0], position: 1}},
          {type: 'update', body: {scores: [1,0,0,0], position: 2}},
          {type: 'update', body: {scores: [1,0,0,0], position: 3}},
          {type: 'update', body: {scores: [1,0,0,0], position: 0}},
          {type: 'question', body: {options:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], position: 0,type: 'pick'}},
          {type: 'update', body: {scores: [2,0,0,0], position: 1}},
          {type: 'update', body: {scores: [2,0,0,0], position: 2}},
          {type: 'update', body: {scores: [2,0,0,0], position: 3}},
          {type: 'update', body: {scores: [2,0,0,0], position: 0}},
          {type: 'question', body: {options:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30], position: 0,type: 'pick'}},
          {type: 'update', body: {scores: [3,0,0,0], position: 0}},
          {type: 'finished'}
        ];

        badPlayers(['eric', 'jenny', 'moxy'], gameLocation, () => {
          var es = new EventSource(`http://localhost:3000${gameLocation}`, {headers: {Cookie: String(jar._jar.store.idx.localhost['/']['connect.sid'])}});
          var esFinished = false;

          es.onmessage = (message) => {
            var evt = JSON.parse(message.data);
            var expectedEvent = expectedEvents.shift();
            assert.deepEqual(evt, expectedEvent, "didn't match "+message.data);
            if (expectedEvents.length === 0) {
              esFinished = true;
            }

            if (evt.type === 'question') {
              req.put(`http://localhost:3000${gameLocation}`, {body: {guess: getAnswer()}}, (err, response) => {
                assert(!err);
                assert.equal(response.statusCode, 202);
              });
            }
          }

          es.onerror = (err) => {
            es.close();
            assert(esFinished, "error processing stream "+String(err));
            done();
          }

          es.onclose = () => {
            assert(false, "stream unexpectantly closed!");
          }
        });
      });
    })
  })

  it("should chat", function(done) {
    var jar = request.jar();
    var req = request.defaults({jar: jar, json: true});
    var esFinished = false;

    req.post('http://localhost:3000/login', {body: {name: 'josh', password: 'password'}}, (err, response, body) => {
      assert(!err, 'unexpected error '+String(err));
      assert.equal(response.statusCode, 200);

      var es = new EventSource(`http://localhost:3000/chat`, {headers: {Cookie: String(jar._jar.store.idx.localhost['/']['connect.sid'])}});

      es.onmessage = (message) => {
        var chatMessage = JSON.parse(message.data);
        assert(chatMessage.from.id);
        assert.equal(chatMessage.from.name, 'josh');
        assert.equal(chatMessage.message, 'hello there!');
        done();
      }

      es.onerror = (err) => {
        es.close();
        assert(esFinished, "error processing stream "+String(err));
        done();
      }

      es.onclose = () => {
        assert(false, "stream unexpectantly closed!");
      }

      es.onopen = () => {
        req.post('http://localhost:3000/chat', {body: {message: 'hello there!'}}, (err, response, body) => {
          assert(!err)
          assert.equal(response.statusCode, 202);
        });
      }

    });
  });
})