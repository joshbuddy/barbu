'use strict';

const EventEmitter = require('events').EventEmitter;

// guessing game, pick a number from 1-10.
// first player who gets it right wins a point.
// quit after 3 points

module.exports = class Game extends EventEmitter {

  // rows is an optional list of state rows
  // when loading, never ask questions, but always emit state updates
  // the game must re-ask the last question once it has completely loaded it's state
  // the game must call ready after it's setup the initial state
  constructor(playerInterface, arrayOfObjects) {
    this.playerInterface = playerInterface;
  }

  // called when an answer comes in
  answer(id, response) {

  }

  // updates game with new object
  update(object) {

  }


}