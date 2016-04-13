# Barbu

The ultimate hope of this is to write a really generic framework for expressing card and board games, but for now, focusing on Barbu!

A game must support the following methods

```javascript

class PickANumber {

  // returns the initial state known by a game
  static initialState() {
    return { number: Math.floor(Math.random() * 30) + 1, position: 0, scores: [0,0,0,0] }
  }

  // returns the last question asked by the game. idempotent, required key 'position'
  nextQuestion(state) {
    if (Math.max(...state.scores) === 3) return false;
    return {position: state.position, type: 'pick', options: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]};
  }

  // returns state known by a player. idempotent
  playerState(state, position) {
    return {scores: state.scores, position: state.position};
  }

  // answers a question asked by the game, returns the next state
  answer(state, response) {
    if (response.guess === state.number) {
      state.scores[state.position]++;
      state.number = Math.floor(Math.random() * 30) + 1;
    }

    state.position++;
    state.position %= 4;
    return state;
  }
}
```
