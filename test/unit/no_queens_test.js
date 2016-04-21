const NQ = require('../../lib/games/no-queens/Game');
const Card = require('../../lib/games/no-queens/Card');
const assert = require('assert');

function assertPlayedCard(state, answer, chosenCard) {
  assert.notEqual(state.deal[state.question.position].indexOf(chosenCard), -1, "chosen card "+chosenCard+ " is not in the hand of the person being asked the question");
  assert.notEqual(state.question.values.indexOf(chosenCard), -1, "chosen card "+chosenCard + " is not being prompted to the user as a valid choice");
  // this should be enough but other checks are to ensure the correct answer was constructed properly
  for (var i=0; i<4; i++) {
    if (i == state.question.position) {
      assert.equal(answer.deal[i].length, state.deal[i].length - 1, "player with played card doesn't have one fewer card");
    } else {
      assert.equal(answer.deal[i].length, state.deal[i].length, "player who didn't play a card didn't maintain hand size");
    }
  }
}

function assertTrickCleanup(state, answer, trickPosition) {
  // check that the correct trick winner is being asked the next question
  var winnerPosition;
  var winnerValue = -1;
  var queens = 0;
  for (var i = 0; i < 4; i++) {
    // check for queen
    if (answer.tricks[trickPosition].playedCards[i] % 13 == 10) {
      queens = queens + 1;
    }
    if (answer.tricks[trickPosition].playedCards[i] > winnerValue && Math.floor(answer.tricks[trickPosition].playedCards[i] / 13) == state.currentTrick.suit) {
      winnerPosition = i;
      winnerValue = answer.tricks[trickPosition].playedCards[i];
    }
  }
  if (queens > 0) {
    var oldScoreTotal = state.scores[0] + state.scores[1] + state.scores[2] + state.scores[3];
    var newScoreTotal = answer.scores[0] + answer.scores[1] + answer.scores[2] + answer.scores[3];
    assert.equal(oldScoreTotal - 8 * queens, newScoreTotal, "Score didn't update by the right amount");
  } else {
    assert.deepEqual(state.scores, answer.scores, "Score changed when there was no queen.");
  }
  if (answer.question) {
    assert.equal(answer.question.position, winnerPosition, "The wrong person is being prompted for the next question");
    assert.deepEqual(answer.deal[winnerPosition], answer.question.values, "The lead is corectly being prompted out of the wrong hand");
  }
  assert.equal(answer.currentTrick, null, "Value of current trick was not cleared out");
}

