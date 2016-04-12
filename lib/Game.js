'use strict';

const EventEmitter = require('events').EventEmitter;

// guessing game, pick a number from 1-10.
// first player who gets it right wins a point.
// quit after 3 points

function newRandomNumber() {
  return Math.floor(Math.random() * 30) + 1;
}

module.exports = class PickANumber extends EventEmitter {

  // returns the initial state known by a game
  static initialState() {
    return { number: newRandomNumber(), position: 0, scores: [0,0,0,0] }
  }

  // returns the last question asked by the game. idempotent, required key 'position'
  ask() {
    return {position: this.state.position, type: 'pick', options: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]};
  }

  // returns state known by a player. idempotent
  playerState(position) {
    return {scores: this.state.scores, position: this.state.position};
  }

  // answers a question asked by the game
  answer(response) {
    if (response.guess === this.state.number) {
      this.state.scores[this.state.position]++;
      if (this.state.scores[this.position] === 3) return this.emit('finished');
      this.state.number = newRandomNumber();
    }

    this.state.position++;
    this.state.position %= 4;
  }
}
