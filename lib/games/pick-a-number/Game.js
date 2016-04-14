'use strict';

// guessing game, pick a number from 1-10.
// first player who gets it right wins a point.
// quit after 3 points

function newRandomNumber() {
  return Math.floor(Math.random() * 30) + 1;
}

module.exports = class PickANumber {
  // returns the initial state known by a game
  static initialState() {
    return { number: newRandomNumber(), position: 0, scores: [0,0,0,0] }
  }

  // returns the last question asked by the game. required key 'position'. if no questions left, return false
  nextQuestion(state) {
    if (Math.max(...state.scores) === 3) return false;
    return {position: state.position, type: 'pick', options: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]};
  }

  // returns state specific to a player
  playerState(state, position) {
    return {scores: state.scores, position: state.position};
  }

  // answers a question asked by the game, returns new state
  answer(state, response) {
    if (response.guess === state.number) {
      state.scores[state.position]++;
      if (state.scores[state.position] === 3) return state;
      state.number = newRandomNumber();
    }

    state.position++;
    state.position %= 4;
    return state;
  }
}
