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
        this.db.query('INSERT into games DEFAULT VALUES RETURNING id', (err, result) => {
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
      if (this.games[gameId]) {
        let game = this.games[gameId];

        game.on('question', (id, playerId, options) => {
          if (currentPlayerId !== playerId) return;
          if (id === lastQuestionId) return;
          write({question: options});
          lastQuestionId = id;
        });

        game.on('inform', (playerId, object) => {
          if (playerId !== null && playerId !== currentPlayerId) return;
          write({inform: object});
        })

        game.reask();
      } else {
        // select * from games where id = ?
        // select * from game_data where game_id = ?
        // select * from game_players where game_id = ?

        db.query('select * from games where id = ?', gameId, (err, gameRow) => {
          if (err) return res.status(500);

          db.query('select * from game_data where game_id = ?', gameId, (err, gameDataRows) => {
            if (err) return res.status(500);

            var game = new Game(playerInterface);
            games[gameId];
          })
        })
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

  joinGame() {

  }

//    listen = (port) => {
//      app.listen(port);
//    }
//

}