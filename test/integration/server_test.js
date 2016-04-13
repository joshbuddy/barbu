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

  it("should start a server", function(done) {
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
          {type: 'update', body: {scores: [1,0,0,0], position: 1}}
        ];

        var es = new EventSource(`http://localhost:3000${gameLocation}`, {headers: {Cookie: String(jar._jar.store.idx.localhost['/']['connect.sid'])}});
        var esFinished = false;

        es.onmessage = (message) => {
          var evt = JSON.parse(message.data);
          assert.deepEqual(evt, expectedEvents.shift());
          if (expectedEvents.length === 0) {
            esFinished = true;
            es.close();
            return done();
          }

          if (evt.type === 'question') {
            req.put(`http://localhost:3000${gameLocation}`, {body: {guess: getAnswer()}}, (err, response) => {
              assert(!err);
              assert.equal(response.statusCode, 202);
            });
          }
        }

        es.onerror = (err) => {
          console.error('err', err)
          es.close();
          assert(false, "error processing stream "+String(err));
        }

        es.onclose = () => {
          assert(esFinished, "stream unexpectantly closed!");
        }
      });
    })
  })

})