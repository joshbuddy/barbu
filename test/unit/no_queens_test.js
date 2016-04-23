const NQ = require('../../lib/games/no-queens/Game');
const Card = require('../../lib/games/utils/Card');
const Trick = require('../../lib/games/utils/Trick');
const Deck = require('../../lib/games/utils/Deck');
const Deal = require('../../lib/games/utils/Deal');
const Hand = require('../../lib/games/utils/Hand');
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
    var cardRank = Card.getRank(answer.tricks[trickPosition].playedCards[i]);
    if (cardRank == 12) {
      queens = queens + 1;
    }
    if (cardRank > winnerValue && answer.tricks[trickPosition].playedCards[i].charAt(0) == state.currentTrick.suit) {
      winnerPosition = i;
      winnerValue = cardRank;
    }
  }
  if (queens > 0) {
    var oldScoreTotal = state.scores[0] + state.scores[1] + state.scores[2] + state.scores[3];
    var newScoreTotal = answer.scores[0] + answer.scores[1] + answer.scores[2] + answer.scores[3];
    assert.equal(oldScoreTotal + queens, newScoreTotal, "Score didn't update by the right amount");
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
        assert.equal(cards.indexOf(deck[i]), -1, "There are two copies of " + deck[i]);
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
      var state = { deal: [ [ "CA", "CJ", "C9", "DA", "D8", "D5", "HQ", "H8", "H4", "SA", "S7", "S5", "S2" ], [ "CT", "C7", "DK", "D4", "D3", "HT", "H6", "H5", "H2", "SK", "SJ", "S4", "S3" ], [ "CQ", "C5", "C2","DQ", "DJ", "D9", "D2", "HA", "HJ", "H9", "SQ", "S9", "S8" ], [ "CK", "C8", "C6", "C4", "C3", "DT", "D7", "D6", "HK", "H7", "H3", "ST", "S6" ] ], tricks: [], scores: [ 0, 0, 0, 0 ], currentTrick: null, question: { position: 0, values: [ "CA", "CJ", "C9", "DA", "D8", "D5", "HQ", "H8", "H4", "SA", "S7", "S5", "S2" ], type: 'lead' } };

      var correctAnswer = { deal: [ [ "CA", "CJ", "C9", "DA", "D8", "D5", "HQ", "H8", "H4", "SA", "S5", "S2" ], [ "CT", "C7", "DK", "D4", "D3", "HT", "H6", "H5", "H2", "SK", "SJ", "S4", "S3" ], [ "CQ", "C5", "C2","DQ", "DJ", "D9", "D2", "HA", "HJ", "H9", "SQ", "S9", "S8" ], [ "CK", "C8", "C6", "C4", "C3", "DT", "D7", "D6", "HK", "H7", "H3", "ST", "S6" ] ], tricks: [], scores: [ 0, 0, 0, 0 ], currentTrick: { suit: 'S', playedCards: { '0': "S7" }, playedCount: 1 }, question: { position: 1, values: [ "SK", "SJ", "S4", "S3" ], type: 'follow' } };

      var chosenCard = "S7";
      var answer = this.game.answer(state, chosenCard);

      assert.deepStrictEqual(answer, correctAnswer);
      assertPlayedCard(state, answer, chosenCard);
    });
    it("should also return the correct state when second player plays to the trick", function() {
      var state = { deal: [ [ "CA", "CJ", "C9", "DA", "D8", "D5", "HQ", "H8", "H4", "SA", "S5", "S2" ], [ "CT", "C7", "DK", "D4", "D3", "HT", "H6", "H5", "H2", "SK", "SJ", "S4", "S3" ], [ "CQ", "C5", "C2","DQ", "DJ", "D9", "D2", "HA", "HJ", "H9", "SQ", "S9", "S8" ], [ "CK", "C8", "C6", "C4", "C3", "DT", "D7", "D6", "HK", "H7", "H3", "ST", "S6" ] ], tricks: [], scores: [ 0, 0, 0, 0 ], currentTrick: { suit: 'S', playedCards: { '0': "S7" }, playedCount: 1 }, question: { position: 1, values: [ "SK", "SJ", "S4", "S3" ], type: 'follow' } };

      var correctAnswer = { deal: [ [ "CA", "CJ", "C9", "DA", "D8", "D5", "HQ", "H8", "H4", "SA", "S5", "S2" ], [ "CT", "C7", "DK", "D4", "D3", "HT", "H6", "H5", "H2", "SK", "S4", "S3" ], [ "CQ", "C5", "C2","DQ", "DJ", "D9", "D2", "HA", "HJ", "H9", "SQ", "S9", "S8" ], [ "CK", "C8", "C6", "C4", "C3", "DT", "D7", "D6", "HK", "H7", "H3", "ST", "S6" ] ], tricks: [], scores: [ 0, 0, 0, 0 ], currentTrick: { suit: 'S', playedCards: { '0': "S7", '1': "SJ" }, playedCount: 2 }, question: { position: 2, values: [ "SQ", "S9", "S8" ], type: 'follow' } };

      var chosenCard = "SJ";
      var answer = this.game.answer(state, chosenCard);

      assert.deepStrictEqual(answer, correctAnswer);
      assertPlayedCard(state, answer, chosenCard);
    });
    it("should also return the correct state when third player plays to the trick", function() {
      var state = { deal: [ [ "CA", "CJ", "C9", "DA", "D8", "D5", "HQ", "H8", "H4", "SA", "S5", "S2" ], [ "CT", "C7", "DK", "D4", "D3", "HT", "H6", "H5", "H2", "SK", "S4", "S3" ], [ "CQ", "C5", "C2","DQ", "DJ", "D9", "D2", "HA", "HJ", "H9", "SQ", "S9", "S8" ], [ "CK", "C8", "C6", "C4", "C3", "DT", "D7", "D6", "HK", "H7", "H3", "ST", "S6" ] ], tricks: [], scores: [ 0, 0, 0, 0 ], currentTrick: { suit: 'S', playedCards: { '0': "S7", '1': "SJ" }, playedCount: 2 }, question: { position: 2, values: [ "SQ", "S9", "S8" ], type: 'follow' } };
      var correctAnswer = { deal: [ [ "CA", "CJ", "C9", "DA", "D8", "D5", "HQ", "H8", "H4", "SA", "S5", "S2" ], [ "CT", "C7", "DK", "D4", "D3", "HT", "H6", "H5", "H2", "SK", "S4", "S3" ], [ "CQ", "C5", "C2","DQ", "DJ", "D9", "D2", "HA", "HJ", "H9", "SQ", "S8" ], [ "CK", "C8", "C6", "C4", "C3", "DT", "D7", "D6", "HK", "H7", "H3", "ST", "S6" ] ], tricks: [], scores: [ 0, 0, 0, 0 ], currentTrick: { suit: 'S', playedCards: { '0': "S7", '1': "SJ", '2': "S9" }, playedCount: 3 }, question: { position: 3, values: [ "ST", "S6" ], type: 'follow' } };

      var chosenCard = "S9";
      var answer = this.game.answer(state, chosenCard);

      assert.deepStrictEqual(answer, correctAnswer);
      assertPlayedCard(state, answer, chosenCard);
    });
    it("should return correct state with new question for trick winner when last card of trick is played", function() {
      var state = { deal: [ [ "CA", "CJ", "C9", "DA", "D8", "D5", "HQ", "H8", "H4", "SA", "S5", "S2" ], [ "CT", "C7", "DK", "D4", "D3", "HT", "H6", "H5", "H2", "SK", "S4", "S3" ], [ "CQ", "C5", "C2","DQ", "DJ", "D9", "D2", "HA", "HJ", "H9", "SQ", "S8" ], [ "CK", "C8", "C6", "C4", "C3", "DT", "D7", "D6", "HK", "H7", "H3", "ST", "S6" ] ], tricks: [], scores: [ 0, 0, 0, 0 ], currentTrick: { suit: 'S', playedCards: { '0': "S7", '1': "SJ", '2': "S9" }, playedCount: 3 }, question: { position: 3, values: [ "ST", "S6" ], type: 'follow' } };
      var correctAnswer = { deal: [ [ 12, 9, 7, 25, 19, 16, 36, 32, 28, 51, 42, 39 ], [ 8, 5, 24, 15, 14, 34, 30, 29, 26, 50, 41, 40 ], [ 10, 3, 0, 23, 22, 20, 13, 38, 35, 33, 49, 45 ], [ 11, 6, 4, 2, 1, 21, 18, 17, 37, 31, 27, 43 ] ], tricks: [ { suit: 3, playedCards: { '0': 44, '1': 48, '2': 46, '3': 47 }, leadPosition: 0 } ], scores: [ 0, 0, 0, 0 ], currentTrick: null, question: { position: 1, values: [ 8, 5, 24, 15, 14, 34, 30, 29, 26, 50, 41, 40 ], type: 'lead' } };
      var correctAnswer = { deal: [ [ "CA", "CJ", "C9", "DA", "D8", "D5", "HQ", "H8", "H4", "SA", "S5", "S2" ], [ "CT", "C7", "DK", "D4", "D3", "HT", "H6", "H5", "H2", "SK", "S4", "S3" ], [ "CQ", "C5", "C2","DQ", "DJ", "D9", "D2", "HA", "HJ", "H9", "SQ", "S8" ], [ "CK", "C8", "C6", "C4", "C3", "DT", "D7", "D6", "HK", "H7", "H3", "S6" ] ], tricks: [ { suit: 'S', playedCards: { '0': "S7", '1': "SJ", '2': "S9", '3': "ST" }, leadPosition: 0 } ], scores: [ 0, 0, 0, 0 ], currentTrick: null, question: { position: 1, values: [ "CT", "C7", "DK", "D4", "D3", "HT", "H6", "H5", "H2", "SK", "S4", "S3" ], type: 'lead' } };

      var chosenCard = "ST";
      var answer = this.game.answer(state, chosenCard);

      assert.deepStrictEqual(answer, correctAnswer);
      assertPlayedCard(state, answer, chosenCard);
      assertTrickCleanup(state, answer, 0);
    });
    it("should update score when queen is played", function() {
      var state = { deal: [ [ "C8", "C6", "C5", "C2", "DT", "D9", "D4", "H9", "H7", "H6", "SK", "S3" ], [ "CK", "CJ", "C9", "C3", "D8", "D5", "HA", "HK", "H4", "H3", "SA", "S8" ], [ "CT", "C4", "DQ", "DJ", "D2", "HQ", "HJ", "HT", "H2", "SJ", "ST", "S4" ], [ "CA", "CQ", "C7", "DA", "DK", "D7", "D6", "D3", "H8", "H5", "SQ", "S9", "S7" ] ], tricks: [], scores: [ 0, 0, 0, 0 ], currentTrick: { suit: 'S', playedCards: { '0': "S2", '1': "S6", '2': "S5" }, playedCount: 3 }, question: { position: 3, values: [ "SQ", "S9", "S7" ], type: 'follow' } };
      var correctAnswer = { deal: [ [ "C8", "C6", "C5", "C2", "DT", "D9", "D4", "H9", "H7", "H6", "SK", "S3" ], [ "CK", "CJ", "C9", "C3", "D8", "D5", "HA", "HK", "H4", "H3", "SA", "S8" ], [ "CT", "C4", "DQ", "DJ", "D2", "HQ", "HJ", "HT", "H2", "SJ", "ST", "S4" ], [ "CA", "CQ", "C7", "DA", "DK", "D7", "D6", "D3", "H8", "H5", "S9", "S7" ] ], tricks: [ { suit: 'S', playedCards: { '0': "S2", '1': "S6", '2': "S5", '3': "SQ" }, leadPosition: 0 } ], scores: [ 0, 0, 0, 1 ], currentTrick: null, question: { position: 3, values: [ "CA", "CQ", "C7", "DA", "DK", "D7", "D6", "D3", "H8", "H5", "S9", "S7" ], type: 'lead' } };

      var chosenCard = "SQ";
      var answer = this.game.answer(state, chosenCard);

      assert.deepStrictEqual(answer, correctAnswer);
      assertPlayedCard(state, answer, chosenCard);
      assertTrickCleanup(state, answer, 0);
    });
    it("should correctly detect end of game when all 4 queens have bene played", function() {
      var state = { deal: [ [ "CT", "HT", "H8", "H6" ], [ "C9", "C5", "D8", "D2" ], [ "DA", "D6", "SQ", "S8", "S3" ], [ "CJ", "C2", "D9", "D7" ] ], tricks: [ { suit: 'C', playedCards: { '0': "CA", '1': "C4", '2': "C3", '3': "CQ" }, leadPosition: 0 }, { suit: 'H', playedCards: { '0': "H9", '1': "H5", '2': "HK", '3': "H4" }, leadPosition: 0 }, { suit: 'H', playedCards: { '0': "H2", '1': "HA", '2': "HJ", '3': "HQ" }, leadPosition: 2 }, { suit: 'S', playedCards: { '0': "ST", '1': "SK", '2': "S9", '3': "S6" }, leadPosition: 1 }, { suit: 'S', playedCards: { '0': "S7", '1': "S4", '2': "S5", '3': "SA" }, leadPosition: 1 }, { suit: 'D', playedCards:  { '0': "DT", '1': "D3", '2': "D4", '3': "DJ" }, leadPosition: 3 }, { suit: 'C', playedCards: { '0': "C7", '1': "C6", '2': "C8", '3': "CK" }, leadPosition: 3 }, { suit: 'D', playedCards: { '0': "H3", '1': "D5", '2': "DQ", '3': "DK" }, leadPosition: 3 } ], scores: [ 1, 1, 0, 1 ], currentTrick: { suit: 'S', playedCards: { '0': "H7", '1': "S2", '3': "SJ" }, playedCount: 3 }, question: { position: 2, values: [ "SQ", "S8", "S3" ], type: 'follow' } };
      var correctAnswer = { deal: [ [ "CT", "HT", "H8", "H6" ], [ "C9", "C5", "D8", "D2" ], [ "DA", "D6", "S8", "S3" ], [ "CJ", "C2", "D9", "D7" ] ], tricks: [ { suit: 'C', playedCards: { '0': "CA", '1': "C4", '2': "C3", '3': "CQ" }, leadPosition: 0 }, { suit: 'H', playedCards: { '0': "H9", '1': "H5", '2': "HK", '3': "H4" }, leadPosition: 0 }, { suit: 'H', playedCards: { '0': "H2", '1': "HA", '2': "HJ", '3': "HQ" }, leadPosition: 2 }, { suit: 'S', playedCards: { '0': "ST", '1': "SK", '2': "S9", '3': "S6" }, leadPosition: 1 }, { suit: 'S', playedCards: { '0': "S7", '1': "S4", '2': "S5", '3': "SA" }, leadPosition: 1 }, { suit: 'D', playedCards:  { '0': "DT", '1': "D3", '2': "D4", '3': "DJ" }, leadPosition: 3 }, { suit: 'C', playedCards: { '0': "C7", '1': "C6", '2': "C8", '3': "CK" }, leadPosition: 3 }, { suit: 'D', playedCards: { '0': "H3", '1': "D5", '2': "DQ", '3': "DK" }, leadPosition: 3 }, { suit: 'S', playedCards: { '0': "H7", '1': "S2", '2': "SQ", '3': "SJ" }, leadPosition: 3 } ], scores: [ 1, 1, 1, 1 ], currentTrick: null, question: null };
      var chosenCard = "SQ";
      var answer = this.game.answer(state, chosenCard);

      assert.deepStrictEqual(answer, correctAnswer);
      assertPlayedCard(state, answer, chosenCard);
      assertTrickCleanup(state, answer, 8);

    });
    it("should pick the trick winner to be the highest card within the suit rather than highest card", function() {
      var state = { deal: [ [ "CK", "CQ", "D8", "D5", "D2", "S5" ], [ "DK", "D3", "H5", "SJ", "S9", "S8" ], [ "C3", "DQ", "DT", "D4", "HJ", "H4", "H3" ], [ "CJ", "C2", "D9", "HQ", "H8", "H7" ] ], tricks: [ { suit: 'S', playedCards: { '0': "SK", '1': "S7", '2': "SA", '3': "SQ" }, leadPosition: 0 }, { suit: 'H', playedCards:  { '0': "HA", '1': "H2", '2': "HK", '3': "H6" }, leadPosition: 2 }, { suit: 'C', playedCards: { '0': "C4", '1': "C7", '2': "C5", '3': "CA" }, leadPosition: 0 }, { suit: 'C', playedCards: { '0': "C8", '1': "CT", '2': "C9", '3': "C6" }, leadPosition: 3 }, { suit: 'S', playedCards: { '0': "S3", '1': "S6", '2': "S2", '3': "ST" }, leadPosition: 1 }, { suit: 'D', playedCards: { '0': "D6", '1': "D7", '2': "DJ", '3': "DA" }, leadPosition: 3 } ], scores: [ 0, 0, 1, 0 ], currentTrick: { suit: 'H', playedCards: { '0': "S4", '1': "HT", '3': "H9" }, playedCount: 3 }, question: { position: 2, values: [ "HJ", "H4", "H3" ], type: 'follow' } };
      var correctAnswer = { deal: [ [ "CK", "CQ", "D8", "D5", "D2", "S5" ], [ "DK", "D3", "H5", "SJ", "S9", "S8" ], [ "C3", "DQ", "DT", "D4", "H4", "H3" ], [ "CJ", "C2", "D9", "HQ", "H8", "H7" ] ], tricks: [ { suit: 'S', playedCards: { '0': "SK", '1': "S7", '2': "SA", '3': "SQ" }, leadPosition: 0 }, { suit: 'H', playedCards:  { '0': "HA", '1': "H2", '2': "HK", '3': "H6" }, leadPosition: 2 }, { suit: 'C', playedCards: { '0': "C4", '1': "C7", '2': "C5", '3': "CA" }, leadPosition: 0 }, { suit: 'C', playedCards: { '0': "C8", '1': "CT", '2': "C9", '3': "C6" }, leadPosition: 3 }, { suit: 'S', playedCards: { '0': "S3", '1': "S6", '2': "S2", '3': "ST" }, leadPosition: 1 }, { suit: 'D', playedCards: { '0': "D6", '1': "D7", '2': "DJ", '3': "DA" }, leadPosition: 3 }, { suit: 'H', playedCards: { '0': "S4", '1': "HT", '2': "HJ", '3': "H9" }, leadPosition: 3 } ], scores: [ 0, 0, 1, 0 ], currentTrick: null, question: { position: 2, values: [ "C3", "DQ", "DT", "D4", "H4", "H3"  ], type: 'lead' } };

      var chosenCard = "HJ";
      var answer = this.game.answer(state, chosenCard);

      assert.deepStrictEqual(answer, correctAnswer);
      assertPlayedCard(state, answer, chosenCard);
      assertTrickCleanup(state, answer, 6);
    });
    it("should offer all other cards when out of suit we're trying to follow", function() {
      var state = { deal: [ [ "CA", "CJ", "C9", "C8", "C5", "D9", "SQ" ], [ "CK", "DQ", "H8", "H6", "SA", "SJ", "ST" ], [ "C3", "DJ", "D6", "D3", "H4", "H2", "SK" ], [ "C6", "C4", "DA", "DT", "D5", "D2", "HA" ] ], tricks: [ { suit: 'S', playedCards: { '0': "S6", '1': "S9", '2': "S4", '3': "S7" }, leadPosition: 0 }, { suit: 'C', playedCards: { '0': "C7", '1': "C2", '2': "CQ", '3': "CT" }, leadPosition: 1 }, { suit: 'S', playedCards: { '0': "S3", '1': "S5", '2': "S8", '3': "S2" }, leadPosition: 2 }, { suit: 'H', playedCards: { '0': "HT", '1': "HQ", '2': "H7", '3': "H3" }, leadPosition: 2 }, { suit: 'D', playedCards: { '0': "D8", '1': "D7", '2': "D4", '3': "DK" }, leadPosition: 1 }, { suit: 'H', playedCards: { '0': "HJ", '1': "H5", '2': "HK", '3': "H9" }, leadPosition: 3 } ], scores: [ 0, 1, 1, 0 ], currentTrick: null, question: { position: 2, values: [ "C3", "DJ", "D6", "D3", "H4", "H2", "SK" ], type: 'lead' } };
      var currentAnswer = { deal: [ [ "CA", "CJ", "C9", "C8", "C5", "D9", "SQ" ], [ "CK", "DQ", "H8", "H6", "SA", "SJ", "ST" ], [ "C3", "DJ", "D6", "D3", "H4", "H2" ], [ "C6", "C4", "DA", "DT", "D5", "D2", "HA" ] ], tricks: [ { suit: 'S', playedCards: { '0': "S6", '1': "S9", '2': "S4", '3': "S7" }, leadPosition: 0 }, { suit: 'C', playedCards: { '0': "C7", '1': "C2", '2': "CQ", '3': "CT" }, leadPosition: 1 }, { suit: 'S', playedCards: { '0': "S3", '1': "S5", '2': "S8", '3': "S2" }, leadPosition: 2 }, { suit: 'H', playedCards: { '0': "HT", '1': "HQ", '2': "H7", '3': "H3" }, leadPosition: 2 }, { suit: 'D', playedCards: { '0': "D8", '1': "D7", '2': "D4", '3': "DK" }, leadPosition: 1 }, { suit: 'H', playedCards: { '0': "HJ", '1': "H5", '2': "HK", '3': "H9" }, leadPosition: 3 } ], scores: [ 0, 1, 1, 0 ], currentTrick: { suit: 'S', playedCards: { '2': "SK" }, playedCount: 1 }, question: { position: 3, values: [ "C6", "C4", "DA", "DT", "D5", "D2", "HA" ], type: 'follow' } };

      var chosenCard = "SK"; 
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
      assert.equal(state.scores[0] + state.scores[1] + state.scores[2] + state.scores[3], 4, "Score is not as expected");
      assert(state.tricks.length <= 13);
      assert.equal(state.tricks.length, trick);
    })
  });
});
