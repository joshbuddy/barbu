# Barbu

The ultimate hope of this is to write a really generic framework for expressing card and board games, but for now, focusing on Barbu!

A game must support the following methods


```javascript
class Game extends EventEmitter {

  // must return an object with the property position on it. must be idempotent
  ask() {
    return {position: 0, ...otherProperties}
  }

  // returns state to a single player. must be idempotent
  playerState(position) {
    return {scores: this.state.scores};
  }

  // answers a question asked by the game
  answer(response) {
    // do something with the response, update this.state
  }

}
```

All games will have a `state` property, which is a json serialized object representing everything the game's entire state.
