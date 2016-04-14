'use strict';

const environment = process.env.NODE_ENV || 'development';

const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;
const express = require('express');
const bodyParser = require('body-parser');
const pg = require('pg');
const session = require('express-session');
const bcrypt = require('bcrypt');
const redis = require('redis');
const assert = require('assert');
const config = require(`${__dirname}/../config/${environment}.json`);

const games = {
  'pick-a-number': require('./games/pick-a-number/Game.js')
}

module.exports = class Server {
  constructor() {
    this.publisher = redis.createClient();

    var app = this.app = express();

    if (environment === 'development') {
      const webpack = require('webpack');
      const webpackMiddleware = require('webpack-dev-middleware');
      const webpackHotMiddleware = require("webpack-hot-middleware");
      const webpackConfig = require(`${__dirname}/../config/webpack.config`);
      const compiler = webpack(webpackConfig);

      console.error('webpackConfig.output.publicPath', webpackConfig.output.publicPath)

      app.use(webpackMiddleware(compiler, {
        noInfo: true, publicPath: webpackConfig.output.publicPath
      }));
      app.use(webpackHotMiddleware(compiler));
    }

    app.use(session({resave: false, saveUninitialized: false, secret: config.session.secret}));
    app.use(bodyParser.json());
    app.use(express.static('public'));

    app.use((req, res, next) => {
      if (this.db) return next();
      this.db = new pg.Client(config.pg.url);
      this.db.connect((err) => {
        if (err) return console.error('could not connect to postgres', err);
        next();
      });
    })

    app.get('/', (req, res) => {
      res.sendFile('public/index.html');
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

    app.get('/games', isAuthenticated, (req, res) => {
      this.db.query('select games.created_at as created_at, games.updated_at as updated_at, games.id as game_id, games.name as name from game_players, games where user_id = $1::int and games.id = game_players.game_id', [req.session.userId], (err, gameRows) => {
        if (err) return res.status(500).end('fatal error');

        res.send({games: _.map(gameRows.rows, (row) => {
          return {
            url: `/games/${row.game_id}`,
            id: row.game_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            name: row.name
          }
        })})
      });
    })

    app.post('/games', isAuthenticated, (req, res) => {
      this.db.query('BEGIN', (err) => {
        var handleError = (err, status) => {
          if (!status) status = 500;

          this.db.query('ROLLBACK', () => {
            res.status(status).end(String(err));
          })
        }

        var gameName = req.body.name;
        var Game = games[gameName];
        if (!Game) return handleError(`game ${gameName} not found`, 400);
        if (err) return handleError(err);
        this.db.query('INSERT into games (state, name) VALUES ($1, $2) RETURNING id', [ Game.initialState(), gameName], (err, result) => {
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

        this.db.query('select * from games where id = $1::int', [gameId], (err, gameRow) => {
          if (err) return res.status(500).end('error getting game');

          var Game = games[gameRow.rows[0].name];
          var game = new Game();
          var currentPosition = gamePlayerRow.rows[0].position;
          var subscriber = redis.createClient();
          var eventId = 0;
          var lastState;

          req.socket.setTimeout(0); // disable timeout
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          });
          res.write('\n');

          var cleanup = () => {
            subscriber.quit();
            res.end();
          }

          var emit = (body) => {
            res.write('id: ' + eventId++ + '\n');
            res.write('data:' + JSON.stringify(body) + '\n\n'); // Note the extra newline
          }

          var finishGame = () => {
            emit({type: 'finished'});
            cleanup();
            this.db.query('update games set finished = true, updated_at = current_date where id = $1::int', [gameId], (err) => {
              if (err) return console.trace('error updating game', err);

              this.publisher.publish(`game-${gameId}`, 'update');
            });
          }

          var processGame = () => {
            this.db.query('select * from games where id = $1::int', [gameId], (err, gameRow) => {
              if (err) {
                console.error("unexpected error", err);
                return cleanup();
              }
              var state = gameRow.rows[0].state;
              var nextState = game.playerState(state, currentPosition);
              var question = game.nextQuestion(state);

              if (!_.isEqual(lastState, nextState)) {
                lastState = nextState;
                emit({type: 'update', body: lastState});
              }

              if (!question) return finishGame();
              if (question.position !== currentPosition) return;

              emit({type: 'question', body: question});
            });
          }

          var attach = () => {
            processGame();

            subscriber.on("message", () => {
              processGame();
            });
            subscriber.subscribe(`game-${gameId}`);
          }

          attach();
        });
      });
    });

    app.put('/games/:id', isAuthenticated, (req, res) => {
      var gameId = parseInt(req.params.id);
      this.db.query('select * from game_players where game_id = $1::int and user_id = $2::int', [gameId, req.session.userId], (err, gamePlayerRow) => {
        if (err) return res.status(404).end('error getting game');
        if (gamePlayerRow.rows.length === 0) return res.status(401).end('unable to join game');

        var currentPosition = gamePlayerRow.rows[0].position;

        this.db.query('select * from games where id = $1::int', [gameId], (err, gameRow) => {
          if (err) return res.status(500).end('error updating game');
          var name = gameRow.rows[0].name;
          var Game = games[name];
          var game = new Game();
          var state = gameRow.rows[0].state;
          var question = game.nextQuestion(state);
          if (!question) return res.status(400).end('game finished');
          if (question.position !== currentPosition) return res.status(400).end('wrong position');

          try {
            var nextState = game.answer(state, req.body);
            this.db.query('update games set state = $1, updated_at = current_date where id = $2::int', [nextState, gameId], (err) => {
              if (err) return res.status(500).end('error updating game');

              res.status(202).end('game updated');
              this.publisher.publish(`game-${gameId}`, 'update');
            });
          } catch (e) {
            console.trace("error", e)
            res.status(500).end('game not updated');
          }
        });
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
