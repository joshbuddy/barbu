"use strict";

const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;
const express = require('express');
const bodyParser = require('body-parser');
const Game = require('./Game');
const pg = require('pg');
const session = require('express-session');
const bcrypt = require('bcrypt');
const config = require(`${__dirname}/../config/${process.env.NODE_ENV || 'development'}.json`);

module.exports = class Server {
  constructor(gameClass) {
    this.games = [];

    var app = this.app = express();
    app.use(session({resave: false, saveUninitialized: false, secret: config.session.secret}));
    app.use(bodyParser.json());
    app.use((req, res, next) => {
      if (this.db) return next();
      this.db = new pg.Client(config.pg.url);
      this.db.connect((err) => {
        if (err) return console.error('could not connect to postgres', err);
        next();
      });
    })

    app.get('/', (req, res) => {
      res.sendFile('index.html');
    });

    app.post('/users', (req, res) => {
      var name = req.body.name;
      var password = req.body.password;

      if (!name) return res.status(400).end('no name provided');
      if (!password || password.length < 4) return res.status(400).end('no password provided');

      bcrypt.hash(password, 8, (err, hash) => {
        if (err) return res.status(500).end('fatal error');
        this.db.query('INSERT into users (name, password) VALUES ($1, $2) RETURNING id', [ name, hash ], (err, result) => {
          if (err) {
            switch (err.code) {
              // unique violation
              case '23505':
                return res.status(400).end('name already taken');
              default:
                console.error('unexpected error', err)
                return res.status(500).end('fatal error');
            }
          }

          var id = result.rows[0].id;

          req.session.userId = id;
          res.status(201).end('user created');
        });
      });
    });

    app.post('/login', (req, res) => {
      var name = req.body.name;
      var password = req.body.password;

      this.db.query("select id, password from users where name = $1", [name], (err, result) => {
        if (err) return res.status(500).end('fatal error');
        bcrypt.compare(password, result.rows[0].password, (err, matchingHash) => {
          if (err) return res.status(500).end('fatal error');
          if (!matchingHash) return res.status(401).end('unauthorized');

          req.session.userId = result.rows[0].id;
          res.status(200).end('authorized');
        });
      });
    });

    var isAuthenticated = (req, res, next) => {
      if (req.session.userId) return next();

      res.status(401).end('unauthorized');
    }

    app.post('/games', isAuthenticated, (req, res) => {
      this.db.query('BEGIN', (err) => {
        var handleError = (err, status) => {
          if (!status) status = 500;

          console.trace("error", err);
          this.db.query('ROLLBACK', () => {
            res.status(status).end(String(err));
          })
        }

        if (err) return handleError(err);
        this.db.query('INSERT into games (state) VALUES ($1) RETURNING id', [ Game.initialState() ], (err, result) => {
          if (err) return handleError(err);

          var gameId = result.rows[0].id;

          var finish = () => {
            this.db.query('COMMIT', (err) => {
              if (err) return res.status(500).end('error committing');

              return res.redirect(303, `/games/${gameId}`);
            })
          }

          var insertUsers = (index) => {
            if (req.body.users.length === index) return finish();

            var name = req.body.users[index];

            this.db.query("select id from users where name = $1", [name], (err, result) => {
              if (err) return handleError(err);
              if (!result.rows[0]) return handleError(`player ${name} not found`, 400);

              this.db.query("insert into game_players (user_id, game_id, position) VALUES ($1::int, $2::int, $3::int)", [result.rows[0].id, gameId, index], (err, result) => {

                if (err) return handleError(err);

                insertUsers(index + 1);
              });
            })
          }

          insertUsers(0);
        });
      });
    });

    app.get('/games/:id', isAuthenticated, (req, res) => {
      var gameId = parseInt(req.params.id);
      this.db.query('select * from game_players where game_id = $1::int and user_id = $2::int', [gameId, req.session.userId], (err, gamePlayerRow) => {

        if (err) return res.status(500).end('error getting game');
        if (gamePlayerRow.rows.length === 0) return res.status(401).end('unable to join game');

        var currentPosition = gamePlayerRow.rows[0].position;

        req.socket.setTimeout(0); // disable timeout
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
        res.write('\n');

        var eventId = 0;
        var emit = (body) => {
          res.write('id: ' + eventId++ + '\n');
          res.write('data:' + JSON.stringify(body) + '\n\n'); // Note the extra newline
        }

        var attachToGame = (game) => {
          var lastState = game.playerState(currentPosition);

          emit({type: 'update', body: lastState});

          game.on('update', () => {
            var nextState = game.playerState(currentPosition);
            if (!_.isEqual(lastState, nextState)) {
              lastState = nextState;
              emit({type: 'update', body: lastState});
            }
            var question = game.ask();
            if (question.position !== currentPosition) return;

            emit({type: 'question', body: question});
          });
        }

        if (!this.games[gameId]) {
          this.db.query('select * from games where id = $1::int', [gameId], (err, gameRow) => {
            if (err) return res.status(404).end('error getting game');

            var game = new Game();
            game.state = gameRow.rows[0].state;
            this.games[gameId] = game;
            attachToGame(this.games[gameId]);
            setImmediate(() => { game.emit('update') });
          })
        } else {
          attachToGame(this.games[gameId]);
        }
      });
    });

    app.put('/games/:id', isAuthenticated, (req, res) => {
      var gameId = parseInt(req.params.id);
      var game = this.games[gameId];
      if (!game) return res.status(404).end('error getting game');
      this.db.query('select * from game_players where game_id = $1::int and user_id = $2::int', [gameId, req.session.userId], (err, gamePlayerRow) => {
        if (err) return res.status(404).end('error getting game');
        if (gamePlayerRow.rows.length === 0) return res.status(401).end('unable to join game');

        var currentPosition = gamePlayerRow.rows[0].position;

        var question = game.ask();
        if (question.position !== currentPosition) return res.status(400).end('wrong position');

        try {
          game.answer(req.body);
          this.db.query('update games set state = $1 where id = $2::int', [game.state, gameId], (err) => {
            if (err) return res.status(500).end('error updating game');
            res.status(202).end('game updated');
            setImmediate(() => { game.emit('update') });
          });
        } catch (e) {
          res.status(500).end('game not updated');
        }
      });
    });
  }

  listen(port) {
    this.app.listen(port, (err) => {
      if (err) return console.error("error starting", err);

      console.log(`listening on port ${port}`);
    });
  }

  listenGame(id, cb) {
    this.listeners[id];
  }
}
