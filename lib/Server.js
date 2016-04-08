"use strict";

//import Redis from 'redis';
const EventEmitter = require('events').EventEmitter;
const express = require('express');
const bodyParser = require('body-parser');
const Game = require('./Game');
const pg = require('pg');
const conString = "postgres://josh@localhost/barbu";

module.exports = class Server {
  constructor() {
    this.games = [];

    var app = this.app = express();
    app.use(bodyParser.json());

    app.post('/games', (req, res) => {

      this.db.query('BEGIN', (err) => {

        var handleError = (err) => {
          console.trace("error", err);
          this.db.query('ROLLBACK', () => {
            res.status(500).end('Error '+String(err));
          })
        }

        if (err) return handleError(err);
        this.db.query('INSERT into games (state) VALUES ($1) RETURNING id', [ Game.initialState() ], (err, result) => {
          if (err) return handleError(err);

          var gameId = result.rows[0].id;

          console.error('gameId', gameId)

          var finish = () => {
            this.db.query('COMMIT', (err) => {
              if (err) return res.status(500).end('error committing');

              return res.status(201).end('created');
            })
          }

          var insertUsers = (index) => {
            if (req.body.users.length === index) return finish();

            var name = req.body.users[index];

            this.db.query("select id from users where name = $1", [name], (err, result) => {
              if (err) return handleError(err);
              if (!result.rows[0]) return handleError(`player ${name} not found`);

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

    app.get('/games/:id', (req, res) => {
      var gameId = parseInt(req.params.id);
      var lastQuestionId;
      this.db.query('select * from game_players where game_id = $1::int and player_id = $2::int', [gameId, req.session.userId], (err, gamePlayerRow) => {
        if (err) return res.status(404).end('error getting game');
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
          emit(game.playerState(currentPosition));

          game.on('update', () => {
            emit(game.playerState(currentPosition));
            var question = game.ask();
            if (question.position !== currentPosition) return;

            emit({question: question});
          });
        }

        if (!this.games[gameId]) {
          this.db.query('select * from games where id = $1::int', [gameId], (err, gameRow) => {
            if (err) return res.status(404).end('error getting game');

            var game = new Game();
            game.state = gameRow[0].state;
            this.games[gameId] = game;
            attachToGame(this.games[gameId]);
            setImmediate(() => { game.emit('update') });
          })
        } else {
          attachToGame(this.games[gameId]);
        }
      });
    });

    app.put('/games/:id', (req, res) => {
      var gameId = parseInt(req.params.id);
      var game = this.games[gameId];
      if (!game) return res.status(404).end('error getting game');
      var lastQuestionId;
      this.db.query('select * from game_players where game_id = $1::int and player_id = $2::int', [gameId, req.session.userId], (err, gamePlayerRow) => {
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
  }

  listen(port) {
    this.db = new pg.Client(conString);
    this.db.connect((err) => {
      if (err) return console.error('could not connect to postgres', err);
      this.app.listen(port);
    });
  }

  listenGame(id, cb) {
    this.listeners[id];
  }
}