describe("no queens", function() {
  describe("initial state", function() {
    beforeEach(function() {
      this.state = NQ.initialState();
    });
    it("should initiate state", function() {
      assert(typeof this.state != "undefined", "Initial state is undefined");
    });
    it("should deal 4 hands of 13 with no repeats", function() {
      assert.notEqual(this.state.deal, null, "Deal is null");
      assert.equal(this.state.deal.length, 4, "Deal length is "+this.state.deal.length);
      assert.notEqual(this.state.deal[0], null, "Hand 0 is null");
      assert.equal(this.state.deal[0].length, 13, "Hand 0 has " + this.state.deal[0].length + " cards");
      assert.notEqual(this.state.deal[1], null, "Hand 1 is null");
      assert.equal(this.state.deal[1].length, 13, "Hand 1 has " + this.state.deal[1].length + " cards");
      assert.notEqual(this.state.deal[2], null, "Hand 2 is null");
      assert.equal(this.state.deal[2].length, 13, "Hand 2 has " + this.state.deal[2].length + " cards");
      assert.notEqual(this.state.deal[3], null, "Hand 3 is null");
      assert.equal(this.state.deal[3].length, 13, "Hand 3 has " + this.state.deal[3].length + " cards");
      var deck = this.state.deal.reduce(function(a, b) {
        return a.concat(b);
      });
      var cards = [];
      for (var i=0; i<deck.length; i++) {
        assert.equal(cards.indexOf(deck[i]), -1, "There are two copies of " + Card.short(deck[i]));
        cards.push(deck[i]);
      }
    });
    it("should start with an empty array for tricks", function() {
      assert.notEqual(this.state.tricks, null, "tricks is null");
      assert.equal(this.state.tricks.length, 0, "tricks is not empty");
    });
    it("should have currentTrick defined but null", function() {
      assert.notEqual(typeof this.state.currentTrick, "undefined", "currentTrick is undefined");
      assert.equal(this.state.currentTrick, null, "currentTrick is not null");
    });
    it("should initiate scores to 0", function() {
      assert.notEqual(this.state.scores, null, "scores is null");
      assert.equal(this.state.scores.length, 4, "length of scores is " + this.state.scores.length);
      assert.equal(this.state.scores[0], 0, "score[0] is initiated as" + this.state.scores[0] == 0);
      assert.equal(this.state.scores[1], 0, "score[1] is initiated as" + this.state.scores[1] == 0);
      assert.equal(this.state.scores[2], 0, "score[2] is initiated as" + this.state.scores[2] == 0);
      assert.equal(this.state.scores[3], 0, "score[3] is initiated as" + this.state.scores[3] == 0);
    });
    it("should prompt player 0 for the lead", function() {
      assert.notEqual(this.state.question, null, "question is null");
      assert.equal(this.state.question.position, 0, "question is prompting " + this.state.question.position);
      assert.equal(this.state.question.type, "lead", "question type is " + this.state.question.type);
      assert.notEqual(this.state.question.values, null, "no options for lead were offered");
      assert.equal(this.state.question.values.length, 13, this.state.question.values.length + " options were offered for lead instead of 13");
    });
  });
  describe("game play", function() {
    beforeEach(function() {
      this.game = new NQ();
    });
    it("should return the correct state with new question when leading", function() {
      var state = { deal: [ [ 12, 9, 7, 25, 19, 16, 36, 32, 28, 51, 44, 42, 39 ], [ 8, 5, 24, 15, 14, 34, 30, 29, 26, 50, 48, 41, 40 ], [ 10, 3, 0, 23, 22, 20, 13, 38, 35, 33, 49, 46, 45 ], [ 11, 6, 4, 2, 1, 21, 18, 17, 37, 31, 27, 47, 43 ] ], tricks: [], scores: [ 0, 0, 0, 0 ], currentTrick: null, question: { position: 0, values: [ 12, 9, 7, 25, 19, 16, 36, 32, 28, 51, 44, 42, 39 ], type: 'lead' } };

      var correctAnswer = { deal: [ [ 12, 9, 7, 25, 19, 16, 36, 32, 28, 51, 42, 39 ], [ 8, 5, 24, 15, 14, 34, 30, 29, 26, 50, 48, 41, 40 ], [ 10, 3, 0, 23, 22, 20, 13, 38, 35, 33, 49, 46, 45 ], [ 11, 6, 4, 2, 1, 21, 18, 17, 37, 31, 27, 47, 43 ] ], tricks: [], scores: [ 0, 0, 0, 0 ], currentTrick: { suit: 3, playedCards: { '0': 44 }, playedCount: 1 }, question: { position: 1, values: [ 50, 48, 41, 40 ], type: 'follow' } };

      var chosenCard = 44;
      var answer = this.game.answer(state, chosenCard);

      assert.deepStrictEqual(answer, correctAnswer);
      assertPlayedCard(state, answer, chosenCard);
    });
    it("should also return the correct state when second player plays to the trick", function() {
      var state = { deal: [ [ 12, 9, 7, 25, 19, 16, 36, 32, 28, 51, 42, 39 ], [ 8, 5, 24, 15, 14, 34, 30, 29, 26, 50, 48, 41, 40 ], [ 10, 3, 0, 23, 22, 20, 13, 38, 35, 33, 49, 46, 45 ], [ 11, 6, 4, 2, 1, 21, 18, 17, 37, 31, 27, 47, 43 ] ], tricks: [], scores: [ 0, 0, 0, 0 ], currentTrick: { suit: 3, playedCards: { '0': 44 }, playedCount: 1 }, question: { position: 1, values: [ 50, 48, 41, 40 ], type: 'follow' } };

      var correctAnswer = { deal: [ [ 12, 9, 7, 25, 19, 16, 36, 32, 28, 51, 42, 39 ], [ 8, 5, 24, 15, 14, 34, 30, 29, 26, 50, 41, 40 ], [ 10, 3, 0, 23, 22, 20, 13, 38, 35, 33, 49, 46, 45 ], [ 11, 6, 4, 2, 1, 21, 18, 17, 37, 31, 27, 47, 43 ] ], tricks: [], scores: [ 0, 0, 0, 0 ], currentTrick: { suit: 3, playedCards: { '0': 44, '1': 48 }, playedCount: 2 }, question: { position: 2, values: [ 49, 46, 45 ], type: 'follow' } };

      var chosenCard = 48;
      var answer = this.game.answer(state, chosenCard);

      assert.deepStrictEqual(answer, correctAnswer);
      assertPlayedCard(state, answer, chosenCard);
    });
    it("should also return the correct state when third player plays to the trick", function() {
      var state = { deal: [ [ 12, 9, 7, 25, 19, 16, 36, 32, 28, 51, 42, 39 ], [ 8, 5, 24, 15, 14, 34, 30, 29, 26, 50, 41, 40 ], [ 10, 3, 0, 23, 22, 20, 13, 38, 35, 33, 49, 46, 45 ], [ 11, 6, 4, 2, 1, 21, 18, 17, 37, 31, 27, 47, 43 ] ], tricks: [], scores: [ 0, 0, 0, 0 ], currentTrick: { suit: 3, playedCards: { '0': 44, '1': 48 }, playedCount: 2 }, question: { position: 2, values: [ 49, 46, 45 ], type: 'follow' } };
      var correctAnswer = { deal: [ [ 12, 9, 7, 25, 19, 16, 36, 32, 28, 51, 42, 39 ], [ 8, 5, 24, 15, 14, 34, 30, 29, 26, 50, 41, 40 ], [ 10, 3, 0, 23, 22, 20, 13, 38, 35, 33, 49, 45 ], [ 11, 6, 4, 2, 1, 21, 18, 17, 37, 31, 27, 47, 43 ] ], tricks: [], scores: [ 0, 0, 0, 0 ], currentTrick: { suit: 3, playedCards: { '0': 44, '1': 48, '2': 46 }, playedCount: 3 }, question: { position: 3, values: [ 47, 43 ], type: 'follow' } };

      var chosenCard = 46;
      var answer = this.game.answer(state, chosenCard);

      assert.deepStrictEqual(answer, correctAnswer);
      assertPlayedCard(state, answer, chosenCard);
    });
    it("should return correct state with new question for trick winner when last card of trick is played", function() {
      var state = { deal: [ [ 12, 9, 7, 25, 19, 16, 36, 32, 28, 51, 42, 39 ], [ 8, 5, 24, 15, 14, 34, 30, 29, 26, 50, 41, 40 ], [ 10, 3, 0, 23, 22, 20, 13, 38, 35, 33, 49, 45 ], [ 11, 6, 4, 2, 1, 21, 18, 17, 37, 31, 27, 47, 43 ] ], tricks: [], scores: [ 0, 0, 0, 0 ], currentTrick: { suit: 3, playedCards: { '0': 44, '1': 48, '2': 46 }, playedCount: 3 }, question: { position: 3, values: [ 47, 43 ], type: 'follow' } };
      var correctAnswer = { deal: [ [ 12, 9, 7, 25, 19, 16, 36, 32, 28, 51, 42, 39 ], [ 8, 5, 24, 15, 14, 34, 30, 29, 26, 50, 41, 40 ], [ 10, 3, 0, 23, 22, 20, 13, 38, 35, 33, 49, 45 ], [ 11, 6, 4, 2, 1, 21, 18, 17, 37, 31, 27, 43 ] ], tricks: [ { suit: 3, playedCards: { '0': 44, '1': 48, '2': 46, '3': 47 }, leadPosition: 0 } ], scores: [ 0, 0, 0, 0 ], currentTrick: null, question: { position: 1, values: [ 8, 5, 24, 15, 14, 34, 30, 29, 26, 50, 41, 40 ], type: 'lead' } };

      var chosenCard = 47;
      var answer = this.game.answer(state, chosenCard);

      assert.deepStrictEqual(answer, correctAnswer);
      assertPlayedCard(state, answer, chosenCard);
      assertTrickCleanup(state, answer, 0);
    });
    it("should update score when queen is played", function() {
      var state = { deal: [ [ 6, 4, 3, 0, 21, 20, 15, 33, 31, 30, 50, 40 ], [ 11, 9, 7, 1, 19, 16, 38, 37, 28, 27, 51, 45 ], [ 8, 2, 23, 22, 13, 36, 35, 34, 26, 48, 47, 41 ], [ 12, 10, 5, 25, 24, 18, 17, 14, 32, 29, 49, 46, 44 ] ], tricks: [], scores: [ 0, 0, 0, 0 ], currentTrick: { suit: 3, playedCards: { '0': 39, '1': 43, '2': 42 }, playedCount: 3 }, question: { position: 3, values: [ 49, 46, 44 ], type: 'follow' } };
      var correctAnswer = { deal: [ [ 6, 4, 3, 0, 21, 20, 15, 33, 31, 30, 50, 40 ], [ 11, 9, 7, 1, 19, 16, 38, 37, 28, 27, 51, 45 ], [ 8, 2, 23, 22, 13, 36, 35, 34, 26, 48, 47, 41 ], [ 12, 10, 5, 25, 24, 18, 17, 14, 32, 29, 46, 44 ] ], tricks: [ { suit: 3, playedCards: { '0': 39, '1': 43, '2': 42, '3': 49 }, leadPosition: 0 } ], scores: [ 0, 0, 0, -8 ], currentTrick: null, question: { position: 3, values: [ 12, 10, 5, 25, 24, 18, 17, 14, 32, 29, 46, 44 ], type: 'lead' } };

      var chosenCard = 49;
      var answer = this.game.answer(state, chosenCard);

      assert.deepStrictEqual(answer, correctAnswer);
      assertPlayedCard(state, answer, chosenCard);
      assertTrickCleanup(state, answer, 0);
    });
    it("should correctly detect end of game when all 4 queens have bene played", function() {
      var state = { deal: [ [ 8, 34, 32, 30 ], [ 7, 3, 19, 13 ], [ 25, 17, 49, 45, 40 ], [ 9, 0, 20, 18 ] ], tricks: [ { suit: 0, playedCards: { '0': 12, '1': 2, '2': 1, '3': 10 }, leadPosition: 0 }, { suit: 2, playedCards: { '0': 33, '1': 29, '2': 37, '3': 28 }, leadPosition: 0 }, { suit: 2, playedCards: { '0': 26, '1': 38, '2': 35, '3': 36 }, leadPosition: 2 }, { suit: 3, playedCards: { '0': 47, '1': 50, '2': 46, '3': 43 }, leadPosition: 1 }, { suit: 3, playedCards: { '0': 44, '1': 41, '2': 42, '3': 51 }, leadPosition: 1 }, { suit: 1, playedCards:  { '0': 21, '1': 14, '2': 15, '3': 22 }, leadPosition: 3 }, { suit: 0, playedCards: { '0': 5, '1': 4, '2': 6, '3': 11 }, leadPosition: 3 }, { suit: 1, playedCards: { '0': 27, '1': 16, '2': 23, '3': 24 }, leadPosition: 3 } ], scores: [ -8, -8, 0, -8 ], currentTrick: { suit: 3, playedCards: { '0': 31, '1': 39, '3': 48 }, playedCount: 3 }, question: { position: 2, values: [ 49, 45, 40 ], type: 'follow' } };
      var correctAnswer = { deal: [ [ 8, 34, 32, 30 ], [ 7, 3, 19, 13 ], [ 25, 17, 45, 40 ], [ 9, 0, 20, 18 ] ], tricks: [ { suit: 0, playedCards: { '0': 12, '1': 2, '2': 1, '3': 10 }, leadPosition: 0 }, { suit: 2, playedCards: { '0': 33, '1': 29, '2': 37, '3': 28 }, leadPosition: 0 }, { suit: 2, playedCards: { '0': 26, '1': 38, '2': 35, '3': 36 }, leadPosition: 2 }, { suit: 3, playedCards: { '0': 47, '1': 50, '2': 46, '3': 43 }, leadPosition: 1 }, { suit: 3, playedCards: { '0': 44, '1': 41, '2': 42, '3': 51 }, leadPosition: 1 }, { suit: 1, playedCards:  { '0': 21, '1': 14, '2': 15, '3': 22 }, leadPosition: 3 }, { suit: 0, playedCards: { '0': 5, '1': 4, '2': 6, '3': 11 }, leadPosition: 3 }, { suit: 1, playedCards: { '0': 27, '1': 16, '2': 23, '3': 24 }, leadPosition: 3 }, { suit: 3, playedCards: { '0': 31, '1': 39, '2': 49, '3': 48 }, leadPosition: 3 } ], scores: [ -8, -8, -8, -8 ], currentTrick: null, question: null };
      var chosenCard = 49;
      var answer = this.game.answer(state, chosenCard);

      assert.deepStrictEqual(answer, correctAnswer);
      assertPlayedCard(state, answer, chosenCard);
      assertTrickCleanup(state, answer, 8);

    });
    it("should pick the trick winner to be the highest card within the suit rather than highest card", function() {
      var state = { deal: [ [ 11, 10, 19, 16, 13, 42 ], [ 24, 14, 29, 48, 46, 45 ], [ 1, 23, 21, 15, 35, 28, 27 ], [ 9, 0, 20, 36, 32, 31 ] ], tricks: [ { suit: 3, playedCards: { '0': 50, '1': 44, '2': 51, '3': 49 }, leadPosition: 0 }, { suit: 2, playedCards:  { '0': 38, '1': 26, '2': 37, '3': 30 }, leadPosition: 2 }, { suit: 0, playedCards: { '0': 2, '1': 5, '2': 3, '3': 12 }, leadPosition: 0 }, { suit: 0, playedCards: { '0': 6, '1': 8, '2': 7, '3': 4 }, leadPosition: 3 }, { suit: 3, playedCards: { '0': 40, '1': 43, '2': 39, '3': 47 }, leadPosition: 1 }, { suit: 1, playedCards: { '0': 17, '1': 18, '2': 22, '3': 25 }, leadPosition: 3 } ], scores: [ 0, 0, -8, 0 ], currentTrick: { suit: 2, playedCards: { '0': 41, '1': 34, '3': 33 }, playedCount: 3 }, question: { position: 2, values: [ 35, 28, 27 ], type: 'follow' } };
      var correctAnswer = { deal: [ [ 11, 10, 19, 16, 13, 42 ], [ 24, 14, 29, 48, 46, 45 ], [ 1, 23, 21, 15, 28, 27 ], [ 9, 0, 20, 36, 32, 31 ] ], tricks: [ { suit: 3, playedCards: { '0': 50, '1': 44, '2': 51, '3': 49 }, leadPosition: 0 }, { suit: 2, playedCards:  { '0': 38, '1': 26, '2': 37, '3': 30 }, leadPosition: 2 }, { suit: 0, playedCards: { '0': 2, '1': 5, '2': 3, '3': 12 }, leadPosition: 0 }, { suit: 0, playedCards: { '0': 6, '1': 8, '2': 7, '3': 4 }, leadPosition: 3 }, { suit: 3, playedCards: { '0': 40, '1': 43, '2': 39, '3': 47 }, leadPosition: 1 }, { suit: 1, playedCards: { '0': 17, '1': 18, '2': 22, '3': 25 }, leadPosition: 3 }, { suit: 2, playedCards: { '0': 41, '1': 34, '2': 35, '3': 33 }, leadPosition: 3 } ], scores: [ 0, 0, -8, 0 ], currentTrick: null, question: { position: 2, values: [ 1, 23, 21, 15, 28, 27 ], type: 'lead' } };

      var chosenCard = 35;
      var answer = this.game.answer(state, chosenCard);

      assert.deepStrictEqual(answer, correctAnswer);
      assertPlayedCard(state, answer, chosenCard);
      assertTrickCleanup(state, answer, 6);
    });
    it("should offer all other cards when out of suit we're trying to follow", function() {
      var state = { deal: [ [ 12, 9, 7, 6, 3, 20, 49 ], [ 11, 23, 32, 30, 51, 48, 47 ], [ 1, 22, 17, 14, 28, 26, 50 ], [ 4, 2, 25, 21, 16, 13, 38 ] ], tricks: [ { suit: 3, playedCards: { '0': 43, '1': 46, '2': 41, '3': 44 }, leadPosition: 0 }, { suit: 0, playedCards: { '0': 5, '1': 0, '2': 10, '3': 8 }, leadPosition: 1 }, { suit: 3, playedCards: { '0': 40, '1': 42, '2': 45, '3': 39 }, leadPosition: 2 }, { suit: 2, playedCards: { '0': 34, '1': 36, '2': 31, '3': 27 }, leadPosition: 2 }, { suit: 1, playedCards: { '0': 19, '1': 18, '2': 15, '3': 24 }, leadPosition: 1 }, { suit: 2, playedCards: { '0': 35, '1': 29, '2': 37, '3': 33 }, leadPosition: 3 } ], scores: [ 0, -8, -8, 0 ], currentTrick: null, question: { position: 2, values: [ 1, 22, 17, 14, 28, 26, 50 ], type: 'lead' } };
      var correctAnswer = { deal: [ [ 12, 9, 7, 6, 3, 20, 49 ], [ 11, 23, 32, 30, 51, 48, 47 ], [ 1, 22, 17, 14, 28, 26 ], [ 4, 2, 25, 21, 16, 13, 38 ] ], tricks: [ { suit: 3, playedCards: { '0': 43, '1': 46, '2': 41, '3': 44 }, leadPosition: 0 }, { suit: 0, playedCards: { '0': 5, '1': 0, '2': 10, '3': 8 }, leadPosition: 1 }, { suit: 3, playedCards: { '0': 40, '1': 42, '2': 45, '3': 39 }, leadPosition: 2 }, { suit: 2, playedCards: { '0': 34, '1': 36, '2': 31, '3': 27 }, leadPosition: 2 }, { suit: 1, playedCards: { '0': 19, '1': 18, '2': 15, '3': 24 }, leadPosition: 1 }, { suit: 2, playedCards: { '0': 35, '1': 29, '2': 37, '3': 33 }, leadPosition: 3 }, { suit: 2, playedCards: { '0': 35, '1': 29, '2': 37, '3': 33 }, leadPosition: 3 } ], scores: [ 0, -8, -8, 0 ], currentTrick: { suit: 3, playedCards: { '2': 50 }, playedCount: 1 }, question: { position: 3, values: [ 4, 2, 25, 21, 16, 13, 38 ], type: 'follow' } };

      var chosenCard = 50; 
      var answer = this.game.answer(state, chosenCard);
      assert.notEqual(answer.question.values.length, 0);
    });
    it("should be able to play through an entire random game", function() {
      var state = NQ.initialState();
      var prevState;
      var trick = 0;
      do {
        for (var i=0; i<4; i++) {
          var chosenCard = state.question.values[Math.floor(Math.random() * state.question.values.length)];
          answer = this.game.answer(state, chosenCard);
          assertPlayedCard(state, answer, chosenCard);
          prevState = state;
          state = answer;
        }
        assertTrickCleanup(prevState, answer, trick);
        trick = trick + 1;
      } while(state.question != null);
      // check end game state
      assert.equal(state.question, null);
      assert.equal(state.scores[0] + state.scores[1] + state.scores[2] + state.scores[3], -32, "Score is not as expected");
      assert(state.tricks.length <= 13);
      assert.equal(state.tricks.length, trick);
    })
  });
});
